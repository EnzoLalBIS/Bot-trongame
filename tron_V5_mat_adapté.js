  class Bot {
    constructor(name, linkedBike) {
      this.name = name;
      this.linkedBike = linkedBike;
    }
    
    // Put your code here
    // This should only return an array containing the choosen coordinates
    // Ex: [2, 1]

    change_mat(mat, arena){
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

      return mat
    }


    Crea_Matrice(arena) {
    const size = arena.gridSize;
    const center = (size - 1) / 2;
    const matrice = Array.from({ length: size * size }, (_, i) => {
      const tile = arena.grid[i];
      const x = tile.x;
      const y = tile.y;

      if (tile.content === "Wall") return null;
      if (tile.content === "Player" && x === this.linkedBike.x && y === this.linkedBike.y) return "Me";
      if (tile.content === "Player") return "enemy";


      let score = 0;

      const distBord = Math.min(x, y, size - 1 - x, size - 1 - y);
      if (distBord === 0) {
        // collé au mur
        score -= 15; 
      } else if (distBord === 1) {
        // à une case du mur
        score -= 8;
      } else {
        // plus on est loin du bord, plus on gagne de points
        score += distBord; 
      }

      const distCentre = Math.abs(x - center) + Math.abs(y - center);
      score += (1 + distCentre); // à ajuster selon le ressenti

      return score;
    });

    return this.change_mat(matrice,arena);
  }


    choix(ops, arena, matrice) {
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
        if (score < bestscore && TilesNum<=arena.getAvailableTilesNumber(x, y)) {
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