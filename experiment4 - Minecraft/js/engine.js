// File: js/engine.js
"use strict";

/* global p5 */
/* exported preload, setup, draw, mouseClicked */

let tile_width_step_main;
let tile_height_step_main;
let tile_rows, tile_columns;
let camera_offset, camera_velocity;

function worldToScreen([wx, wy], [cx, cy]) {
  const i = (wx - wy) * tile_width_step_main;
  const j = (wx + wy) * tile_height_step_main;
  return [i + cx, j + cy];
}

function screenToWorld([sx, sy], [cx, cy]) {
  sx -= cx;
  sy -= cy;
  sx /= tile_width_step_main * 2;
  sy /= tile_height_step_main * 2;
  sy += 0.5;
  return [Math.floor(sy + sx), Math.floor(sy - sx)];
}

function cameraToWorldOffset([cx, cy]) {
  return {
    x: Math.round(cx / (tile_width_step_main * 2)),
    y: Math.round(cy / (tile_height_step_main * 2)),
  };
}

function tileRenderingOrder(offset) {
  return [offset[1] - offset[0], offset[0] + offset[1]];
}

function preload() {
  if (window.p3_preload) window.p3_preload();
}

function setup() {
  const canvas = createCanvas(800, 400);
  canvas.parent("container");
  camera_offset = new p5.Vector(-width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  if (window.p3_setup) window.p3_setup();

  const seedLabel = createP();
  seedLabel.html("World key: ");
  seedLabel.parent("controls");

  const seedInput = createInput("xyzzy");
  seedInput.parent(seedLabel);
  seedInput.input(() => rebuildWorld(seedInput.value()));

  createP("Use arrow keys to scroll. Click tiles to interact.").parent(
    "controls"
  );
  rebuildWorld(seedInput.value());
}

function rebuildWorld(key) {
  if (window.p3_worldKeyChanged) window.p3_worldKeyChanged(key);
  tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
  tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 16;
  tile_columns = Math.ceil(width / (tile_width_step_main * 2));
  tile_rows = Math.ceil(height / (tile_height_step_main * 2));
}

function mouseClicked() {
  const worldPos = screenToWorld(
    [mouseX * -1, mouseY],
    [camera_offset.x, camera_offset.y]
  );
  if (window.p3_tileClicked) window.p3_tileClicked(worldPos[0], worldPos[1]);
  return false;
}

function draw() {
  if (keyIsDown(LEFT_ARROW)) camera_velocity.x -= 1;
  if (keyIsDown(RIGHT_ARROW)) camera_velocity.x += 1;
  if (keyIsDown(UP_ARROW)) camera_velocity.y += 1;
  if (keyIsDown(DOWN_ARROW)) camera_velocity.y -= 1;

  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95);

  if (window.p3_drawBefore) window.p3_drawBefore();

  const offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
  const overdraw = 0.1;
  const x0 = Math.floor((0 - overdraw) * tile_columns);
  const x1 = Math.floor((1 + overdraw) * tile_columns);
  const y0 = Math.floor((0 - overdraw) * tile_rows);
  const y1 = Math.floor((1 + overdraw) * tile_rows);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTile(
        tileRenderingOrder([x + offset.x, y - offset.y]),
        [camera_offset.x, camera_offset.y]
      );
    }
    for (let x = x0; x < x1; x++) {
      drawTile(
        tileRenderingOrder([x + 0.5 + offset.x, y + 0.5 - offset.y]),
        [camera_offset.x, camera_offset.y]
      );
    }
  }

  if (window.p3_drawAfter) window.p3_drawAfter();
}
