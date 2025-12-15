class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }

  //-----------------------------------------
  // Trouver l’ennemi
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
  // MATRICE DIJKSTRA (distance à l’ennemi)
  //-----------------------------------------
  Crea_Matrice_Dijkstra(arena) {
    const size = arena.gridSize;
    const total = size * size;

    // 1) trouver l'ennemi
    const enemy = this.findEnemy(arena);
    if (!enemy) {
      return Array.from({ length: total }, (_, i) => {
        const tile = arena.grid[i];
        if (tile.content === "Wall") return null;
        return 0;
      });
    }

    // 2) tableau des distances
    const dist = Array(total).fill(-1);

    // fonction pour convertir x,y → index
    function getIndex(x, y) {
      return y * size + x;
    }

    // 3) BFS
    const queue = [];
    const startIndex = getIndex(enemy.x, enemy.y);

    dist[startIndex] = 0;
    queue.push(startIndex);

    while (queue.length > 0) {
      const current = queue.shift();

      const cx = current % size;
      const cy = Math.floor(current / size);
      const currentDist = dist[current];

      const voisins = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx,     y: cy + 1 },
        { x: cx,     y: cy - 1 },
      ];

      for (let v of voisins) {
        if (v.x < 0 || v.x >= size || v.y < 0 || v.y >= size) continue;

        const idx = getIndex(v.x, v.y);
        const tile = arena.grid[idx];

        if (tile.content === "Wall") continue;
        if (dist[idx] !== -1) continue;

        dist[idx] = currentDist + 1;
        queue.push(idx);
      }
    }

    // 4) trouver la distance max
    let maxDist = 0;
    for (let i = 0; i < total; i++) {
      if (dist[i] > maxDist) maxDist = dist[i];
    }

    // 5) créer la matrice finale (DEFENSIVE : loin = mieux)
    const matrice = Array.from({ length: total }, (_, i) => {
      const tile = arena.grid[i];

      if (tile.content === "Wall") return null;

      if (dist[i] === -1) return 20; // case que l’ennemi n’atteint pas → hyper safe

      return dist[i]; // plus loin = meilleur score
    });

    return matrice;
  }

  //-----------------------------------------
  // CHOIX SIMPLE : prend le move avec le meilleur score dans la matrice
  //-----------------------------------------
  choix(ops, arena) {
    const size = arena.gridSize;
    const matrice = this.Crea_Matrice_Dijkstra(arena);

    function getIndex(x, y) {
      return y * size + x;
    }

    let best = ops[0];
    let bestScore = matrice[getIndex(best[0], best[1])];

    for (let i = 1; i < ops.length; i++) {
      const x = ops[i][0];
      const y = ops[i][1];

      const score = matrice[getIndex(x, y)];

      if (score > bestScore) {
        best = ops[i];
        bestScore = score;
      }
    }

    return best;
  }

  //-----------------------------------------
  // GET MOVE : ta logique + Dijkstra pour départager
  //-----------------------------------------
  getMove(arena) {
    let opts = [];
    let maxi_tiles = 1;

    const legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);

    for (let m of legalMoves) {
      if (!m.collision) {
        const tiles = arena.getAvailableTilesNumber(m.xMove, m.yMove);

        if (tiles > maxi_tiles) {
          opts = [];
          opts.push([m.xMove, m.yMove]);
          maxi_tiles = tiles;
        } else if (tiles === maxi_tiles) {
          opts.push([m.xMove, m.yMove]);
        }
      }
    }

    if (opts.length === 0) return [legalMoves[0].xMove, legalMoves[0].yMove];
    if (opts.length === 1) return opts[0];

    // plusieurs moves ont le même espace → on départage avec Dijkstra
    return this.choix(opts, arena);
  }
}
