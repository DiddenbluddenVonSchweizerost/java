const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const spriteSheet = document.getElementById("bild");
const hpbar = document.getElementById("hp");
const monsterrun = document.getElementById("monsterrun");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* =====================
   BACKGROUNDS
===================== */

const layerIds = ["11","10","9","8","7","6","5","4","3","2","1","0"];

const speeds = [
0.05,0.08,0.1,0.15,
0.2,0.3,0.4,0.6,
0.8,1.0,1.2,1.5
];

const backgrounds = [];

layerIds.forEach((id,idx)=>{
    const img = document.getElementById(id);
    if(!img){
        console.warn("Layer saknas:",id);
        return;
    }
    backgrounds.push({
        img:img,
        x:0,
        speed:speeds[idx] || 1
    });
});

/* =====================
   SPRITE
===================== */

const spriteWidth = 80;
const spriteHeight = 80;
const monsterWidth=80;
const monsterHeight=64;

let row = 0;
let totalFrames = 9;

const scale = 2;

/* =====================
   SEPARATE ANIMATION TIMERS
===================== */

let playerFrameIndex = 0;
let playerFrameTimer = 0;
let playerFrameDuration = 100;

let monsterFrameIndex = 0;
let monsterFrameTimer = 0;
let monsterFrameDuration = 110;

/* =====================
   FPS
===================== */

let lastTimestamp = 0;
let maxFPS = 30;
let timestep = 1000/maxFPS;

/* =====================
   PLAYER POSITION
===================== */

let kx = canvas.width/2-spriteWidth*scale/2;
let ky = canvas.height - spriteHeight*scale;
let velocityY = 0;
let canJump = true;

const GRAVITY = 1;

let V = false;

/* =====================
   PAUSE
===================== */

let isPaused = false;

const resumeButton={
x:canvas.width/2-100,
y:canvas.height/2-50,
width:200,
height:40,
text:"Återuppta spel"
};

const quitButton={
x:canvas.width/2-100,
y:canvas.height/2+20,
width:200,
height:40,
text:"Börja om"
};

/* =====================
   PLAYER
===================== */

let spelare={
hitstaken:0,    
speed:3,
jump:20,
njumps:2,

direction:{
up:false,
down:false,
left:false,
right:false
},

hitbox:{
width:40*scale,
height:30*scale,
OffSetX:17*scale,
OffSetY:33*scale
}};

/* =====================
   MONSTER
===================== */

let monster={
   speed:2,
   x:100,
   y:canvas.height - monsterHeight*scale,
   facingRight:true,
   hp:2,
   alive:true,
   inv:false
};

/* =====================
SKADA VArIABLER
===================== */

let playerInv=false;
let playerInvTimer=0;
let Askada = false;

/* =====================
   INPUT
===================== */

document.addEventListener("keydown",(event)=>{

if(event.code==="Escape"){
   isPaused=!isPaused;
   return;
}

if(event.code==="Space"){
    if(canJump){
    velocityY=-spelare.jump;
    spelare.njumps--;
    if(spelare.njumps<=0) canJump=false;
}}

if(event.code==="KeyD") spelare.hitstaken+=1;
if(event.code==="KeyE") spelare.direction.down=true;
if(event.code==="ArrowLeft") spelare.direction.left=true;
if(event.code==="ArrowRight") spelare.direction.right=true;
});

document.addEventListener("keyup",(event)=>{
if(event.code==="ArrowLeft") spelare.direction.left=false;
if(event.code==="ArrowRight") spelare.direction.right=false;
});

/* =====================
   GAME LOOP
===================== */

let moveX=0;

function gameLoop(){

   moveX=0;

   if(isPaused){
      requestAnimationFrame(gameLoop);
      return;
   }

   row=0;
   totalFrames=9;

   if(spelare.direction.left){
      V=true;
      row=1;
      totalFrames=6;
      moveX=-spelare.speed*scale;
   }

   if(spelare.direction.right){
      V=false;
      row=1;
      totalFrames=6;
      moveX=spelare.speed*scale;
   }

   backgrounds.forEach(bg=>{
      bg.x-=moveX*bg.speed;
      bg.x=bg.x%928;
      if(bg.x>464) bg.x-=928;
      if(bg.x<=-464) bg.x+=928;
   });

   velocityY+=GRAVITY;
   ky+=velocityY;

   if(ky+spriteHeight*scale+30>=canvas.height){
      ky=canvas.height-spriteHeight*scale-30;
      velocityY=0;
      canJump=true;
      spelare.njumps=2;
   }

   if(spelare.direction.down){
      row=2;
      totalFrames=12;
      if(playerFrameIndex===11) spelare.direction.down=false;
   }

   /* ===== HITBOXER ===== */

   const playerBox={
      x:kx+spelare.hitbox.OffSetX,
      y:ky+spelare.hitbox.OffSetY,
      w:spelare.hitbox.width,
      h:spelare.hitbox.height
   };

   const monsterBox={
      x:monster.x,
      y:monster.y-monsterHeight,
      w:monsterWidth*scale,
      h:monsterHeight*scale
   };

   const overlap = (
      playerBox.x < monsterBox.x + monsterBox.w/1.5 &&
      playerBox.x + playerBox.w/1.5 > monsterBox.x &&
      playerBox.y < monsterBox.y + monsterBox.h &&
      playerBox.y + playerBox.h > monsterBox.y
   );

   /* ===== SPELAREN TAR SKADA ===== */

   if(monster.alive && overlap && !playerInv){
      Askada=true;
      spelare.hitstaken += 1;
      playerInv = true;
      playerInvTimer = Date.now();
   }

    if(Askada == true){
      row= 3;
      totalFrames = 5;
      if(playerFrameIndex === 4){
         Askada = false;
      }}

   if(playerInv && Date.now() - playerInvTimer > 3000){
      playerInv = false;
   }

   /* ===== SVÄRD HITBOX ===== */

   if(spelare.direction.down && monster.alive){

      const swordBox={
         x: V ? playerBox.x-40 : playerBox.x+playerBox.w,
         y: playerBox.y,
         w:40,
         h:playerBox.h
      };

      const swordHit = (
         swordBox.x < monsterBox.x + monsterBox.w &&
         swordBox.x + swordBox.w > monsterBox.x &&
         swordBox.y < monsterBox.y + monsterBox.h &&
         swordBox.y + swordBox.h > monsterBox.y
      );

      if(swordHit && !monster.inv){
         monster.hp--;
         monster.inv = true;

         setTimeout(()=>monster.inv=false,3000);

         if(monster.hp <= 0){
            monster.alive=false;

            setTimeout(()=>{
               monster.hp=2;
               monster.alive=true;
               monster.x = Math.random()<0.5 ? -200 : canvas.width+200;
            },2000);
         }
      }
   }

   requestAnimationFrame(gameLoop);
}

