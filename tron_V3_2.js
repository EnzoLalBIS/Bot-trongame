class enemyBot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
    this.matrice = this.Crea_Matrice()
  }
  
  // Put your code here
  // This should only return an array containing the choosen coordinates
  // Ex: [2, 1]
  
  
  Crea_Matrice(){
    let mat = []
    for (let index = 0; index < 400; index++) {
      if (index <= 19 || index >= 380){
        mat.push(null)
      }
      else if(index % 20 == 0){
        mat.push(null)
      }
      else{
        mat.push(0)
      }
    }
    return(this.impl_logique(mat))
  }

  impl_logique(matrice){
    let x=this.linkedBike.x
    let y=this.linkedBike.y
    if (this.linkedBike.x==18){
      for (let index = 0; index < 12; index++) {
        x-=1
        matrice[y*20+x]=1000
        y-=1
        matrice[y*20+x]=1000
      }
    }
    else{
      for (let index = 0; index < 12; index++) {
        x+=1
        matrice[y*20+x]=1000
        y+=1
        matrice[y*20+x]=1000
      }
    }
    return matrice
  }

  mat_ap_posi_gauche(arena){
    let posi=this.linkedBike.x*20+this.linkedBike.y
    for (let index = 0; index < 8; index++) { 
      posi-=1
      this.matrice[posi]=1000
      this.ité_mat(arena,700,posi)
    }
    for (let index = 0; index < 8; index++) { 
      posi-=20
      this.matrice[posi]=1000
      this.ité_mat(arena,700,posi)
    }
    return this.matrice
  }

  mat_ap_posi_droite(arena){
    let posi=this.linkedBike.x*20+this.linkedBike.y
    for (let index = 0; index < 8; index++) { 
      posi-=20
      this.matrice[posi]=1000
      this.ité_mat(arena,700,posi)
    }
    for (let index = 0; index < 8; index++) { 
      posi-=1
      this.matrice[posi]=1000
      this.ité_mat(arena,700,posi)
    }
    return this.matrice
  }


  logique_res(posi_en,arena){
    console.log("entrée")
    for (let index = 0; index < 20; index++) {
      if (posi_en < i*20+i && posi_en > (i-1)*20+(i-1)){
        return this.mat_ap_posi_gauche(arena)
      }
    }
    return this.mat_ap_posi_droite(arena)

  }
  

  ité_mat(arena,add,ind){
    if (ind+20<400 && arena.grid[ind+20].content!="Wall"){
      this.matrice[ind+20] += add
    }
    if (ind-20>0 && arena.grid[ind-20].content!="Wall"){
      this.matrice[ind-20] += add
    }
    if (ind-1>0 && arena.grid[ind-1].content!="Wall"){
      this.matrice[ind-1] += add
    }
    if (ind+1>400 && arena.grid[ind+1].content!="Wall"){
      this.matrice[ind+1] += add
    }
  }

  Change_mat(arena){
    let posi_enmy = []
    let ma_posi = []
    for (let index = 0; index < this.matrice.length; index++) {
      if (arena.grid[index].content== "Player" && arena.grid[index].x === this.linkedBike.x && arena.grid[index].y === this.linkedBike.y){
        ma_posi.push(this.linkedBike.x)
        ma_posi.push(this.linkedBike.y)
        this.matrice[index]=="me"
      }
      else if (arena.grid[index].content== "Player"){
        posi_enmy.push(arena.grid[index].x)
        posi_enmy.push(arena.grid[index].y)
        this.matrice[index]=="enmy"
        this.ité_mat(arena,-80,index)
      }
      else if (this.matrice[index] == null){
        this.ité_mat(arena,5,index)
      }
      else if (arena.grid[index].content=="Wall" && arena.grid[index].color==this.linkedBike.wallColor){
        this.matrice[index] = "rouge"
        this.ité_mat(arena,60,index)
      }
      else if (arena.grid[index].content=="Wall"){
        this.matrice[index] = "bleu"
        this.ité_mat(arena,10,index)
      } 
    }
    if ([this.linkedBike.x, this.linkedBike.y]==[13,13]){
      console.log("caca")
      return this.logique_res(posi_enmy[0]*20+posi_enmy[1],arena);
    }
    else{
      return this.matrice
    }
    
  }
  
  

  choix(ops, arena) {
    this.matrice=this.Change_mat(arena)
    const size = arena.gridSize;   
    let meilleurCoup = ops[0];
    let x0 = meilleurCoup[0];
    let y0 = meilleurCoup[1];
    let index0 = (y0 - 1) * size + (x0 - 1);
    let meilleurScore = this.matrice[index0];

    for (let i = 1; i < ops.length; i++) {
      let x = ops[i][0];
      let y = ops[i][1];
      let index = (y - 1) * size + (x - 1);
      let score = this.matrice[index];
      if (score > meilleurScore) {
        meilleurScore = score;
        meilleurCoup = ops[i];
    }
  }
  return meilleurCoup;
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