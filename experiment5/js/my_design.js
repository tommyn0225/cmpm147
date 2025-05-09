/* experiment5/js/project.js
   Author: Tommy Nguyen
   Date: 5/8/25

   NOTE: This is how we might start a basic JavaaScript OOP project

   Constants - User-servicable parts
   In a longer project I like to put these in a separate file
*/
/* exported getInspirations, initDesign, renderDesign, mutateDesign */

function getInspirations() {
  return [
    { name: "Pikachu", assetUrl: "img/pikachu.png", credit: "Pikachu, The Pokémon Company" },
    { name: "Google Chrome", assetUrl: "img/chrome.png", credit: "Google Chrome Logo, Google, 2008" },
    { name: "Raising the Flag on Iwo Jima", assetUrl: "img/flag.jpg", credit: "Raising the Flag on Iwo Jima, Joe Rosenthal, 1945" }
  ];
}

function initDesign(inspiration) {
  // STEP 4: initialize canvas shape for faster sampling
  resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);

  // extract pixel data
  inspiration.image.loadPixels();

  // background as average brightness
  let total = 0;
  const count = inspiration.image.pixels.length / 4;
  for (let i = 0; i < inspiration.image.pixels.length; i += 4) {
    total += (inspiration.image.pixels[i] + inspiration.image.pixels[i+1] + inspiration.image.pixels[i+2]) / 3;
  }
  const avgB = total / count;

  // build design object
  let design = { bg: avgB, fg: [] };

  // grid hyperparams
  const gridRows = 10, gridCols = 10;
  const cellW = width / gridCols, cellH = height / gridRows;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const x0 = c * cellW, y0 = r * cellH;
      // sample brightness
      const sx = constrain(floor(map(c, 0, gridCols, 0, inspiration.image.width)), 0, inspiration.image.width - 1);
      const sy = constrain(floor(map(r, 0, gridRows, 0, inspiration.image.height)), 0, inspiration.image.height - 1);
      const idx = 4 * (sy * inspiration.image.width + sx);
      const b = (inspiration.image.pixels[idx] + inspiration.image.pixels[idx+1] + inspiration.image.pixels[idx+2]) / 3;

      design.fg.push({
        x: x0 + random(-cellW * 0.2, cellW * 0.2),
        y: y0 + random(-cellH * 0.2, cellH * 0.2),
        w: cellW * random(0.5, 1.2),
        h: cellH * random(0.5, 1.2),
        fill: b
      });
    }
  }
  return design;
}

function renderDesign(design, inspiration) {
  // STEP 5: draw design
  background(design.bg);
  noStroke();
  design.fg.forEach(box => {
    fill(box.fill, 180);
    rect(box.x, box.y, box.w, box.h);
  });
}

function mutateDesign(design, inspiration, rate) {
  // STEP 6: apply Gaussian mutations
  design.bg = mut(design.bg, 0, 255, rate);
  design.fg.forEach(box => {
    box.fill = mut(box.fill, 0, 255, rate);
    box.x    = mut(box.x, 0, width, rate);
    box.y    = mut(box.y, 0, height, rate);
    box.w    = mut(box.w, 0, width/10, rate);
    box.h    = mut(box.h, 0, height/10, rate);
  });
}

function mut(num, min, max, rate) {
  const sigma = (rate * (max - min)) / 20;
  return constrain(randomGaussian(num, sigma), min, max);
}