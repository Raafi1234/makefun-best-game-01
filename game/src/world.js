// Gloamkeeper's simulation: the keeper, the night pests, dew, waves and
// scoring. Pure state and stepping — drawing lives in render.js, sound is
// reported back through `events` so this file never touches the browser.

import { COLORS, ENEMIES, PLAYER, SCORING, VIEW, WAVES } from './config.js';

let nextId = 1;

export function createWorld(random) {
  return {
    random,
    time: 0,
    state: 'title', // title | playing | upgrade | paused | over | win
    wave: 0,
    score: 0,
    dewCollected: 0,
    kills: 0,
    player: freshPlayer(),
    enemies: [],
    dews: [],
    particles: [],
    rings: [], // expanding light rings from pulses, purely visual
    spawnQueue: 0,
    spawnTimer: 0,
    betweenTimer: 0,
    choices: [],
    events: [], // sound cues drained by main.js each frame
    shake: 0,
    message: '',
    messageTimer: 0,
  };
}

function freshPlayer() {
  return {
    x: VIEW.width / 2,
    y: VIEW.height / 2,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    hp: PLAYER.baseMaxHp,
    maxHp: PLAYER.baseMaxHp,
    speed: PLAYER.baseSpeed,
    pulseRadius: PLAYER.pulse.baseRadius,
    pulseDamage: PLAYER.pulse.baseDamage,
    pulseCooldown: PLAYER.pulse.baseCooldownSec,
    pulseTimer: 0,
    dashCooldown: PLAYER.dash.baseCooldownSec,
    dashTimer: 0,
    dashTimeLeft: 0,
    dashDirX: 1,
    dashDirY: 0,
    invulnSec: PLAYER.contactInvulnSec,
    invulnTimer: 0,
    magnetRadius: 90,
    facing: 1,
  };
}

export function startRun(world) {
  world.player = freshPlayer();
  world.enemies = [];
  world.dews = [];
  world.particles = [];
  world.rings = [];
  world.score = 0;
  world.dewCollected = 0;
  world.kills = 0;
  world.wave = 0;
  world.shake = 0;
  beginNextWave(world);
}

export function beginNextWave(world) {
  world.wave += 1;
  world.spawnQueue = WAVES.counts[world.wave - 1];
  world.spawnTimer = 0.4;
  world.state = 'playing';
  world.message = world.wave === 1 ? 'Wave 1 — keep the lantern lit' : `Wave ${world.wave}`;
  world.messageTimer = 2.2;
}

// Which pest arrives: moths always, beetles from wave 2, husks from wave 3,
// with elites sprinkled in from wave 6.
function pickKind(world) {
  const w = world.wave;
  const roll = world.random.next();
  if (w >= 3 && roll < 0.16) return 'husk';
  if (w >= 2 && roll < 0.16 + 0.3) return 'beetle';
  return 'moth';
}

function spawnEnemy(world) {
  const kind = pickKind(world);
  const base = ENEMIES[kind];
  // Spawn on the garden edge, never on top of the keeper.
  const side = world.random.int(0, 3);
  let x = 0;
  let y = 0;
  if (side === 0) { x = world.random.range(0, VIEW.width); y = -30; }
  if (side === 1) { x = world.random.range(0, VIEW.width); y = VIEW.height + 30; }
  if (side === 2) { x = -30; y = world.random.range(0, VIEW.height); }
  if (side === 3) { x = VIEW.width + 30; y = world.random.range(0, VIEW.height); }
  const elite = world.wave >= 6 && world.random.chance(0.12);
  const hpScale = 1 + (world.wave - 1) * 0.06;
  world.enemies.push({
    id: nextId++,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: base.radius * (elite ? ENEMIES.eliteScale : 1),
    hp: Math.round((base.hp + (elite ? ENEMIES.eliteHpBonus : 0)) * hpScale),
    maxHp: Math.round((base.hp + (elite ? ENEMIES.eliteHpBonus : 0)) * hpScale),
    speed: base.speed * world.random.range(0.85, 1.15) * (elite ? 0.9 : 1),
    damage: base.damage,
    dew: base.dew,
    score: base.score * (elite ? ENEMIES.eliteScoreMul : 1),
    elite,
    wobble: world.random.range(0, Math.PI * 2),
    flash: 0,
  });
}

