"use strict";
/* global XXH, noiseSeed, randomSeed, color, noise, background, millis,
   fill, noStroke, stroke, strokeWeight,
   push, pop, beginShape, vertex, endShape, map */

function p3_preload() {}
function p3_setup() {}

let worldSeed;
// per-tile override: cycles through water, sand, dirt, grass, stone
let overrides = {};

function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  overrides = {};
}

function p3_tileWidth()  { return 40; }
function p3_tileHeight() { return 20; }

const tw = p3_tileWidth();
const th = p3_tileHeight();

// order of cycle
const TYPES = ["water", "sand", "dirt", "grass", "stone"];

function p3_tileClicked(i, j) {
  const k = `${i},${j}`;
  if (overrides[k] != null) {
    overrides[k] = (overrides[k] + 1) % TYPES.length;
  } else {
    overrides[k] = 0;
  }
}

function p3_drawBefore() {
  // day/night sky
  const t = millis() / 10000;
  const skyVal = map(Math.sin(t), -1, 1, 50, 200);
  background(100, skyVal, 255);
}

function p3_drawTile(i, j) {
  noStroke();
  let type;
  const k = `${i},${j}`;

  // override if clicked
  if (overrides[k] != null) {
    type = TYPES[overrides[k]];
  } else {
    // procedural noise
    const s = 0.1;
    const n = noise(i * s, j * s);
    if      (n < 0.3) type = "stone";
    else if (n < 0.4) type = "sand";
    else if (n < 0.5) type = "water";
    else if (n < 0.6) type = "dirt";
    else              type = "grass";
  }

  // choose colors
  let topC, sideC;
  switch (type) {
    case "stone":
      topC = color(160);
      sideC = color(140);
      break;
    case "sand":
      topC = color(194, 178, 128);
      sideC = color(174, 158, 108);
      break;
    case "water":
      topC = color(64, 164, 223, 200);
      sideC = color(64, 164, 223, 150);
      break;
    case "dirt":
      topC = color(134,  96,  67);
      sideC = color(114,  76,  47);
      break;
    case "grass":
      topC = color( 95, 159,  53);
      sideC = color( 75, 139,  33);
      break;
  }

  push();
    // top face
    fill(topC);
    beginShape();
      vertex(-tw,  0);
      vertex(  0, -th);
      vertex( tw,  0);
      vertex(  0,  th);
    endShape(CLOSE);

    // left face
    fill(sideC);
    beginShape();
      vertex(-tw,      0);
      vertex(   0,     th);
      vertex(   0, th+th);
      vertex(-tw,     th);
    endShape(CLOSE);

    // right face
    beginShape();
      vertex( tw,      0);
      vertex(  0,     th);
      vertex(  0, th+th);
      vertex( tw,     th);
    endShape(CLOSE);
  pop();
}

function p3_drawSelectedTile(i, j) {
  noFill();
  stroke(255, 0, 0, 150);
  beginShape();
    vertex(-tw,  0);
    vertex(  0, -th);
    vertex( tw,  0);
    vertex(  0,  th);
  endShape(CLOSE);
}

function p3_drawAfter() {}
