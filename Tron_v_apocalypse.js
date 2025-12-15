class Blitzkrig {

    constructor(name, linkedBike) {
        this.name = name;
        this.linkedBike = linkedBike;
        this.matrice = this.Crea_Matrice();
        this.spaceCache = new Map();
    }

    // =========================
    // Utils : Cache espace (grille réelle uniquement)
    // =========================
    getCachedSpace(arena, x, y) {
        const key = `${x},${y}`;
        if (this.spaceCache.has(key)) return this.spaceCache.get(key);
        const val = arena.getAvailableTilesNumber(x, y);
        this.spaceCache.set(key, val);
        return val;
    }

    isChokePoint(arena, x, y) {
    const moves = arena.getLegalMoves(x, y, false)
        .filter(m => m.collision === false);

    // une seule sortie = couloir
    if (moves.length !== 1) return false;

    const nx = moves[0].xMove;
    const ny = moves[0].yMove;

    // distance à l’adversaire
    const op = currentGame.getOtherPlayer().linkedBike;
    const dist = Math.abs(nx - op.x) + Math.abs(ny - op.y);

    return dist <= 2;
  }

    // =========================
    // Matrice : ité_mat / change_mat / Crea_Matrice / choix
    // =========================

    ité_mat(arena, add, ind) {
        /* insère des points dans les alentours d'une case */
        const l_mat = this.matrice.length;
        const size = arena.gridSize;

        if (ind < 0 || ind >= l_mat) return;
        if (!arena.grid[ind]) return;

        const col = ind % size;

        const tryAdd = (idx) => {
            if (idx < 0 || idx >= l_mat) return;
            const tile = arena.grid[idx];
            if (!tile) return;
            if (tile.content === "Wall") return;
            if (typeof this.matrice[idx] === "number") {
                this.matrice[idx] += add;
            }
        };

        // Bas
        tryAdd(ind + size);
        // Haut
        tryAdd(ind - size);
        // Gauche (anti-wrap)
        if (col > 0) tryAdd(ind - 1);
        // Droite (anti-wrap)
        if (col < size - 1) tryAdd(ind + 1);
    }

    change_mat(mat, arena, ops) {
        /* modifie la matrice en fonction des nouveau element */
        const enemy = currentGame.getOtherPlayer().linkedBike;
        const en_ind = enemy.x * arena.gridSize + enemy.y;

        this.ité_mat(arena, -2, en_ind);

        // On “tente” autour (ité_mat protège déjà les bords)
        this.ité_mat(arena, 2, en_ind + arena.gridSize);
        this.ité_mat(arena, 2, en_ind - arena.gridSize);
        this.ité_mat(arena, 2, en_ind + 1);
        this.ité_mat(arena, 2, en_ind - 1);

        return mat;
    }

    Crea_Matrice() {
        const size = 20;
        const center = ((size - 1) / 2) * 0.5;

        const matrice = Array.from({ length: size * size }, (_, i) => {
            const tile = currentArena.grid[i];
            if (!tile) return null;

            const x = tile.x;
            const y = tile.y;

            if (tile.content === "Wall") return null;

            if (tile.content === "Player" && x === this.linkedBike.x && y === this.linkedBike.y) return "Me";
            if (tile.content === "Player") return "enemy";

            let score = 0;
            const distBord = Math.min(x, y, size - 1 - x, size - 1 - y);

            if (distBord === 0) score += 8;
            else if (distBord === 1) score -= 8;
            else score += distBord;

            const distCentre = Math.abs(x - center) + Math.abs(y - center);
            const maxDistCentre = (size - 1) * 2;
            const centreBonus = maxDistCentre - distCentre;

            score += centreBonus * 0.5;

            return score;
        });

        return matrice;
    }

    choix(ops, arena) {
        /* choix du meilleur coup (ops = [[x,y], [x,y], ...]) */
        this.matrice = this.change_mat(this.matrice, arena, ops);

        const size = arena.gridSize;
        const spaceWeight = 0.3;

        let bestCoup = ops[0];

        const x0 = bestCoup[0];
        const y0 = bestCoup[1];
        const index0 = x0 * size + y0;
        const v0 = this.matrice[index0];
        const base0 = (typeof v0 === "number") ? v0 : -99999;

        let bestFinalScore = base0 + this.getCachedSpace(arena, x0, y0) * spaceWeight;

        for (let i = 1; i < ops.length; i++) {
            const x = ops[i][0];
            const y = ops[i][1];
            const index = x * size + y;

            const v = this.matrice[index];
            const baseScore = (typeof v === "number") ? v : -99999;

            const availableSpace = this.getCachedSpace(arena, x, y);
            const finalScore = baseScore + availableSpace * spaceWeight;

            if (finalScore > bestFinalScore) {
                bestFinalScore = finalScore;
                bestCoup = ops[i];
            }
        }

        return bestCoup; 
    }

    // =========================
    // Anti-blocage : heuristiques
    // =========================

    evaluateSurvivalBonusFast(arena, x, y) {
        const legal = arena.getLegalMoves(x, y, false).filter(m => m.collision === false);
        if (legal.length === 0) return -2000;
        if (legal.length === 1) return -600;
        return legal.length * 30;
    }

    evaluateMyWallsPenaltyFast(space) {
        // “Prend en compte mes murs” = si ton espace explorable est faible, tu es coincé par TES murs.
        if (space <= 3) return -800;
        if (space <= 6) return -250;
        return 0;
    }

    // =========================
    // Minimax 1-ply optimisé + anti-blocage + murs
    // =========================

    calculateOnePlyMinimax_Optimized(myMove, arena, myBike, opponentBike) {
        const newX = myMove.xMove;
        const newY = myMove.yMove;
        const oldX = myBike.x;
        const oldY = myBike.y;
        const size = arena.gridSize;

        const oldIdx = oldX * size + oldY;
        const newIdx = newX * size + newY;

        if (!arena.grid[newIdx]) return -Infinity;

        // Préfiltre (rapide) : évite les coups suicides sans simuler
        const fastSurvival = this.evaluateSurvivalBonusFast(arena, newX, newY);
        if (fastSurvival <= -2000) return fastSurvival;

        // Cache LOCAL de simulation (safe : la grille ne change plus pendant cette évaluation)
        const simCache = new Map();
        const simSpace = (x, y) => {
            const key = `${x},${y}`;
            if (simCache.has(key)) return simCache.get(key);
            const val = arena.getAvailableTilesNumber(x, y);
            simCache.set(key, val);
            return val;
        };

        // Sauvegarde état
        const savedOld = arena.grid[oldIdx].content;
        const savedNew = arena.grid[newIdx].content;
        const savedLink = arena.grid[newIdx].linkedPlayer;
        const ox = myBike.x;
        const oy = myBike.y;

        // Simulation : laisse une traînée (mur)
        arena.grid[oldIdx].content = "Wall";
        arena.grid[newIdx].content = "Player";
        arena.grid[newIdx].linkedPlayer = myBike;
        myBike.x = newX;
        myBike.y = newY;

        // Moi : espace + survie + pénalité murs (auto-enfermement)
        const mySpace = simSpace(newX, newY);
        const survivalBonus = this.evaluateSurvivalBonusFast(arena, newX, newY);
        const wallPenalty = this.evaluateMyWallsPenaltyFast(mySpace);

        // Adversaire : meilleur espace immédiat
        const opMoves = arena.getLegalMoves(opponentBike.x, opponentBike.y, false);
        let bestOpSpace = -Infinity;

        if (!opMoves || opMoves.length === 0) {
            bestOpSpace = -1000;
        } else {
            for (const op of opMoves) {
                if (op.collision === false) {
                    const s = simSpace(op.xMove, op.yMove);
                    if (s > bestOpSpace) bestOpSpace = s;
                }
            }
            if (bestOpSpace === -Infinity) bestOpSpace = -1000;
        }

        // Restauration
        arena.grid[oldIdx].content = savedOld;
        arena.grid[newIdx].content = savedNew;
        arena.grid[newIdx].linkedPlayer = savedLink;
        myBike.x = ox;
        myBike.y = oy;

        let chokePenalty = 0;
        if (this.isChokePoint(arena, newX, newY)) {
        chokePenalty = -1200;
        }

        // Score final (valeur Minimax augmentée)
        return (
            mySpace * 1.35           // je privilégie mon territoire
            - bestOpSpace * 1.15     // je contrôle l’adversaire
            + survivalBonus          // anti-cul-de-sac
            + wallPenalty            // anti auto-blocage par mes murs
            +chokePenalty           
        );
    }

    findBestMinimaxMove(arena, legalMoves, opponentBike) {
        let best = -Infinity;
        let bestMoves = [];

        for (const move of legalMoves) {
            if (move.collision === false) {
                const score = this.calculateOnePlyMinimax_Optimized(move, arena, this.linkedBike, opponentBike);
                move.score = score;

                if (score > best) {
                    best = score;
                    bestMoves = [move];
                } else if (score === best) {
                    bestMoves.push(move);
                }
            }
        }

        if (bestMoves.length > 0) {
            const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            return [chosen.xMove, chosen.yMove];
        }
        return null;
    }

    // =========================
    // Décision finale
    // =========================
    getMove(arena) {
        // Cache pour la grille réelle (pas la simulation)
        this.spaceCache.clear();

        let opts = [];
        let maxi_tiles = 1;

        const legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);

        // 1) scoring de base (grille réelle => cache OK)
        for (let i = 0; i < legalMoves.length; i++) {
            if (legalMoves[i].collision === false) {
                const tilesNum = this.getCachedSpace(arena, legalMoves[i].xMove, legalMoves[i].yMove);

                if (tilesNum > maxi_tiles) {
                    opts = [[legalMoves[i].xMove, legalMoves[i].yMove]];
                    maxi_tiles = tilesNum;
                } else if (tilesNum === maxi_tiles) {
                    opts.push([legalMoves[i].xMove, legalMoves[i].yMove]);
                }
            }
        }

        const opponentBike = currentGame.getOtherPlayer().linkedBike;
        const myBike = this.linkedBike;
        const dist_bot = Math.abs(myBike.x - opponentBike.x) + Math.abs(myBike.y - opponentBike.y);

        // Aucun coup safe => on renvoie le 1er légal si possible
        if (opts.length === 0) {
            if (legalMoves.length > 0) return [legalMoves[0].xMove, legalMoves[0].yMove];
            return null;
        }

        // 2) Combat proche => Minimax optimisé anti-blocage
        if (dist_bot < 6) {
            const min_max = this.findBestMinimaxMove(arena, legalMoves, opponentBike);
            if (min_max) return min_max;
        }

        // 3) Sinon : meilleur par TilesNum puis matrice
        if (opts.length === 1) {
            return opts[0];
        }
        return this.choix(opts, arena);
    }
}


