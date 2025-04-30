"use strict";

/* Infinite Space Generator – Glitch port using XXH hashes
   ------------------------------------------------------
   - Feature parity: galaxies, planets, asteroids, stars, shooting stars, ship
   - Deterministic per-tile via XXH.h32
   - Hooks into engine.js via p3_* functions
*/

/* global XXH, noiseSeed, randomSeed, worldToScreen, camera_offset,
   noise, map, millis, push, pop, translate, rotate,
   beginShape, vertex, endShape, fill, noStroke, stroke,
   background, ellipse, width, height, sin, random, TWO_PI, cos, abs */

// Global state
let worldSeed;
let spaceship = { x: 0, y: 0 };
let target    = { x: 0, y: 0 };
let shootingStars = [];
let lastStarSpawn = 0;

// Preload (no assets)
function p3_preload() {}

// Setup: HSB color mode
function p3_setup() {
  colorMode(HSB, 360, 100, 100, 255);
}

// Called whenever the world-key input changes
function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  spaceship = { x: 0, y: 0 };
  target    = { x: 0, y: 0 };
  shootingStars = [];
  lastStarSpawn = millis();
}

// Tile dimensions
function p3_tileWidth()  { return 32; }
function p3_tileHeight() { return 16; }

// Determine if a tile contains a star, planet, galaxy, or asteroid
function isStar(i,j)    { return XXH.h32(`star:${i},${j}`,worldSeed) % 20  < 1; }
function isPlanet(i,j)  { return XXH.h32(`planet:${i},${j}`,worldSeed) % 200 < 4; }
function isGalaxy(i,j)  { return XXH.h32(`galaxy:${i},${j}`,worldSeed) % 500 < 3; }
function isAsteroid(i,j){ return XXH.h32(`asteroid:${i},${j}`,worldSeed) % 100 < 10; }

// Handle clicks in the infinite +X, -Y region
function p3_tileClicked(i, j) {
  if (i >= 0 && j <= 0
      && !isStar(i,j)
      && !isPlanet(i,j)
      && !isGalaxy(i,j)
      && !isAsteroid(i,j)) {
    target.x = i;
    target.y = j;
  }
}

// Clear background before drawing tiles
function p3_drawBefore() {
  background(260, 50, 5);
}

// Draw each tile (grid + content)
function p3_drawTile(i, j) {
  const tw = p3_tileWidth(), th = p3_tileHeight();

  // faint isometric grid cell
  push();
    stroke(0, 0, 60, 100);
    strokeWeight(1);
    noFill();
    beginShape();
      vertex(-tw, 0);
      vertex(0, th);
      vertex(tw, 0);
      vertex(0, -th);
    endShape(CLOSE);
  pop();

  // only the infinite top-right
  if (!(i >= 0 && j <= 0)) return;

  push();
    if      (isGalaxy(i,j))   drawGalaxy(i,j);
    else if (isPlanet(i,j))   drawPlanet(i,j, tw, th);
    else if (isAsteroid(i,j)) drawAsteroid(i,j, tw, th);
    else if (isStar(i,j))     drawStar(i,j, tw, th);
  pop();
}

// Star rendering
function drawStar(i,j,tw,th) {
  noStroke();
  const a = map(sin(millis()/500 + i*3 + j*7), -1, 1, 150, 255);
  fill(0, 0, 100, a);
  const x = map(noise(i+100, j+100), 0, 1, -tw*0.4, tw*0.4);
  const y = map(noise(i+200, j+200), 0, 1, -th*0.4, th*0.4);
  ellipse(x, y, 2, 2);
}