function burst(world, x, y, color, count, speed = 160) {
  for (let i = 0; i < count; i++) {
    const angle = world.random.range(0, Math.PI * 2);
    const v = world.random.range(speed * 0.3, speed);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: world.random.range(0.25, 0.6),
      maxLife: 0.6,
      color,
      size: world.random.range(1.5, 3.5),
    });
  }
}

function dropDew(world, x, y, count) {
  for (let i = 0; i < count; i++) {
    world.dews.push({
      id: nextId++,
      x: x + world.random.range(-14, 14),
      y: y + world.random.range(-14, 14),
      vx: world.random.range(-40, 40),
      vy: world.random.range(-40, 40),
      bob: world.random.range(0, Math.PI * 2),
    });
  }
}

export function firePulse(world) {
  const p = world.player;
  if (p.pulseTimer > 0 || world.state !== 'playing') return false;
  p.pulseTimer = p.pulseCooldown;
  world.rings.push({ x: p.x, y: p.y, radius: 10, maxRadius: p.pulseRadius, life: PLAYER.pulse.ringSec, maxLife: PLAYER.pulse.ringSec });
  world.events.push('pulse');
  for (const enemy of world.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= p.pulseRadius + enemy.radius) {
      enemy.hp -= p.pulseDamage;
      enemy.flash = 0.12;
      const push = PLAYER.pulse.knockback / Math.max(40, dist);
      enemy.vx += (dx / (dist || 1)) * push * 60;
      enemy.vy += (dy / (dist || 1)) * push * 60;
      burst(world, enemy.x, enemy.y, COLORS.lanternGlow, 3, 120);
    }
  }
  return true;
}

export function startDash(world, dirX, dirY) {
  const p = world.player;
  if (p.dashTimer > 0 || world.state !== 'playing') return false;
  const len = Math.hypot(dirX, dirY) || 1;
  p.dashDirX = dirX / len;
  p.dashDirY = dirY / len;
  p.dashTimeLeft = PLAYER.dash.durationSec;
  p.dashTimer = p.dashCooldown;
  p.invulnTimer = Math.max(p.invulnTimer, PLAYER.dash.invulnSec);
  world.events.push('dash');
  return true;
}

function killEnemy(world, enemy) {
  world.kills += 1;
  world.score += enemy.score;
  dropDew(world, enemy.x, enemy.y, enemy.dew);
  const color = enemy.kind === 'moth' ? COLORS.mothWing : enemy.kind === 'beetle' ? COLORS.beetleShell : COLORS.huskPetal;
  burst(world, enemy.x, enemy.y, color, enemy.kind === 'husk' ? 16 : 8, 190);
  world.events.push('kill');
  if (enemy.kind === 'husk') {
    // A felled husk bloom splits into two angry moths.
    for (let i = 0; i < 2; i++) {
      const base = ENEMIES.moth;
      world.enemies.push({
        id: nextId++,
        kind: 'moth',
        x: enemy.x + world.random.range(-18, 18),
        y: enemy.y + world.random.range(-18, 18),
        vx: world.random.range(-90, 90),
        vy: world.random.range(-90, 90),
        radius: base.radius,
        hp: base.hp,
        maxHp: base.hp,
        speed: base.speed * 1.15,
        damage: base.damage,
        dew: 0,
        score: base.score,
        elite: false,
        wobble: world.random.range(0, Math.PI * 2),
        flash: 0,
      });
    }
  }
}

function hurtPlayer(world) {
  const p = world.player;
  if (p.invulnTimer > 0) return;
  p.hp -= 1;
  p.invulnTimer = p.invulnSec;
  world.shake = 7;
  world.events.push('hurt');
  burst(world, p.x, p.y, COLORS.heart, 10, 170);
  if (p.hp <= 0) {
    world.state = 'over';
    world.events.push('gameOver');
  }
}

