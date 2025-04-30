// File: js/project.js
"use strict";

/**
 * Cyberpunk City only.
 * We'll add Space & Minecraft later as separate files.
 */

// simple 32‐bit JS hash to replace XXH.h32
function hash32(str, seed = 0) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// --- Cyberpunk City generator hooks ---
function registerCyberpunkCity() {
  // state
  window.worldSeed = 0;
  window.baseHue = 0;
  window.overrideHue = {};
  window.cars = [];

  window.p3_preload = function() {};

  window.p3_setup = function() {
    colorMode(HSB, 360, 100, 100, 255);
  };

  window.p3_worldKeyChanged = function(key) {
    window.worldSeed = hash32(key, 0);
    noiseSeed(window.worldSeed);
    randomSeed(window.worldSeed);
    window.baseHue = random(0, 360);
    window.overrideHue = {};
    window.cars = [];
  };

  window.p3_tileWidth = () => 32;
  window.p3_tileHeight = () => 16;

  window.p3_tileClicked = function(i, j) {
    if (i >= 0 && j >= 0 && j < 10) {
      const k = `${i},${j}`;
      window.overrideHue[k] = random(0, 360);
    }
  };

  window.p3_drawBefore = function() {};

  window.p3_drawTile = function(i, j) {
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

    // only rows 0–9, x≥0
    if (!(i >= 0 && j >= 0 && j < 10)) return;

    // diamond base
    noStroke();
    fill(220, 10, 20, 200);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    // building height from noise
    const n = noise(i * 0.1, j * 0.1);
    const baseH = map(n, 0, 1, 20, 100);
    const hFac = (hash32(`hfac:${i},${j}`, worldSeed) % 100) / 99;
    const wFac = (hash32(`wfac:${i},${j}`, worldSeed) % 100) / 99;
    const heightVal = baseH * map(hFac, 0, 1, 0.6, 1.4);
    const widthF = map(wFac, 0, 1, 0.6, 1.4);
    if (heightVal < 12) return;

    // color override or base
    const keyStr = `${i},${j}`;
    const hueVal =
      window.overrideHue[keyStr] !== undefined
        ? window.overrideHue[keyStr]
        : (window.baseHue + n * 80) % 360;

    const type = hash32(`type:${i},${j}`, window.worldSeed) % 5;

    push();
    noStroke();
    fill(hueVal, 100, 80, 200);
    switch (type) {
      case 0: {
        const bw0 = tw * 0.6 * widthF,
          bh0 = heightVal * 0.5;
        rect(-bw0 / 2, -bh0, bw0, bh0);
        break;
      }
      case 1: {
        const bw1 = tw * 0.8 * widthF;
        rect(-bw1 / 2, -heightVal, bw1, heightVal);
        break;
      }
      case 2: {
        const radius = tw * 0.5 * widthF;
        ellipse(0, -heightVal / 2, radius, radius);
        rect(-radius / 2, -heightVal, radius, heightVal);
        break;
      }
      case 3:
        beginShape();
        vertex(-tw * 0.5 * widthF, 0);
        vertex(0, -heightVal);
        vertex(tw * 0.5 * widthF, 0);
        endShape(CLOSE);
        break;
      case 4:
        for (let lvl = 0; lvl < 4; lvl++) {
          const frac = 1 - lvl / 4,
            bw4 = tw * frac * widthF,
            bh4 = heightVal / 4;
          rect(-bw4 / 2, -bh4 * (lvl + 1), bw4, bh4);
        }
        break;
    }
    pop();

    // flickering windows
    fill(0, 0, 100, sin(millis() / 200 + i + j) * 100 + 100);
    if (type === 0) {
      rect(-tw * 0.3 * widthF, -heightVal * 0.25, tw * 0.6 * widthF, 4);
    } else if (type === 1) {
      const bw1 = tw * 0.8 * widthF;
      for (let yy = -heightVal + 8; yy < 0; yy += 8) {
        for (let xx = -bw1 / 2 + 3; xx < bw1 / 2 - 3; xx += 6) {
          rect(xx, yy, 3, 5);
        }
      }
    } else if (type === 2) {
      for (let xx = -tw * 0.25 * widthF; xx < tw * 0.25 * widthF; xx += 6) {
        rect(xx, -heightVal + 10, 2, heightVal - 20);
      }
    } else if (type === 3) {
      rect(-6, -heightVal * 0.5, 12, 8);
    } else {
      for (let lvl = 0; lvl < 4; lvl++) {
        const frac = 1 - lvl / 4,
          bw4 = tw * frac * widthF,
          bh4 = heightVal / 4;
        rect(-bw4 / 2 + 4, -bh4 * (lvl + 1) + 4, bw4 - 8, 4);
      }
    }
  };

  window.p3_drawSelectedTile = function(i, j) {
    const tw = p3_tileWidth(),
      th = p3_tileHeight();
    if (!(i >= 0 && j < 10)) return;
    noFill();
    stroke(100, 100, 100, 200);
    strokeWeight(1);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);
    noStroke();
    fill(0);
    textSize(12);
    text(`(${i},${j})`, -tw / 2, -th / 2);
  };

  window.p3_drawAfter = function() {
    const tw = p3_tileWidth(),
      th = p3_tileHeight();
    if (random() < 0.02) {
      window.cars.push({
        x: 0,
        y: floor(random(0, 10)),
        speed: random(0.05, 0.2),
        hue: (window.baseHue + random(-30, 30) + 360) % 360,
      });
    }
    noStroke();
    for (let idx = window.cars.length - 1; idx >= 0; idx--) {
      const c = window.cars[idx];
      c.x += c.speed;
      if (c.x >= 0 && c.x < 200) {
        const [cx, cy] = worldToScreen([c.x, c.y], [
          camera_offset.x,
          camera_offset.y,
        ]);
        push();
        translate(-cx, cy);
        fill(c.hue, 80, 100, 200);
        rect(-tw * 0.3, -th * 0.2, tw * 0.6, th * 0.3, 3);
        pop();
      }
      if (c.x > 200) window.cars.splice(idx, 1);
    }
  };
}

// wire it up on load:
window.addEventListener("DOMContentLoaded", () => {
  registerCyberpunkCity();
  // seed input already calls rebuildWorld(), so first render happens in engine.setup()
});
