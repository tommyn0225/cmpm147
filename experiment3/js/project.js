/* experiment3/js/project.js
   Experiment 3 – Grid-Based World & Dungeon Generator
   Author: Tommy Nguyen
   Date: 4/25/2025
*/

// tile constants
const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;

/*──────────────────────────────────────────────────────────
  Overworld Generator
──────────────────────────────────────────────────────────*/
const overworldSketch = (p) => {
  let seed = 0;
  let tileset;
  let grid = [];
  let cols, rows;

  p.preload = () => {
    tileset = p.loadImage('../img/tilesetP8.png');
  };

  p.setup = () => {
    const ascii = document.getElementById('asciiBoxWorld');
    rows = +ascii.getAttribute('rows');
    cols = +ascii.getAttribute('cols');

    const cnv = p.createCanvas(cols * TILE_WIDTH, rows * TILE_HEIGHT);
    cnv.parent('canvasContainerWorld');
    p.pixelDensity(1);

    document.getElementById('reseedWorld')
      .addEventListener('click', reseed);
    ascii.addEventListener('input', parseGrid);

    reseed();
  };

  p.draw = () => {
    p.randomSeed(seed);
    p.noiseSeed(seed);
    drawGrid();
  };

  function reseed() {
    seed += 1109;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    document.getElementById('seedReportWorld').textContent = 'seed ' + seed;
    regenerate();
  }

  function regenerate() {
    grid = generateGrid(cols, rows);
    document.getElementById('asciiBoxWorld').value =
      grid.map(r => r.join('')).join('\n');
    parseGrid();
  }

  function parseGrid() {
    const text = document.getElementById('asciiBoxWorld').value;
    grid = text.split('\n').map(line => line.split(''));
  }

  function generateGrid(C, R) {
    const g = [];
    const freq = 0.1;
    for (let i = 0; i < R; i++) {
      const row = [];
      for (let j = 0; j < C; j++) {
        row.push(p.noise(j * freq, i * freq) < 0.3 ? 'w' : 'g');
      }
      g.push(row);
    }
    return g;
  }

  function drawGrid() {
    p.background(128);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j] === 'g') {
          const v = p.floor(p.noise(j * 0.2, i * 0.2) * 4);
          placeTile(i, j, v, 0);
        } else {
          const wv = p.floor(p.noise(j * 0.2, i * 0.2, p.millis() * 0.001) * 4);
          placeTile(i, j, wv, 14);
          let mask = 0;
          if (i > 0 && grid[i - 1][j] === 'g') mask |= 1;
          if (j < cols - 1 && grid[i][j + 1] === 'g') mask |= 2;
          if (i < rows - 1 && grid[i + 1][j] === 'g') mask |= 4;
          if (j > 0 && grid[i][j - 1] === 'g') mask |= 8;
          if (mask) {
            let ti, tj;
            switch (mask) {
              case 1:       ti = 10; tj = 0; break;
              case 2:       ti = 11; tj = 1; break;
              case 4:       ti = 10; tj = 2; break;
              case 8:       ti = 9;  tj = 1; break;
              case 1|8:     ti = 9;  tj = 0; break;
              case 1|2:     ti = 11; tj = 0; break;
              case 4|8:     ti = 9;  tj = 2; break;
              case 4|2:     ti = 11; tj = 2; break;
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

  function placeTile(i, j, ti, tj) {
    p.image(
      tileset,
      j * TILE_WIDTH, i * TILE_HEIGHT,
      TILE_WIDTH, TILE_HEIGHT,
      ti * 8, tj * 8,
      8, 8
    );
  }
};

/*──────────────────────────────────────────────────────────
  Dungeon Generator
──────────────────────────────────────────────────────────*/
const dungeonSketch = (p) => {
  let seed = 0;
  let tileset;
  let dungeon, cols, rows;
  let itemsInit = false, chestPositions = [], doorPositions = [];

  // autotile lookup
  const lookup = [
    [1,0],[1,1],[1,2],[1,3],
    [2,0],[2,1],[2,2],[2,3],
    [3,0],[3,1],[3,2],[3,3],
    [4,0],[4,1],[4,2],[4,3]
  ];
  const DIRECTIONS = [
    {dx: 0, dy: -1}, {dx: 1, dy: 0},
    {dx: 0, dy: 1},  {dx: -1, dy: 0}
  ];
  const CMIN = 0.3, CMAX = 0.5, SMIN = 3, SMAX = 5, CMN = 3;

  p.preload = () => {
    tileset = p.loadImage('../img/tilesetP8.png');
  };

  p.setup = () => {
    const ascii = document.getElementById('asciiBoxDungeon');
    rows = +ascii.getAttribute('rows');
    cols = +ascii.getAttribute('cols');

    const cnv = p.createCanvas(cols * TILE_WIDTH, rows * TILE_HEIGHT);
    cnv.parent('canvasContainerDungeon');
    p.pixelDensity(1);

    document.getElementById('reseedDungeon')
      .addEventListener('click', reseed);
    ascii.addEventListener('input', () => parseASCII());

    reseed();
  };

  p.draw = () => {
    p.randomSeed(seed);
    p.noiseSeed(seed);
    drawDungeon();
  };

  function reseed() {
    seed += 1109;
    itemsInit = false;
    chestPositions = [];
    doorPositions = [];
    p.randomSeed(seed);
    p.noiseSeed(seed);
    document.getElementById('seedReportDungeon').textContent = 'seed ' + seed;
    regenerate();
  }

  function regenerate() {
    dungeon = generateDungeon(cols, rows);
    document.getElementById('asciiBoxDungeon').value =
      dungeon.map(r => r.join('')).join('\n');
    parseASCII();
  }

  function parseASCII() {
    const txt = document.getElementById('asciiBoxDungeon').value;
    dungeon = txt.split('\n').map(line => line.split(''));
  }

  function gridCheck(g, i, j, t) {
    return i>=0 && i<g.length && j>=0 && j<g[0].length && g[i][j]===t;
  }
  function gridCode(g,i,j,t) {
    let c=0;
    if(gridCheck(g,i-1,j,t)) c|=1;
    if(gridCheck(g,i, j+1,t)) c|=2;
    if(gridCheck(g,i+1,j,t)) c|=4;
    if(gridCheck(g,i, j-1,t)) c|=8;
    return c;
  }

  function generateDungeon(nC,nR) {
    itemsInit = false; chestPositions=[]; doorPositions=[];
    const g = Array.from({length:nR},()=>Array(nC).fill('_'));
    // central room
    const wC = p.floor(p.random(nC*CMIN, nC*CMAX));
    const hC = p.floor(p.random(nR*CMIN, nR*CMAX));
    const cx = p.floor(nC/2), cy = p.floor(nR/2);
    for(let i=cy-p.floor(hC/2); i<cy-p.floor(hC/2)+hC; i++)
      for(let j=cx-p.floor(wC/2); j<cx-p.floor(wC/2)+wC; j++)
        g[i][j]='.';
    // corridors + rooms
    DIRECTIONS.forEach(dir => {
      let maxL = dir.dx>0
        ? nC-cx-p.floor(SMAX/2)-1
        : dir.dx<0
          ? cx-p.floor(SMAX/2)
          : dir.dy>0
            ? nR-cy-p.floor(SMAX/2)-1
            : cy-p.floor(SMAX/2);
      const len = p.floor(p.random(CMN, maxL));
      for(let s=1; s<=len; s++)
        g[cy+dir.dy*s][cx+dir.dx*s]='.';
      const ex=cx+dir.dx*len, ey=cy+dir.dy*len;
      const wS=p.floor(p.random(SMIN, SMAX+1));
      const hS=p.floor(p.random(SMIN, SMAX+1));
      for(let i=ey-p.floor(hS/2); i<ey-p.floor(hS/2)+hS; i++)
        for(let j=ex-p.floor(wS/2); j<ex-p.floor(wS/2)+wS; j++)
          if(i>=0&&i<nR&&j>=0&&j<nC) g[i][j]='.';
    });
    return g;
  }

  function drawDungeon() {
    p.background(0);
    const R = dungeon.length, C = dungeon[0].length;

    if (!itemsInit) {
      // doors
      const northWalls = [];
      for (let i=0;i<R;i++) for (let j=0;j<C;j++)
        if (dungeon[i][j]=='_' && gridCheck(dungeon,i+1,j,'.'))
          northWalls.push({i,j});
      if(northWalls.length) { p.shuffle(northWalls,true); doorPositions=[northWalls[0]]; }
      // chests
      const floors=[];
      for(let i=0;i<R;i++) for(let j=0;j<C;j++)
        if(dungeon[i][j]=='.') floors.push({i,j});
      p.shuffle(floors,true);
      chestPositions = floors.slice(0, p.floor(p.random(1,3)));
      itemsInit = true;
    }

    for (let i=0;i<R;i++){
      for (let j=0;j<C;j++){
        if (dungeon[i][j]==='.') {
          let ti=20, tj=23;
          if(p.random()<0.15) {
            const vs=[[21,21],[21,22],[21,23],[21,24],[25,24],[26,24],[27,24]];
            [ti,tj] = vs[p.floor(p.random(vs.length))];
          }
          placeTile(i,j,ti,tj);
        } else {
          const doorHere = doorPositions.some(p0=>p0.i===i&&p0.j===j);
          if(doorHere) placeTile(i,j,5,25);
          else if(gridCheck(dungeon,i+1,j,'.')) {
            const pats=[[1,21],[1,22],[1,23],[1,24],[5,24],[6,24],[7,24],[8,24]];
            const [ti,tj] = pats[p.floor(p.random(pats.length))];
            placeTile(i,j,ti,tj);
          } else {
            placeTile(i,j,0,23);
          }
        }
      }
    }
    chestPositions.forEach(({i,j})=>placeTile(i,j,2,28));
  }

  function placeTile(i, j, ti, tj) {
    p.image(
      tileset,
      j * TILE_WIDTH, i * TILE_HEIGHT,
      TILE_WIDTH, TILE_HEIGHT,
      ti * 8, tj * 8,
      8, 8
    );
  }
};

// initialize both canvases
new p5(overworldSketch, document.getElementById('canvasContainerWorld'));
new p5(dungeonSketch,   document.getElementById('canvasContainerDungeon'));
