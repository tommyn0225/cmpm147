/* exported preload, setup, draw */
/* global getInspirations, initDesign, renderDesign, mutateDesign */

let allInspirations, currentInspiration, bestDesign, currentDesign;
let currentInspirationPixels, currentCanvas;
let mutationCount = 0;

// DOM elements
let dropper, restartBtn, slider, rateDisplay, activeScore, bestScore, fpsDisplay, memoryContainer, referencePic, referenceCredit; // added reference UI elements

function preload() {
  // grab DOM references
  dropper         = document.getElementById('dropper');
  restartBtn      = document.getElementById('restart');
  slider          = document.getElementById('slider');
  rateDisplay     = document.getElementById('rate');
  activeScore     = document.getElementById('activeScore');
  bestScore       = document.getElementById('bestScore');
  fpsDisplay      = document.getElementById('fpsCounter');
  memoryContainer = document.getElementById('memory');
  // reference picture elements
  referencePic     = document.getElementById('referencePic');
  referenceCredit  = document.getElementById('referenceCredit');

  // load inspirations
  allInspirations = getInspirations();
  allInspirations.forEach((insp, i) => {
    insp.image = loadImage(insp.assetUrl);
    const opt = document.createElement('option');
    opt.value = i;
    opt.text  = insp.name;
    dropper.appendChild(opt);
  });

  // events
  dropper.addEventListener('change', () => changeInspiration());
  restartBtn.addEventListener('click', () => changeInspiration());

  // set initial
  currentInspiration = allInspirations[0];
}

function changeInspiration() {
  currentInspiration = allInspirations[dropper.value];
  currentDesign     = undefined;
  memoryContainer.innerHTML = '';
  setup();
}

function setup() {
  // grab reference elements (ensure DOM ready)
  referencePic = document.getElementById('referencePic');
  referenceCredit = document.getElementById('referenceCredit');
  // update reference image & caption
  referencePic.src = currentInspiration.assetUrl;
  referenceCredit.textContent = currentInspiration.credit;

  // update reference image & caption
  referencePic.src = currentInspiration.assetUrl;
  referenceCredit.textContent = currentInspiration.credit;

  // create and resize canvas via initDesign
  // create and resize canvas via initDesign
  currentDesign = initDesign(currentInspiration);
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent('active');

  // evaluation setup
  bestDesign = JSON.parse(JSON.stringify(currentDesign));
  currentInspiration.image.loadPixels();
  image(currentInspiration.image, 0, 0, width, height);
  loadPixels();
  currentInspirationPixels = pixels.slice();

  // reset score
  activeScore.textContent = '';
  bestScore.textContent   = '';
}

function draw() {
  if (!currentDesign) return;

  // mutate & render
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rateDisplay.textContent = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value / 100);

  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);

  // evaluate
  loadPixels();
  let err = 0;
  for (let i = 0; i < pixels.length; i++) err += sq(pixels[i] - currentInspirationPixels[i]);
  const score = 1 / (1 + err / pixels.length);
  activeScore.textContent = score.toFixed(4);

  if (!bestScore.textContent || score > parseFloat(bestScore.textContent)) {
    bestScore.textContent = score.toFixed(4);
    // snapshot
    const url = currentCanvas.canvas.toDataURL();
    const img = document.createElement('img');
    img.src = url;
    img.className = 'memory';
    img.title = score.toFixed(4);
    img.width = width / 2;
    img.height = height / 2;
    memoryContainer.insertBefore(img, memoryContainer.firstChild);
    if (memoryContainer.childNodes.length > memoryContainer.dataset.maxItems) {
      memoryContainer.removeChild(memoryContainer.lastChild);
    }
    bestDesign = JSON.parse(JSON.stringify(currentDesign));
  }
  fpsDisplay.textContent = Math.round(frameRate());
}