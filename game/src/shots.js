// Screenshot staging: `?shot=<name>&seed=<n>` builds one fixed scene so the
// entry's screenshots are real renders of the game in known states — the
// title, a mid-run battle, the gift choice, and the victory screen.

import { ENEMIES } from './config.js';
import { UPGRADES } from './upgrades.js';
import { beginNextWave, startRun } from './world.js';

function placeEnemy(world, kind, x, y, elite = false) {
  const base = ENEMIES[kind];
  world.enemies.push({
    id: 9000 + world.enemies.length,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: base.radius * (elite ? ENEMIES.eliteScale : 1),
    hp: kind === 'husk' ? 3 : base.hp,
    maxHp: base.hp,
    speed: base.speed,
    damage: base.damage,
    dew: base.dew,
    score: base.score,
    elite,
    wobble: x * 0.01,
    flash: 0,
  });
}

export function stageShot(world, name) {
  if (name === 'start') {
    world.state = 'title';
    world.player.x = 178; // stand in the garden, clear of the title text
    world.player.y = 596;
    return;
  }
  startRun(world);
  if (name === 'play') {
    world.wave = 4;
    world.spawnQueue = 5;
    world.score = 1240;
    world.dewCollected = 37;
    world.kills = 41;
    world.player.hp = 4;
    world.player.x = 560;
    world.player.y = 430;
    placeEnemy(world, 'moth', 760, 300);
    placeEnemy(world, 'moth', 830, 430);
    placeEnemy(world, 'moth', 700, 540);
    placeEnemy(world, 'beetle', 950, 350);
    placeEnemy(world, 'beetle', 380, 260);
    placeEnemy(world, 'husk', 880, 560);
    placeEnemy(world, 'moth', 300, 560, true);
    world.dews.push(
      { id: 1, x: 640, y: 380, vx: 0, vy: 0, bob: 1 },
      { id: 2, x: 690, y: 470, vx: 0, vy: 0, bob: 2.4 },
      { id: 3, x: 520, y: 520, vx: 0, vy: 0, bob: 4 },
    );
    world.rings.push({ x: 560, y: 430, radius: 96, maxRadius: world.player.pulseRadius, life: 0.3, maxLife: 0.32 });
    world.message = 'Wave 4';
    world.messageTimer = 0; // keep the staged frame clean
    world.state = 'playing';
    return;
  }
  if (name === 'upgrade') {
    world.wave = 4;
    world.spawnQueue = 0; // the wave is cleared: nothing left to fight
    world.score = 1610;
    world.dewCollected = 48;
    world.kills = 52;
    world.choices = [UPGRADES[0], UPGRADES[4], UPGRADES[6]];
    world.state = 'upgrade';
    return;
  }
  if (name === 'end') {
    world.wave = 10;
    world.spawnQueue = 0;
    world.score = 6845;
    world.dewCollected = 213;
    world.kills = 218;
    world.state = 'win';
    return;
  }
  // Unknown shot name: fall back to a fresh run's first wave.
  beginNextWave(world);
}
