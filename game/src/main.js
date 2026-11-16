// Gloamkeeper — boot and glue. Owns the canvas, the frame loop, and the
// state machine's transitions (title → playing ⇄ upgrade/pause → over/win);
// the simulation itself lives in world.js, drawing in render.js/screens.js.

import { createAudio } from './audio.js';
import { VIEW } from './config.js';
import { createInput } from './input.js';
import { makeRandom } from './random.js';
import { drawWorld } from './render.js';
import { drawEnd, drawPause, drawTitle, drawUpgrade, restartButtonRect, startButtonRect, upgradeCardRects } from './screens.js';
import { stageShot } from './shots.js';
import { drawChoices } from './upgrades.js';
import { beginNextWave, createWorld, firePulse, startDash, startRun, stepWorld } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const random = makeRandom(seed * 7919 + 13);

const input = createInput(canvas);
const audio = createAudio();
const world = createWorld(random);

if (params.get('shot')) stageShot(world, params.get('shot'));

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function moveVector() {
  const k = input.keys;
  return {
    x: (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0),
    y: (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0),
  };
}

function chooseUpgrade(index) {
  const choice = world.choices[index];
  if (!choice) return;
  choice.apply(world.player);
  audio.upgrade();
  world.choices = [];
  beginNextWave(world);
}

function handleStateInput() {
  const { mouse } = input;
  if (input.wasPressed('m')) audio.toggleMute();

  if (world.state === 'title') {
    if (mouse.clicked && inside(mouse, startButtonRect())) startGame();
    else if (input.wasPressed('enter')) startGame();
    return;
  }
  if (world.state === 'over' || world.state === 'win') {
    if (mouse.clicked && inside(mouse, restartButtonRect())) startGame();
    else if (input.wasPressed('r')) startGame();
    return;
  }
  if (world.state === 'upgrade') {
    const rects = upgradeCardRects();
    if (mouse.clicked) {
      const index = rects.findIndex((rect) => inside(mouse, rect));
      if (index >= 0) chooseUpgrade(index);
    }
    for (const n of [1, 2, 3]) if (input.wasPressed(String(n))) chooseUpgrade(n - 1);
    return;
  }
  if (world.state === 'paused') {
    if (input.wasPressed('p') || input.wasPressed('escape')) world.state = 'playing';
    return;
  }
  // playing
  if (input.wasPressed('p') || input.wasPressed('escape')) {
    world.state = 'paused';
    return;
  }
  if (mouse.clicked || input.wasPressed(' ')) firePulse(world);
  if (input.wasPressed('shift')) {
    const move = moveVector();
    const dir = Math.hypot(move.x, move.y) > 0 ? move : { x: world.player.facing, y: 0 };
    startDash(world, dir.x, dir.y);
  }
}

function startGame() {
  audio.unlock();
  audio.click();
  startRun(world);
}

function drainEvents() {
  for (const event of world.events) {
    if (event === 'pulse') audio.pulse();
    else if (event === 'dash') audio.dash();
    else if (event === 'hurt') audio.hurt();
    else if (event === 'kill') audio.kill();
    else if (event === 'dew') audio.dew();
    else if (event === 'waveClear') audio.waveClear();
    else if (event === 'gameOver') audio.gameOver();
    else if (event === 'win') audio.win();
  }
  world.events = [];
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  handleStateInput();
  if (world.state === 'playing') stepWorld(world, dt, moveVector());
  else if (world.state !== 'paused') stepWorld(world, dt, { x: 0, y: 0 }); // ambient only: stepWorld returns before gameplay for non-playing states
  drainEvents();

  drawWorld(ctx, world, input);
  if (world.state === 'title') drawTitle(ctx, world);
  else if (world.state === 'upgrade') {
    const rects = upgradeCardRects();
    const hover = rects.findIndex((rect) => inside(input.mouse, rect));
    drawUpgrade(ctx, world, hover);
  } else if (world.state === 'paused') drawPause(ctx);
  else if (world.state === 'over') drawEnd(ctx, world, false);
  else if (world.state === 'win') drawEnd(ctx, world, true);

  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
