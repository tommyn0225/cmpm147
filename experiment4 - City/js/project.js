// Author: Tommy Nguyen
// Date: 4/28/2025
"use strict";

/* Neon Metropolis Infinite Strip Generator
   ----------------------------------------
   - Shows 10 rows (0–9) of neon towers infinitely in +X direction
   - Buildings vary in shape, size, color, and flickering windows
   - Click a tile to override its hue
   - Flying cars spawn and zip across the strip
   - Uses a simple JS hash for deterministic randomness
*/

/* global noiseSeed, randomSeed, noise, random, floor, millis,
   push, pop, translate, beginShape, vertex, endShape,
   fill, noStroke, stroke, text, rect, ellipse, map,
   sin, colorMode, HSB, worldToScreen, camera_offset */

// --- 32-bit JS string hash (no wasm dependency) ---
function hash32(str, seed = 0) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// --- Global state ---
let worldSeed;
let baseHue;
let overrideHue = {};
let cars = [];

// preload hook (no assets)
function p3_preload() {}

// setup hook: set HSB for neon
function p3_setup() {
  colorMode(HSB, 360, 100, 100, 255);
}

// called when seed changes
function p3_worldKeyChanged(key) {
  worldSeed   = hash32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  baseHue     = random(0, 360);
  overrideHue = {};
  cars        = [];
}

// tile dimensions
function p3_tileWidth()  { return 32; }
function p3_tileHeight() { return 16; }

// click override
function p3_tileClicked(i, j) {
  if (i >= 0 && j >= 0 && j < 10) {
    const k = `${i},${j}`;
    overrideHue[k] = random(0, 360);
  }
}

function p3_drawBefore() {}

function p3_drawTile(i, j) {
  const tw = p3_tileWidth();
  const th = p3_tileHeight();

  // grid outline
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

  // only rows 0–9, x>=0
  if (!(i >= 0 && j >= 0 && j < 10)) return;

  // base diamond
  noStroke();
  fill(220, 10, 20, 200);
  beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
  endShape(CLOSE);

  // building height via noise
  const n = noise(i * 0.1, j * 0.1);
  const baseH = map(n, 0, 1, 20, 100);
  const hFac = (hash32(`hfac:${i},${j}`, worldSeed) % 100) / 99;
  const wFac = (hash32(`wfac:${i},${j}`, worldSeed) % 100) / 99;
  const heightVal = baseH * map(hFac, 0, 1, 0.6, 1.4);
  const widthF = map(wFac, 0, 1, 0.6, 1.4);
  if (heightVal < 12) return;

  // color override or seeded
  const keyStr = `${i},${j}`;
  const hueVal = overrideHue[keyStr] !== undefined
    ? overrideHue[keyStr]
    : (baseHue + n * 80) % 360;

  // building type
  const type = hash32(`type:${i},${j}`, worldSeed) % 5;

  // draw building
  push();
    noStroke();
    fill(hueVal, 100, 80, 200);
    switch(type) {
      case 0: {
        const bw0 = tw * 0.6 * widthF;
        const bh0 = heightVal * 0.5;
        rect(-bw0/2, -bh0, bw0, bh0);
        break;
      }
      case 1: {
        const bw1 = tw * 0.8 * widthF;
        rect(-bw1/2, -heightVal, bw1, heightVal);
        break;
      }
      case 2: {
        const radius = tw * 0.5 * widthF;
        ellipse(0, -heightVal/2, radius, radius);
        rect(-radius/2, -heightVal, radius, heightVal);
        break;
      }
      case 3:
        beginShape();
          vertex(-tw*0.5*widthF, 0);
          vertex(0, -heightVal);
          vertex(tw*0.5*widthF, 0);
        endShape(CLOSE);
        break;
      case 4:
        for (let lvl=0; lvl<4; lvl++) {
          const frac = 1 - lvl/4;
          const bw4  = tw * frac * widthF;
          const bh4  = heightVal / 4;
          rect(-bw4/2, -bh4*(lvl+1), bw4, bh4);
        }
        break;
    }
  pop();

  // flickering windows
  fill(0, 0, 100, sin(millis()/200 + i + j)*100 + 100);
  if (type===0) {
    rect(-tw*0.3*widthF, -heightVal*0.25, tw*0.6*widthF, 4);
  } else if (type===1) {
    const bw1 = tw*0.8*widthF;
    for (let yy=-heightVal+8; yy<0; yy+=8) {
      for (let xx=-bw1/2+3; xx<bw1/2-3; xx+=6) {
        rect(xx, yy, 3, 5);
      }
    }
  } else if (type===2) {
    for (let xx=-tw*0.25*widthF; xx<tw*0.25*widthF; xx+=6) {
      rect(xx, -heightVal+10, 2, heightVal-20);
    }
  } else if (type===3) {
    rect(-6, -heightVal*0.5, 12, 8);
  } else {
    for (let lvl=0; lvl<4; lvl++) {
      const frac = 1 - lvl/4;
      const bw4  = tw * frac * widthF;
      const bh4  = heightVal / 4;
      rect(-bw4/2 + 4, -bh4*(lvl+1) + 4, bw4 - 8, 4);
    }
  }
}

// highlight selected tile
function p3_drawSelectedTile(i, j) {
  const tw = p3_tileWidth(), th = p3_tileHeight();
  if (!(i>=0 && j>=0 && j<10)) return;
  noFill();
  stroke(100,100,100,200);
  strokeWeight(1);
  beginShape();
    vertex(-tw,0); vertex(0,th); vertex(tw,0); vertex(0,-th);
  endShape(CLOSE);
  noStroke();
  fill(0);
  text(`(${i},${j})`, -tw/2, -th/2);
}

// animate cars
function p3_drawAfter() {
  const tw = p3_tileWidth(), th = p3_tileHeight();
  if (random() < 0.02) {
    cars.push({ x:0, y:floor(random(0,10)), speed:random(0.05,0.2), hue:(baseHue+random(-30,30)+360)%360 });
  }
  noStroke();
  for (let idx=cars.length-1; idx>=0; idx--) {
    const c = cars[idx];
    c.x += c.speed;
    if (c.x>=0 && c.x<200) {
      const [cx,cy] = worldToScreen([c.x,c.y],[camera_offset.x,camera_offset.y]);
      push(); translate(-cx,cy);
        fill(c.hue,80,100,200);
        rect(-tw*0.3,-th*0.2,tw*0.6,th*0.3,3);
      pop();
    }
    if (c.x>200) cars.splice(idx,1);
  }
}
