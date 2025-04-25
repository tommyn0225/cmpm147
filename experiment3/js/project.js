/* experiment3/js/project.js - Experiment 3: Grid-Based World Generation
   Author: Your Name
   Date: 2025-04-25

   NOTE: Procedural p5.js implementation mirroring Experiment 2 style
*/

// Tile size constants
const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;

// Global state
let seed = 0;
let tilesetImage;
let currentGrid = [];
let numCols = 0;
let numRows = 0;

function preload() {
  // Load tileset from local img folder
  tilesetImage = loadImage('../img/tilesetP8.png');
}

function setup() {
  // Read dimensions from ASCII textarea attributes
  const asciiBox = select('#asciiBox');
  numCols = asciiBox.attribute('rows') | 0;
  numRows = asciiBox.attribute('cols') | 0;

  // Create canvas sized to grid
  const cnv = createCanvas(
    TILE_WIDTH * numCols,
    TILE_HEIGHT * numRows
  );
  cnv.parent('canvasContainer');

  // Pixel-perfect rendering
  select('canvas').elt.getContext('2d').imageSmoothingEnabled = false;

  // Bind UI controls
  select('#reseedButton').mousePressed(reseed);
  select('#asciiBox').input(reparseGrid);

  // Initialize
  reseed();
}

function draw() {
  // Ensure reproducible noise each frame
  randomSeed(seed);
  noiseSeed(seed);

  // Draw the current grid
  drawGrid(currentGrid);
}

// Generate a new seed and update display/grid
function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select('#seedReport').html('seed ' + seed);
  regenerateGrid();
}

// Create a fresh procedural grid and update textarea
function regenerateGrid() {
  const grid = generateGrid(numCols, numRows);
  select('#asciiBox').value(gridToString(grid));
  reparseGrid();
}

// Parse ASCII from textarea into 2D array
function reparseGrid() {
  currentGrid = stringToGrid(select('#asciiBox').value());
}

// Convert 2D array to newline-delimited string
function gridToString(grid) {
  return grid.map(row => row.join('')).join('\n');
}

// Convert textarea string into 2D array
function stringToGrid(str) {
  return str.split('\n').map(line => line.split(''));
}

// Procedurally generate water ('w') and grass ('g') via noise
function generateGrid(cols, rows) {
  const grid = [];
  const freq = 0.1;
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(noise(j * freq, i * freq) < 0.3 ? 'w' : 'g');
    }
    grid.push(row);
  }
  return grid;
}

// Render grid: grass tiles, animated water, and cliff edges
function drawGrid(grid) {
  background(128);
  const R = grid.length;
  const C = grid[0].length;

  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (grid[i][j] === 'g') {
        // Grass variants
        const v = floor(noise(j * 0.2, i * 0.2) * 4);
        placeTile(i, j, v, 0);
      } else {
        // Water animation
        const wv = floor(
          noise(j * 0.2, i * 0.2, millis() * 0.001) * 4
        );
        placeTile(i, j, wv, 14);

        // Compute cliff mask for neighbors
        let mask = 0;
        if (i > 0 && grid[i - 1][j] === 'g') mask |= 1;
        if (j < C - 1 && grid[i][j + 1] === 'g') mask |= 2;
        if (i < R - 1 && grid[i + 1][j] === 'g') mask |= 4;
        if (j > 0 && grid[i][j - 1] === 'g') mask |= 8;

        if (mask > 0) {
          let ti, tj;
          switch (mask) {
            case 1:
              ti = 10; tj = 0; break;
            case 2:
              ti = 11; tj = 1; break;
            case 4:
              ti = 10; tj = 2; break;
            case 8:
              ti = 9;  tj = 1; break;
            case 1 | 8:
              ti = 9;  tj = 0; break;
            case 1 | 2:
              ti = 11; tj = 0; break;
            case 4 | 8:
              ti = 9;  tj = 2; break;
            case 4 | 2:
              ti = 11; tj = 2; break;
            default:
              if (mask & 1)      { ti = 10; tj = 0; }
              else if (mask & 2) { ti = 11; tj = 1; }
              else if (mask & 4) { ti = 10; tj = 2; }
              else               { ti = 9;  tj = 1; }
          }
          placeTile(i, j, ti, tj);
        }
      }
    }
  }
}

// Draw a specific tile from the tileset
function placeTile(i, j, ti, tj) {
  image(
    tilesetImage,
    TILE_WIDTH * j,
    TILE_HEIGHT * i,
    TILE_WIDTH,
    TILE_HEIGHT,
    ti * 8,
    tj * 8,
    8,
    8
  );
}



2/2

