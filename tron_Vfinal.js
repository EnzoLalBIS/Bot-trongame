class enemyBot {
  constructor(name, linkedBike,arena) {
    this.name = name;
    this.linkedBike = linkedBike;
    this.arena = arena
    this.matrice = this.Crea_Matrice(arena)
  }

  ité_mat(arena,add,ind){
    /* insère des points dans les alentours d'une case */
    let l_mat = this.matrice.length
    const size = arena.gridSize
    if (ind+size<l_mat && arena.grid[ind+size].content!="Wall"){
      this.matrice[ind+size] += add
    }
    if (ind-size>0 && arena.grid[ind-size].content!="Wall"){
      this.matrice[ind-size] += add
    }
    if (ind-1>0 && arena.grid[ind-1].content!="Wall"){
      this.matrice[ind-1] += add
    }
    if (ind+1>l_mat && arena.grid[ind+1].content!="Wall"){
      this.matrice[ind+1] += add
    }
  }
  

  change_mat(mat, arena,ops){
    /*modifie la matrice en fonction des nouveau element
    je ne veux pas aller dans les cases à coter de l'ennemi mais les cases à 2 distance oui pour le bloquer */

    const enemy = currentGame.getOtherPlayer().linkedBike
    const en_ind = enemy.x*20+enemy.y
    const size = arena.gridSize
    this.ité_mat(arena,-4,en_ind)
    if (en_ind+size<size**2){
      this.ité_mat(arena,2,en_ind+size)
    }
    if (en_ind-size>0){
      this.ité_mat(arena,2,en_ind-size)
    }
    if (en_ind+1<size**2){
      this.ité_mat(arena,2,en_ind+1)
    }
    if (en_ind-1>0){
      this.ité_mat(arena,2,en_ind-1)
    }

    return mat
  }


  Crea_Matrice(arena) {
    /* crée une matrice qui me permet d'aller au milieu sans longer les bords*/
  const size = arena.gridSize;
  const center = ((size - 1) / 2);
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
      score += 8; 
    } else if (distBord === 1) {
      score -= 8;
    } else {
      score += distBord; 
    }

    const distCentre = Math.abs(x - center) + Math.abs(y - center);
    const maxDistCentre = (size - 1) * 2;       // distance max possible en manhattan fais avec chat
    const centreBonus = maxDistCentre - distCentre; // plus on est proche du centre, plus c’est grand idem

    score += centreBonus * 0.5;

    return score;
  });

  return matrice;
}


  choix(ops, arena) {
    /* choix du meilleur coup 
    -change la matrice
    -prend le premier BestFinalScore (permet de ne pas prendre forcément l'endroit ou il y a le plus de case)*/
  this.matrice = this.change_mat(this.matrice, arena, ops)
  const size = arena.gridSize

  const spaceWeight = 0.3

  let bestCoup = ops[0]
  let x0 = bestCoup[0]
  let y0 = bestCoup[1]
  let index0 = x0 * size + y0

  let bestFinalScore = this.matrice[index0] + arena.getAvailableTilesNumber(x0, y0) * spaceWeight

  for (let i = 1; i < ops.length; i++) {
    const x = ops[i][0]
    const y = ops[i][1]
    const index = x * size + y

    const baseScore = this.matrice[index]
    const availableSpace = arena.getAvailableTilesNumber(x, y)

    const finalScore = baseScore + availableSpace * spaceWeight

    if (finalScore > bestFinalScore) {
      bestFinalScore = finalScore
      bestCoup = ops[i]
    }
  }

  return bestCoup
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