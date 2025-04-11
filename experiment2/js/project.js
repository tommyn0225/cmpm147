/* experiment2/js/project.js - Generates random 2D landscape based on reference picture
   Author: Tommy Nguyen
   Date: 4/11/25

   NOTE: This is how we might start a basic JavaaScript OOP project

   Constants - User-servicable parts
   In a longer project I like to put these in a separate file
*/
class MyProjectClass {
  constructor(param1, param2) {
    this.property1 = param1;
    this.property2 = param2;
  }
  myMethod() {}
}

function main() {
  const myInstance = new MyProjectClass("value1", "value2");
  myInstance.myMethod();
}

let seed = 239;
const W = 800;
const H = 400;

const skyTop = "#002b5c";
const skyBottom = "#4ec5ff";
const sunColor = "#d7f5ff";

const mountainLayers = [
  { c: "#2b4f94", amp: 90, base: 0.50, sharp: 1.6 },
  { c: "#4d46b8", amp: 70, base: 0.62, sharp: 1.3 },
  { c: "#7b2d6c", amp: 90, base: 0.74, sharp: 1.0 }
];

const treeColor = "#06081a";
let clouds = [];

function setup() {
  const cnv = createCanvas(W, H);
  cnv.parent("box");
  pixelDensity(2);
  initScene();
}

function draw() {
  randomSeed(seed);
  noiseSeed(seed);
  drawSky();
  drawStars();
  drawSun();
  drawClouds();
  drawMountains();
  drawForest();
}

function initScene() {
  randomSeed(seed + 9999);
  clouds = [];
  for (let i = 0; i < 8; i++) clouds.push(generateCloud());
}

function generateCloud() {
  const c = {};
  c.xBase = random(-100, W + 100);
  c.yBase = random(40, 140);
  c.speed = random(0.03, 0.1);
  c.lumps = [];
  const n = floor(random(2, 5));
  for (let i = 0; i < n; i++) {
    c.lumps.push({
      xOff: random(-40, 40),
      yOff: random(-10, 10),
      w: random(40, 80),
      h: random(20, 40)
    });
  }
  return c;
}

function drawSky() {
  for (let y = 0; y < H; y++) {
    const t = map(y, 0, H, 0, 1);
    stroke(lerpColor(color(skyTop), color(skyBottom), sqrt(t)));
    line(0, y, W, y);
  }
}

function drawStars() {
  const N = 150;
  for (let i = 0; i < N; i++) {
    const x = random(W);
    const y = random(H / 2);
    const twinkle = 180 + 75 * sin(millis() / 1000 + i);
    stroke(twinkle);
    point(x, y);
  }
}

function drawSun() {
  noStroke();
  fill(sunColor);
  const sunX = map(mouseX, 0, W, W * 0.1, W * 0.9, true);
  const sunY = H * 0.15;
  ellipse(sunX, sunY, 45, 45);
}

function drawClouds() {
  noStroke();
  fill(255, 225);
  const t = millis() / 16;
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    const xPos = (c.xBase - t * c.speed) % (W + 200);
    const finalX = xPos < -100 ? xPos + W + 200 : xPos;
    const finalY = c.yBase + sin((t + i) * 0.01) * 2;
    push();
    translate(finalX, finalY);
    for (let j = 0; j < c.lumps.length; j++) {
      const L = c.lumps[j];
      arc(L.xOff, L.yOff, L.w, L.h, PI, TWO_PI);
    }
    pop();
  }
}

function drawMountains() {
  const parallax = map(mouseX, 0, W, -25, 25);
  mountainLayers.forEach((L, idx) => {
    fill(L.c);
    beginShape();
    const off = parallax * (idx + 1) / mountainLayers.length;
    for (let x = -20; x <= W + 20; x += 8) {
      const nx = (x + off) / 200;
      const y = H * L.base - pow(noise(nx), L.sharp) * L.amp;
      vertex(x, y);
    }
    vertex(W + 20, H);
    vertex(-20, H);
    endShape(CLOSE);
  });
}

function drawForest() {
  randomSeed(seed + 20250411);
  fill(treeColor);
  noStroke();
  const groundY = H;
  const topCapY = H * 0.45;
  const maxH = groundY - topCapY;
  const N = 90;
  for (let i = 0; i < N; i++) {
    const x = random(-40, W + 40);
    const foliageH = random(140, maxH);
    const levels = max(4, floor(foliageH / 14));
    const levelH = foliageH / levels;
    const maxW = foliageH * random(0.8, 1.0);
    for (let l = 0; l < levels; l++) {
      const t = l / (levels - 1);
      const w = lerp(maxW, maxW * 0.15, t);
      const yB = groundY - l * levelH + 1;
      const yT = yB - levelH;
      const xJ = random(-w * 0.03, w * 0.03);
      triangle(x + xJ, yT, x - w / 2, yB, x + w / 2, yB);
    }
  }
}

$(function () {
  $("#clicker").on("click", () => {
    seed++;
    initScene();
  });
});
