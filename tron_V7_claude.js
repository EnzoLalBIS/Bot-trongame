class enemyBot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }

  //----------------------------------------- 
  // Trouver l'ennemi
  //----------------------------------------- 
  findEnemy(arena) {
    const size = arena.gridSize;
    for (let i = 0; i < size * size; i++) {
      const tile = arena.grid[i];
      if (tile.content === "Player") {
        if (!(tile.x === this.linkedBike.x && tile.y === this.linkedBike.y)) {
          return { x: tile.x, y: tile.y };
        }
      }
    }
    return null;
  }

  //----------------------------------------- 
  // BFS pour calculer les territoires accessibles
  // Retourne une map de distances depuis un point
  //----------------------------------------- 
  calculerDistances(startX, startY, arena) {
    const size = arena.gridSize;
    const distances = new Map();
    const queue = [[startX, startY, 0]];
    distances.set(`${startX},${startY}`, 0);

    while (queue.length > 0) {
      const [x, y, dist] = queue.shift();

      const voisins = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ];

      for (let [nx, ny] of voisins) {
        const key = `${nx},${ny}`;
        if (distances.has(key)) continue;
        if (!arena.isValidMove(nx, ny)) continue;
        if (arena.checkCollision(nx, ny)) continue;

        distances.set(key, dist + 1);
        queue.push([nx, ny, dist + 1]);
      }
    }

    return distances;
  }

  //----------------------------------------- 
  // Analyse Voronoi : qui contrôle quelles cases ?
  //----------------------------------------- 
  analyserTerritoire(myX, myY, enemyX, enemyY, arena) {
    const myDistances = this.calculerDistances(myX, myY, arena);
    const enemyDistances = this.calculerDistances(enemyX, enemyY, arena);

    let myTerritory = 0;
    let enemyTerritory = 0;
    let contested = 0;

    // Pour chaque case accessible, déterminer qui la contrôle
    myDistances.forEach((myDist, key) => {
      const enemyDist = enemyDistances.get(key);
      
      if (enemyDist === undefined) {
        // Ennemi ne peut pas l'atteindre
        myTerritory++;
      } else if (myDist < enemyDist) {
        myTerritory++;
      } else if (myDist > enemyDist) {
        enemyTerritory++;
      } else {
        contested++;
      }
    });

    return { myTerritory, enemyTerritory, contested, total: myDistances.size };
  }

  //----------------------------------------- 
  // Évaluer la qualité d'une position avec getLineSize
  //----------------------------------------- 
  evaluerPosition(x, y, arena) {
    const directions = [
      [1, 0],   // droite
      [-1, 0],  // gauche
      [0, 1],   // bas
      [0, -1]   // haut
    ];

    let totalEspace = 0;
    let minEspace = Infinity;
    let directionsOuvertes = 0;

    directions.forEach(dir => {
      const line = arena.getLineSize(x, y, dir);
      totalEspace += line.lineSize;
      minEspace = Math.min(minEspace, line.lineSize);
      
      if (line.lineSize > 3) {
        directionsOuvertes++;
      }
    });

    // Pénalité si on a un couloir très étroit (risque de piège)
    let dangerScore = 0;
    if (minEspace <= 1) dangerScore = -100;
    else if (minEspace === 2) dangerScore = -50;
    else if (minEspace === 3) dangerScore = -20;

    return {
      totalEspace,
      minEspace,
      directionsOuvertes,
      dangerScore,
      moyenneEspace: totalEspace / 4
    };
  }

  //----------------------------------------- 
  // Calculer le score stratégique d'un mouvement
  //----------------------------------------- 
  scorerMouvement(x, y, arena, enemy) {
    let score = 0;

    // === CRITÈRE 1 : ESPACE ACCESSIBLE (Priorité absolue) ===
    const espaceAccessible = arena.getAvailableTilesNumber(x, y);
    score += espaceAccessible * 100;

    // === CRITÈRE 2 : QUALITÉ DE LA POSITION (getLineSize) ===
    const qualite = this.evaluerPosition(x, y, arena);
    score += qualite.totalEspace * 10;
    score += qualite.directionsOuvertes * 40;
    score += qualite.dangerScore; // Pénalité couloirs étroits

    // === CRITÈRE 3 : DISTANCE AUX BORDS ===
    const size = arena.gridSize;
    const distBord = Math.min(x, y, size - 1 - x, size - 1 - y);
    
    if (distBord === 0) score -= 80;      // Bord = très mauvais
    else if (distBord === 1) score -= 40; // Proche bord = mauvais
    else if (distBord === 2) score -= 10; // Un peu proche
    else score += distBord * 3;           // Centre = bon

    // === CRITÈRE 4 : ANALYSE TERRITORIALE ===
    if (enemy) {
      const territoire = this.analyserTerritoire(x, y, enemy.x, enemy.y, arena);
      const ratio = territoire.myTerritory / (territoire.enemyTerritory + 1);

      // Stratégie adaptative selon le ratio de territoire
      if (ratio < 0.5) {
        // ON EST EN DANGER : Mode survie
        score += espaceAccessible * 150; // Triple priorité à l'espace
        score += territoire.myTerritory * 20;
        
        // S'éloigner de l'ennemi en urgence
        const distEnemy = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
        score += distEnemy * 30;
        
      } else if (ratio < 0.8) {
        // ON EST DÉSAVANTAGÉ : Mode défensif
        score += territoire.myTerritory * 10;
        const distEnemy = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
        score += distEnemy * 15;
        
      } else if (ratio > 1.5) {
        // ON DOMINE : Mode agressif
        score += territoire.myTerritory * 5;
        
        // Se rapprocher pour couper l'ennemi
        const distEnemy = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
        score -= distEnemy * 10; // Bonus pour se rapprocher
        
        // Bonus si on réduit le territoire ennemi
        score -= territoire.enemyTerritory * 3;
        
      } else {
        // ÉQUILIBRÉ : Mode standard
        score += territoire.myTerritory * 8;
        score += territoire.contested * 2;
      }

      // === CRITÈRE 5 : DISTANCE À L'ENNEMI (Dijkstra) ===
      const distEnemy = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
      
      // Pénalité forte si trop proche (risque de collision)
      if (distEnemy <= 2) {
        score -= 60;
      } else if (distEnemy <= 4) {
        score -= 20;
      } else {
        score += distEnemy * 2; // Bonus distance normale
      }
    }

    // === CRITÈRE 6 : CENTRE DE LA GRILLE ===
    const center = (size - 1) / 2;
    const distCentre = Math.abs(x - center) + Math.abs(y - center);
    score -= distCentre * 2; // Légère préférence pour le centre

    // === CRITÈRE 7 : FLEXIBILITÉ FUTURE ===
    const futureOptions = arena.getLegalMoves(x, y, false).length;
    if (futureOptions === 0) score -= 1000;      // Impasse totale
    else if (futureOptions === 1) score -= 500;  // Très dangereux
    else if (futureOptions === 2) score -= 100;  // Risqué
    else score += futureOptions * 30;            // Plus d'options = mieux

    return score;
  }

  //----------------------------------------- 
  // Détection de situation critique
  //----------------------------------------- 
  estEnDanger(arena, enemy) {
    if (!enemy) return false;

    const mySpace = arena.getAvailableTilesNumber(this.linkedBike.x, this.linkedBike.y);
    const enemySpace = arena.getAvailableTilesNumber(enemy.x, enemy.y);

    // On est en danger si on a moins de 60% de l'espace de l'ennemi
    return mySpace < enemySpace * 0.6;
  }

  //----------------------------------------- 
  // GET MOVE : Décision finale
  //----------------------------------------- 
  getMove(arena) {
    const legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);
    const enemy = this.findEnemy(arena);

    // Filtrer les moves sans collision
    let validMoves = legalMoves.filter(m => !m.collision);

    // Cas d'urgence : aucun move valide
    if (validMoves.length === 0) {
      return [legalMoves[0].xMove, legalMoves[0].yMove];
    }

    // Cas simple : un seul move
    if (validMoves.length === 1) {
      return [validMoves[0].xMove, validMoves[0].yMove];
    }

    // === STRATÉGIE PRINCIPALE ===
    
    // 1) Calculer l'espace maximal disponible
    let maxSpace = 0;
    validMoves.forEach(m => {
      const space = arena.getAvailableTilesNumber(m.xMove, m.yMove);
      if (space > maxSpace) maxSpace = space;
    });

    // 2) Filtrer les moves qui ont au moins 90% de l'espace max
    // (permet de considérer plusieurs options sans se limiter)
    const threshold = maxSpace * 0.9;
    let candidats = validMoves.filter(m => {
      const space = arena.getAvailableTilesNumber(m.xMove, m.yMove);
      return space >= threshold;
    });

    // Si on est en danger, on est plus strict : on prend SEULEMENT le max
    if (this.estEnDanger(arena, enemy)) {
      candidats = validMoves.filter(m => {
        const space = arena.getAvailableTilesNumber(m.xMove, m.yMove);
        return space === maxSpace;
      });
    }

    // 3) Scorer tous les candidats
    let bestMove = null;
    let bestScore = -Infinity;

    candidats.forEach(m => {
      const score = this.scorerMouvement(m.xMove, m.yMove, arena, enemy);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    });

    return [bestMove.xMove, bestMove.yMove];
  }
}