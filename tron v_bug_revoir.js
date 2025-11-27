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
      else if (arena.grid[i].x == 1 || arena.grid[i].x == 18 || arena.grid[i].y == 1 || arena.grid[i].y == 18) return 10 
      else if (arena.grid[i].x == 2 || arena.grid[i].x == 17 || arena.grid[i].y == 2 || arena.grid[i].y == 17) return 9 
      else if (arena.grid[i].x == 3 || arena.grid[i].x == 16 || arena.grid[i].y == 3 || arena.grid[i].y == 16) return 8 
      else if (arena.grid[i].x == 4 || arena.grid[i].x == 15 || arena.grid[i].y == 4 || arena.grid[i].y == 15) return 7 
      else if (arena.grid[i].x == 5 || arena.grid[i].x == 14 || arena.grid[i].y == 5 || arena.grid[i].y == 14) return 6
      else if (arena.grid[i].x == 6 || arena.grid[i].x == 13 || arena.grid[i].y == 6 || arena.grid[i].y == 13) return 5
      else return 0;
      });
    return(matrice)
  }


  choix(ops, arena, matrice){
    let res = 0
    let temp = 0
    for (let index = 0; index < ops.length; index++) {
      let res_mat=matrice[ops[index][0]*10 + 10 + ops[index][1]]
      if (matrice[ops[index][0]*10 + 10 + ops[index][1]] > temp) {
        temp=matrice[ops[index][0]*10 + 10 + ops[index][1]]
        let moov = arena.getLegalMoves(ops[index][0], ops[index][1])
        for (let xindex = 0; xindex < moov.length; xindex++) {
          console.log(matrice[moov[xindex].xMove*10 + 10 + moov[xindex].yMove])
          if (moov.collision == false && matrice[moov[xindex].xMove*10 + 10 + moov[xindex].yMove] != null){
            if (temp+matrice[moov[xindex].xMove*10 + 10 + moov[xindex].yMove]>temp){
              temp=temp+matrice[moov[xindex].xMove*10 + 10 + moov[xindex].yMove]  
            }
            else {
              res=ops[index]
            }
          }
          else {
            res = ops[index]
          }
        }

      }
    }
    return res
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
      return this.choix(opts,arena,this.Crea_Matrice(arena))
    }
  }
}