// One simulation step. `move` is the player's input direction (-1..1 each
// axis), `aim` the pointer position for facing.
export function stepWorld(world, dt, move) {
  const p = world.player;
  world.time += dt;
  if (world.messageTimer > 0) world.messageTimer -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 16);

  // Timers
  p.pulseTimer = Math.max(0, p.pulseTimer - dt);
  p.dashTimer = Math.max(0, p.dashTimer - dt);
  p.invulnTimer = Math.max(0, p.invulnTimer - dt);

  if (world.state !== 'playing') {
    stepAmbient(world, dt);
    return;
  }

  // Movement (dash overrides)
  if (p.dashTimeLeft > 0) {
    p.dashTimeLeft -= dt;
    p.vx = p.dashDirX * PLAYER.dash.speed;
    p.vy = p.dashDirY * PLAYER.dash.speed;
    burst(world, p.x, p.y, COLORS.keeperCloak, 1, 40);
  } else {
    const len = Math.hypot(move.x, move.y);
    if (len > 0) {
      p.vx = (move.x / len) * p.speed;
      p.vy = (move.y / len) * p.speed;
      if (move.x !== 0) p.facing = move.x > 0 ? 1 : -1;
    } else {
      p.vx = 0;
      p.vy = 0;
    }
  }
  p.x = clamp(p.x + p.vx * dt, p.radius, VIEW.width - p.radius);
  p.y = clamp(p.y + p.vy * dt, p.radius, VIEW.height - p.radius);

  // Spawning
  if (world.spawnQueue > 0) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      world.spawnTimer = WAVES.spawnIntervalSec * world.random.range(0.7, 1.2);
      spawnEnemy(world);
      world.spawnQueue -= 1;
    }
  }

  // Enemies chase, each kind with its own gait.
  for (const enemy of world.enemies) {
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    let steerX = dx / dist;
    let steerY = dy / dist;
    if (enemy.kind === 'moth') {
      enemy.wobble += dt * 5;
      const sway = Math.sin(enemy.wobble) * 0.55;
      const rx = -steerY * sway;
      const ry = steerX * sway;
      steerX += rx;
      steerY += ry;
    } else if (enemy.kind === 'beetle') {
      enemy.wobble += dt * 11;
      const zig = Math.sin(enemy.wobble) * 0.8;
      steerX += -steerY * zig;
      steerY += steerX * zig * 0.4;
    }
    const friction = Math.pow(0.0015, dt); // knockback decay
    enemy.vx = enemy.vx * friction + steerX * enemy.speed * (1 - friction) * 3.2;
    enemy.vy = enemy.vy * friction + steerY * enemy.speed * (1 - friction) * 3.2;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.flash = Math.max(0, enemy.flash - dt);

    if (dist < enemy.radius + p.radius - 2) hurtPlayer(world);
  }

  // Deaths
  const survivors = [];
  for (const enemy of world.enemies) {
    if (enemy.hp <= 0) killEnemy(world, enemy);
    else survivors.push(enemy);
  }
  world.enemies = survivors;

  // Dew drifts to the keeper inside the magnet radius, then is gathered.
  const keptDew = [];
  for (const dew of world.dews) {
    const dx = p.x - dew.x;
    const dy = p.y - dew.y;
    const dist = Math.hypot(dx, dy);
    if (dist < p.magnetRadius) {
      const pull = 340 * dt;
      dew.x += (dx / (dist || 1)) * pull;
      dew.y += (dy / (dist || 1)) * pull;
    } else {
      dew.x += dew.vx * dt;
      dew.y += dew.vy * dt;
      dew.vx *= 0.9;
      dew.vy *= 0.9;
    }
    dew.bob += dt * 3;
    if (dist < p.radius + 12) {
      world.dewCollected += 1;
      world.score += SCORING.dewValue;
      world.events.push('dew');
    } else {
      keptDew.push(dew);
    }
  }
  world.dews = keptDew;

  stepAmbient(world, dt);

  // Wave clear?
  if (world.state === 'playing' && world.spawnQueue === 0 && world.enemies.length === 0) {
    world.score += SCORING.waveClearBonus;
    if (world.wave >= WAVES.total) {
      world.score += SCORING.winBonus;
      world.state = 'win';
      world.events.push('win');
    } else {
      world.state = 'upgrade';
      world.events.push('waveClear');
    }
  }
}

function stepAmbient(world, dt) {
  const kept = [];
  for (const particle of world.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.92;
    particle.vy *= 0.92;
    if (particle.life > 0) kept.push(particle);
  }
  world.particles = kept;
  const rings = [];
  for (const ring of world.rings) {
    ring.life -= dt;
    ring.radius += (ring.maxRadius - ring.radius) * Math.min(1, dt * 14);
    if (ring.life > 0) rings.push(ring);
  }
  world.rings = rings;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