/* =====================
   DRAW 
===================== */

function draw(timestamp){

   if(timestamp-lastTimestamp<timestep){
      requestAnimationFrame(draw);
      return;
   }

   const deltaTime = timestamp - lastTimestamp;
   lastTimestamp=timestamp;

   playerFrameTimer += deltaTime;
   if(playerFrameTimer >= playerFrameDuration){
      playerFrameTimer = 0;
      playerFrameIndex = (playerFrameIndex + 1) % totalFrames;
   }

   monsterFrameTimer += deltaTime;
   if(monsterFrameTimer >= monsterFrameDuration){
      monsterFrameTimer = 0;
      monsterFrameIndex = (monsterFrameIndex + 1) % 8;
   }

   ctx.clearRect(0,0,canvas.width,canvas.height);

   backgrounds.forEach(bg=>{
      ctx.drawImage(bg.img,0,0,928,793,bg.x-928,-325,canvas.width,canvas.height+350);
      ctx.drawImage(bg.img,0,0,928,793,bg.x,-325,canvas.width,canvas.height+350);
      ctx.drawImage(bg.img,0,0,928,793,bg.x+928,-325,canvas.width,canvas.height+350);
   });

   ctx.save();

   ctx.drawImage(hpbar,spelare.hitstaken*112,0,112,32,0,canvas.height-64,224,64);

   drawmonster();

   ctx.save();

   if(V){
      ctx.scale(-1,1);
      ctx.drawImage(
         spriteSheet,
         playerFrameIndex*spriteWidth,
         row*spriteHeight,
         spriteWidth,
         spriteHeight,
         -kx-spriteWidth*scale,
         ky,
         spriteWidth*scale,
         spriteHeight*scale
      );
   }else{
      ctx.drawImage(
         spriteSheet,
         playerFrameIndex*spriteWidth,
         row*spriteHeight,
         spriteWidth,
         spriteHeight,
         kx,
         ky,
         spriteWidth*scale,
         spriteHeight*scale
      );
   }

   ctx.restore();

   if(isPaused) drawPauseMenu();

   ctx.restore();

   requestAnimationFrame(draw);
}

/* =====================
   MONSTER DRAW 
===================== */

function drawmonster(){

   if(!monster.alive) return;

   ctx.save();

   if (monster.facingRight && monster.x-150 > kx) monster.facingRight=false;
   else if (!monster.facingRight && monster.x+150 < kx) monster.facingRight=true;

   if(monster.facingRight){
      monster.x += -moveX + monster.speed * scale;

      ctx.scale(-1,1);

      ctx.drawImage(
         monsterrun,
         monsterFrameIndex * monsterWidth,
         0,
         monsterWidth,
         monsterHeight,
         -monster.x - monsterWidth * scale,
         monster.y - monsterHeight,
         monsterWidth * scale,
         monsterHeight * scale
      );

   } else {

      monster.x -= moveX + monster.speed * scale;

      ctx.drawImage(
         monsterrun,
         monsterFrameIndex * monsterWidth,
         0,
         monsterWidth,
         monsterHeight,
         monster.x,
         monster.y - monsterHeight,
         monsterWidth * scale,
         monsterHeight * scale
      );
   }

   ctx.restore();
}

/* =====================
   PAUSE MENU
===================== */

function drawPauseMenu(){

   ctx.fillStyle="rgba(0,0,0,0.7)";
   ctx.fillRect(0,0,canvas.width,canvas.height);

   ctx.fillStyle="white";
   ctx.font="48px Arial";
   ctx.textAlign="center";
   ctx.fillText("PAUS",canvas.width/2,canvas.height/2-100);

   ctx.fillStyle="#4CAF50";
   ctx.fillRect(resumeButton.x,resumeButton.y,resumeButton.width,resumeButton.height);
   ctx.fillStyle="white";
   ctx.font="24px Arial";
   ctx.fillText(resumeButton.text,canvas.width/2,resumeButton.y+28);

   ctx.fillStyle="#f44336";
   ctx.fillRect(quitButton.x,quitButton.y,quitButton.width,quitButton.height);
   ctx.fillStyle="white";
   ctx.fillText(quitButton.text,canvas.width/2,quitButton.y+28);

   ctx.textAlign="left";
}

/* =====================
   START
===================== */

requestAnimationFrame(draw);
gameLoop();


