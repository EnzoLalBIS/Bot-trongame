class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }
  
  // Put your code here
  // This should only return an array containing the choosen coordinates
  // Ex: [2, 1]
  
  
  Crea_Matrice(arena){
    const matrice = Array.from({ length: arena.gridSize*arena.gridSize}, (_, i) => {
      if (arena.grid[i].content=="Wall") return null;
      else if (arena.grid[i].x == 1 || arena.grid[i].x == 18 || arena.grid[i].y == 1 || arena.grid[i].y == 18) return 1
      else if (arena.grid[i].x == 2 || arena.grid[i].x == 17 || arena.grid[i].y == 2 || arena.grid[i].y == 17) return 2
      else if (arena.grid[i].x == 3 || arena.grid[i].x == 16 || arena.grid[i].y == 3 || arena.grid[i].y == 16) return 3
      else if (arena.grid[i].x == 4 || arena.grid[i].x == 15 || arena.grid[i].y == 4 || arena.grid[i].y == 15) return 4 
      else if (arena.grid[i].x == 5 || arena.grid[i].x == 14 || arena.grid[i].y == 5 || arena.grid[i].y == 14) return 5  
      else if (arena.grid[i].x == 6 || arena.grid[i].x == 13 || arena.grid[i].y == 6 || arena.grid[i].y == 13) return 6
      else return 0;
      });
    return(matrice)
  }


  
  choix(ops, arena, matrice) {
    const size = arena.gridSize;   
    let meilleurCoup = ops[0];
    let x0 = meilleurCoup[0];
    let y0 = meilleurCoup[1];
    let index0 = (y0 - 1) * size + (x0 - 1);
    let meilleurScore = matrice[index0];

    for (let i = 1; i < ops.length; i++) {
      let x = ops[i][0];
      let y = ops[i][1];
      let index = (y - 1) * size + (x - 1);
      let score = matrice[index];
      if (score > meilleurScore) {
        meilleurScore = score;
        meilleurCoup = ops[i];
    }
  }
  return meilleurCoup;
  }
  
  
  getMove(arena) {
    console.log(this.Crea_Matrice(arena))
    let opts = []
    let maxi_tiles=1
    let legalMoves=arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y)
    for (let index = 0; index < legalMoves.length; index++) {
      if (legalMoves[index].collision == false){
        let TilesNum=arena.getAvailableTilesNumber(legalMoves[index].xMove, legalMoves[index].yMove)
        if (TilesNum > maxi_tiles){
          opts=[]
          opts.push([legalMoves[index].xMove, legalMoves[index].yMove])
          maxi_tiles=TilesNum
        }
        else if (TilesNum == maxi_tiles){
          opts.push([legalMoves[index].xMove, legalMoves[index].yMove])
        }
      }
    }
    if (opts.length===0) {
      return [legalMoves[0].xMove, legalMoves[0].yMove]
    }
    else if(opts.length===1){
      return opts[0]
    }
    else {
      return this.choix(opts,arena,this.Crea_Matrice(arena))
    }
  }
}
