
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
      else if (arena.grid[i].content=="Player") return "p" // si l’index est pair
      else return 0;             // sinon
      });
    return(matrice)
  }

  predi_matrice(arena, mat, move, lim){
    if (lim > 800){
      return mat
    }
    for (let index = 0; index < move.length; index++) {
      if (move[index].collision == false){
        let xcoord = move[index].xMove
        let ycoord = move[index].yMove
        let TilesNum=arena.getAvailableTilesNumber(xcoord, ycoord)
        mat[xcoord*10 + 10 + ycoord]=TilesNum
        return this.predi_matrice(arena, mat, arena.getLegalMoves(xcoord, ycoord),lim+1)
      }
    }
  }
  
  
  getMove(arena) {
    let opts = []
    let maxi_tiles=1
    let legalMoves=arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y)
    let matri=this.Crea_Matrice(arena)
    console.log(this.predi_matrice(arena,matri,legalMoves, 0))
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
      let nb_rnd=Math.floor(Math.random() * opts.length);
      return opts[nb_rnd]
    }
  }
}