class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }
  
  // Put your code here
  // This should only return an array containing the choosen coordinates
  // Ex: [2, 1]

  change_mat(mat, arena){
    for (let index = 0; index < mat.length; index++) {
      if (mat[index]=="enemy"){
        if (Number.isInteger(mat[index+10]) && index+10 < mat.length){
          mat[index+10]=7
          mat[index+11]=7
        }
        if (Number.isInteger(mat[index-10]) && index-10 < mat.length){
          mat[index-10]=7
          mat[index-11]=7
        }
        if (Number.isInteger(mat[index-1]) && index+1 < mat.length){
          mat[index-1]=7
          mat[index-2]=7
        }
        if (Number.isInteger(mat[index+1]) && index-1 < mat.length){
          mat[index+1]=7
          mat[index+2]=7
        }
      }
    }
    
    return mat
  }


  Crea_Matrice(arena){
    const matrice = Array.from({ length: arena.gridSize*arena.gridSize}, (_, i) => {
      if (arena.grid[i].content=="Wall") return null;
      else if (arena.grid[i].content=="Player" && arena.grid[i].x==this.linkedBike.x && arena.grid[i].y==this.linkedBike.y) return "Me";
      else if (arena.grid[i].content=="Player") return "enemy";
      else if (arena.grid[i].x == 4 || arena.grid[i].x == 15 || arena.grid[i].y == 4 || arena.grid[i].y == 15) return 1 
      else if (arena.grid[i].x == 5 || arena.grid[i].x == 14 || arena.grid[i].y == 5 || arena.grid[i].y == 14) return 2  
      else if (arena.grid[i].x == 6 || arena.grid[i].x == 13 || arena.grid[i].y == 6 || arena.grid[i].y == 13) return 3
      else if (arena.grid[i].x == 7 || arena.grid[i].x == 12 || arena.grid[i].y == 7 || arena.grid[i].y == 12) return 4
      else if (arena.grid[i].x == 8 || arena.grid[i].x == 11 || arena.grid[i].y == 8 || arena.grid[i].y == 11) return 5
      else if (arena.grid[i].x == 9 || arena.grid[i].x == 10 || arena.grid[i].y == 9 || arena.grid[i].y == 10) return 6
      else return 0;
      });
      return this.change_mat(matrice)}

  choix(ops, arena, matrice) {
    const size = arena.gridSize;   
    let bestCoup = ops[0];
    let x0 = bestCoup[0];
    let y0 = bestCoup[1];
    let index0 = (y0 - 1) * size + (x0 - 1);
    let bestscore = matrice[index0];
    let TilesNum=arena.getAvailableTilesNumber(x0, y0)

    for (let i = 1; i < ops.length; i++) {
      let x = ops[i][0];
      let y = ops[i][1];
      let index = (y - 1) * size + (x - 1);
      let score = matrice[index] + matrice[index+1] + matrice[index+2];
      console.log(TilesNum)
      if (score > bestscore && TilesNum<=arena.getAvailableTilesNumber(x, y)) {
        bestscore = score;
        bestCoup = ops[i];
        TilesNum = arena.getAvailableTilesNumber(x, y)
        console.log("changment")
        console.log(TilesNum)
    }
  }
  return bestCoup;
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