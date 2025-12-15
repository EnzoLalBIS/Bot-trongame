class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }
  
  // Put your code here
  // This should only return an array containing the choosen coordinates
  // Ex: [2, 1]

  change_mat(mat, arena,ops){
    const size = arena.gridSize; 
    for (let index = 0; index < mat.length; index++) {
      if (mat[index]=="enemy"){
        if (Number.isInteger(mat[index+size]) && index+size < mat.length){
          mat[index+size]=-3
          mat[index+size+1]=-3
        }
        if (Number.isInteger(mat[index-size]) && index-size < mat.length){
          mat[index-size]=-3
          mat[index-size+1]=-3
        }
        if (Number.isInteger(mat[index-1]) && index+1 < mat.length){
          mat[index-1]=-3
          mat[index-2]=-3
        }
        if (Number.isInteger(mat[index+1]) && index-1 < mat.length){
          mat[index+1]=-3
          mat[index+2]=-3
        }
      }
    }
    let TilesNum=arena.getAvailableTilesNumber(ops[0][0], ops[0][1])
    
      for (let index = 0; index < ops.length; index++) {
        if (TilesNum>arena.getAvailableTilesNumber(ops[index][0], ops[index][1])) {
          let posi_mat = ops[index][0] * arena.gridSize + ops[index][1]
          mat[posi_mat]= -20
          TilesNum=arena.getAvailableTilesNumber(ops[index][0], ops[index][1])
        } 
      }

    return mat
  }


  Crea_Matrice(arena) {
  const size = arena.gridSize;
  const center = (size - 1) / 2;
  const matrice = Array.from({ length: size * size }, (_, i) => {
    const tile = arena.grid[i];
    console.log(tile)
    const x = tile.x;
    const y = tile.y;

    if (tile.content === "Wall") return null;
    if (tile.content === "Player" && x === this.linkedBike.x && y === this.linkedBike.y) return "Me";
    if (tile.content === "Player") return "enemy";


    let score = 0;

    const distBord = Math.min(x, y, size - 1 - x, size - 1 - y);
    if (distBord === 0) {
      score -= 15; 
    } else if (distBord === 1) {
      score -= 8;
    } else {
      score += distBord; 
    }

    const distCentre = Math.abs(x - center) + Math.abs(y - center);
    const maxDistCentre = (size - 1) * 2;       // distance max possible en manhattan
    const centreBonus = maxDistCentre - distCentre; // plus on est proche du centre, plus c’est grand

    score += centreBonus * 0.5;

    return score;
  });

  return matrice;
}


  choix(ops, arena) {
    let matrice=this.Crea_Matrice(arena)
    matrice=this.change_mat(matrice,arena,ops)
    const size = arena.gridSize;   
    let bestCoup = ops[0]
    let x0 = bestCoup[0]
    let y0 = bestCoup[1]
    let index0 = x0 * size + y0
    let bestscore = matrice[index0]
    let TilesNum=arena.getAvailableTilesNumber(x0, y0)

    for (let i = 1; i < ops.length; i++) {
      let x = ops[i][0];
      let y = ops[i][1];
      let index = x* size + y
      let score = matrice[index]
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
      return this.choix(opts,arena)
    }
  }
}