// Planet rendering
function drawPlanet(i,j,tw,th) {
  noStroke();
  const type   = XXH.h32(`ptype:${i},${j}`,worldSeed)%3;
  const hue    = XXH.h32(`phue:${i},${j}`,worldSeed)%360;
  const radius = map(XXH.h32(`prad:${i},${j}`,worldSeed)%100,
                     0, 99, tw*0.8, tw*1.6);
  const ang    = millis() / 10000;
  push(); rotate(ang);
    fill(hue, 80, 100, 200);
    ellipse(0, 0, radius, radius);
    if (type === 1) {
      noFill(); stroke(hue, 80, 80, 150); strokeWeight(2);
      ellipse(0, 0, radius*1.4, radius*0.6);
    } else if (type === 2) {
      for (let k=0; k<3; k++) {
        const sx = XXH.h32(`craterX:${i},${j},${k}`,worldSeed)%100;
        const sy = XXH.h32(`craterY:${i},${j},${k}`,worldSeed)%100;
        const sr = XXH.h32(`craterR:${i},${j},${k}`,worldSeed)%100;
        const cx = map(sx, 0, 99, -radius/3, radius/3);
        const cy = map(sy, 0, 99, -radius/3, radius/3);
        const cr = map(sr, 0, 99, radius*0.1, radius*0.2);
        fill(0, 0, 20, 200);
        ellipse(cx, cy, cr, cr);
      }
    }
  pop();
}

// Asteroid rendering
function drawAsteroid(i,j,tw,th) {
  noStroke(); fill(0, 0, 50, 200);
  const r   = tw*0.5;
  const ang = millis() / 5000;
  push(); rotate(ang);
    beginShape();
      for (let k=0; k<6; k++) {
        const sd  = XXH.h32(`astPt:${i},${j},${k}`,worldSeed)%100;
        const rad = map(sd, 0,99, r*0.6, r);
        const tht = k/6 * TWO_PI;
        vertex(rad * cos(tht), rad * sin(tht));
      }
    endShape(CLOSE);
  pop();
}

// Galaxy rendering
function drawGalaxy(i,j) {
  const hueVal = XXH.h32(`ghue:${i},${j}`,worldSeed)%360;
  const size   = p3_tileWidth() * 2;
  const ang    = millis() / 5000;
  push(); rotate(ang);
    stroke(hueVal, 80,100,150); strokeWeight(3); noFill();
    for (let a=0; a<5; a++) {
      push(); rotate(ang + a * TWO_PI/5);
        beginShape();
          for (let r=0; r<size; r+=4) {
            const tht = (r/size)*TWO_PI;
            vertex(r*cos(tht), r*sin(tht));
          }
        endShape();
      pop();
    }
  pop();
}

// After tiles: shooting stars & ship
function p3_drawAfter() {
  // shooting stars
  if (millis() - lastStarSpawn > random(2000,5000)) {
    shootingStars.push({
      x: random(0,width), y: -10,
      vx: random(5,10),  vy: random(2,5),
      life: 0
    });
    lastStarSpawn = millis();
  }
  noStroke();
  for (let i=shootingStars.length-1; i>=0; i--) {
    const s = shootingStars[i];
    s.x += s.vx; s.y += s.vy; s.life++;
    fill(60,0,100, map(s.life,0,30,255,0));
    ellipse(s.x, s.y, 4, 2);
    if (s.life>30) shootingStars.splice(i,1);
  }

  // move & draw ship
  spaceship.x += (target.x - spaceship.x)*0.1;
  spaceship.y += (target.y - spaceship.y)*0.1;
  const [sx,sy] = worldToScreen(
    [spaceship.x, spaceship.y],
    [camera_offset.x, camera_offset.y]
  );
  push(); translate(-sx, sy);
    const moving = abs(target.x - spaceship.x) > 0.01 || abs(target.y - spaceship.y) > 0.01;
    if (moving) {
      noStroke(); fill(0,100,100,200);
      ellipse(0,8,8,4);
    }
    rotate(-PI/4);
    noStroke(); fill(210,10,70,255);
    beginShape(); vertex(0,-8); vertex(-6,6); vertex(6,6); endShape(CLOSE);
  pop();
}
