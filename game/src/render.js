// All drawing for Gloamkeeper: the night garden, the keeper and the pests,
// the HUD, and every menu screen. The garden backdrop is painted once onto an
// offscreen canvas; each frame then layers glow, actors and interface.

import { COLORS, PLAYER, VIEW, WAVES } from './config.js';
import { makeRandom } from './random.js';

let gardenCache = null;

function paintGarden() {
  const canvas = document.createElement('canvas');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const g = canvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, COLORS.nightTop);
  grad.addColorStop(1, COLORS.nightBottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, VIEW.width, VIEW.height);

  const decor = makeRandom(20261115);
  // Moss patches
  for (let i = 0; i < 46; i++) {
    const x = decor.range(0, VIEW.width);
    const y = decor.range(0, VIEW.height);
    const r = decor.range(30, 120);
    const moss = g.createRadialGradient(x, y, 0, x, y, r);
    moss.addColorStop(0, 'rgba(30, 58, 82, 0.55)');
    moss.addColorStop(1, 'rgba(30, 58, 82, 0)');
    g.fillStyle = moss;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Stepping stones
  g.fillStyle = COLORS.stone;
  for (let i = 0; i < 26; i++) {
    const x = decor.range(20, VIEW.width - 20);
    const y = decor.range(20, VIEW.height - 20);
    g.globalAlpha = decor.range(0.25, 0.5);
    g.beginPath();
    g.ellipse(x, y, decor.range(8, 20), decor.range(5, 11), decor.range(0, 3), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  // Tiny night flowers — pale dots with a warm heart
  for (let i = 0; i < 60; i++) {
    const x = decor.range(8, VIEW.width - 8);
    const y = decor.range(8, VIEW.height - 8);
    g.fillStyle = '#a5b4fc';
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2;
      g.beginPath();
      g.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 1.8, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = COLORS.lanternGlow;
    g.beginPath();
    g.arc(x, y, 1.4, 0, Math.PI * 2);
    g.fill();
  }
  // Edge vignette so the garden feels enclosed
  const vig = g.createRadialGradient(VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.42, VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.95);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(2,4,12,0.55)');
  g.fillStyle = vig;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  return canvas;
}

export function drawWorld(ctx, world, input) {
  if (!gardenCache) gardenCache = paintGarden();
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  ctx.drawImage(gardenCache, 0, 0);
  drawFireflies(ctx, world.time);
  for (const dew of world.dews) drawDew(ctx, dew, world.time);
  for (const ring of world.rings) drawRing(ctx, ring);
  for (const enemy of world.enemies) drawEnemy(ctx, enemy, world.time);
  drawKeeper(ctx, world);
  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (world.state !== 'title') drawHud(ctx, world);
  if (world.messageTimer > 0 && world.state === 'playing') drawWaveBanner(ctx, world);
}

function drawFireflies(ctx, time) {
  const flies = makeRandom(777);
  ctx.fillStyle = COLORS.lanternGlow;
  for (let i = 0; i < 22; i++) {
    const baseX = flies.range(0, VIEW.width);
    const baseY = flies.range(0, VIEW.height);
    const x = baseX + Math.sin(time * 0.4 + i * 1.7) * 22;
    const y = baseY + Math.cos(time * 0.3 + i * 2.3) * 16;
    ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 1.6 + i * 3.1));
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDew(ctx, dew, time) {
  const y = dew.y + Math.sin(dew.bob) * 3;
  ctx.fillStyle = COLORS.dew;
  ctx.shadowColor = COLORS.dew;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(dew.x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(dew.x - 1.5, y - 1.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawRing(ctx, ring) {
  const alpha = Math.max(0, ring.life / ring.maxLife);
  ctx.strokeStyle = `rgba(255, 202, 106, ${0.75 * alpha})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 243, 196, ${0.5 * alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius * 0.82, 0, Math.PI * 2);
  ctx.stroke();
}

function drawKeeper(ctx, world) {
  const p = world.player;
  // Lantern light pool
  const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, p.pulseRadius + 60);
  glow.addColorStop(0, 'rgba(255, 202, 106, 0.30)');
  glow.addColorStop(0.6, 'rgba(255, 202, 106, 0.10)');
  glow.addColorStop(1, 'rgba(255, 202, 106, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.pulseRadius + 60, 0, Math.PI * 2);
  ctx.fill();

  const blinking = p.invulnTimer > 0 && Math.floor(world.time * 14) % 2 === 0;
  ctx.globalAlpha = blinking ? 0.45 : 1;
  // Cloak
  ctx.fillStyle = COLORS.keeperCloak;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 14);
  ctx.quadraticCurveTo(p.x + 15, p.y + 2, p.x + 11, p.y + 17);
  ctx.quadraticCurveTo(p.x, p.y + 21, p.x - 11, p.y + 17);
  ctx.quadraticCurveTo(p.x - 15, p.y + 2, p.x, p.y - 14);
  ctx.fill();
  // Head + hood trim
  ctx.fillStyle = COLORS.keeperTrim;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // The lantern, held toward the facing side
  const lx = p.x + p.facing * 17;
  const ly = p.y + 2 + Math.sin(world.time * 2.4) * 1.6;
  ctx.strokeStyle = COLORS.keeperTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + p.facing * 8, p.y - 2);
  ctx.lineTo(lx, ly - 6);
  ctx.stroke();
  ctx.fillStyle = COLORS.lanternDeep;
  ctx.fillRect(lx - 5, ly - 6, 10, 13);
  ctx.fillStyle = COLORS.lanternCore;
  ctx.fillRect(lx - 3, ly - 3.5, 6, 8);
  ctx.shadowColor = COLORS.lanternGlow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(255, 243, 196, 0.9)';
  ctx.beginPath();
  ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Pulse readiness arc around the keeper
  if (world.state === 'playing') {
    const ready = 1 - p.pulseTimer / p.pulseCooldown;
    ctx.strokeStyle = ready >= 1 ? 'rgba(255, 243, 196, 0.95)' : 'rgba(147, 160, 194, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 7, -Math.PI / 2, -Math.PI / 2 + ready * Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, enemy, time) {
  const flash = enemy.flash > 0;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (enemy.kind === 'moth') {
    const flap = Math.sin(time * 16 + enemy.id) * 0.5;
    ctx.fillStyle = flash ? '#ffffff' : COLORS.mothWing;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(flap * 0.5);
      ctx.beginPath();
      ctx.ellipse(9, -3, 10, 5.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = flash ? '#ffffff' : COLORS.mothBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'beetle') {
    ctx.fillStyle = flash ? '#ffffff' : COLORS.beetleShell;
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.radius, enemy.radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = flash ? '#ffffff' : COLORS.beetleDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.radius * 0.8);
    ctx.lineTo(0, enemy.radius * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#1f1025';
    ctx.beginPath();
    ctx.arc(-4, -3, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Husk bloom: a heavy flower head that splits when felled.
    const sway = Math.sin(time * 2 + enemy.id) * 0.08;
    ctx.rotate(sway);
    ctx.fillStyle = flash ? '#ffffff' : COLORS.huskPetal;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 15, Math.sin(a) * 15, 11, 6.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = flash ? '#ffffff' : COLORS.huskCore;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    // HP pips for the tank
    ctx.fillStyle = COLORS.lanternCore;
    for (let i = 0; i < enemy.hp; i++) {
      ctx.beginPath();
      ctx.arc(-9 + i * 6, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (enemy.elite) {
    ctx.strokeStyle = COLORS.elite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  const p = world.player;
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 14, 14, 300, 64, 12);
  ctx.fill();
  ctx.stroke();
  // Hearts
  for (let i = 0; i < p.maxHp; i++) {
    drawHeart(ctx, 42 + i * 30, 40, 11, i < p.hp ? COLORS.heart : COLORS.heartEmpty);
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Wave ${Math.max(1, world.wave)} / ${WAVES.total}`, 34, 68);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText(`Pests left: ${world.enemies.length + world.spawnQueue}`, 168, 68);

  // Score panel
  roundRect(ctx, VIEW.width - 314, 14, 300, 64, 12);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 21px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Score ${world.score}`, VIEW.width - 34, 44);
  ctx.fillStyle = COLORS.dew;
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText(`◆ Dew ${world.dewCollected}`, VIEW.width - 34, 68);

  // Cooldown pips, bottom-left
  drawPip(ctx, 34, VIEW.height - 40, 'Pulse', 1 - p.pulseTimer / p.pulseCooldown, COLORS.lanternGlow);
  drawPip(ctx, 150, VIEW.height - 40, 'Dash', 1 - p.dashTimer / p.dashCooldown, COLORS.keeperCloak);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · Mouse/Space pulse · Shift dash · P pause · M mute', VIEW.width - 20, VIEW.height - 18);
}

function drawPip(ctx, x, y, label, frac, color) {
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 8);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, x, y, 96, 8, 4);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, 96 * Math.max(0, Math.min(1, frac)), 8, 4);
  ctx.fill();
}

function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9);
  ctx.fill();
}

function drawWaveBanner(ctx, world) {
  ctx.globalAlpha = Math.min(1, world.messageTimer);
  ctx.fillStyle = COLORS.lanternCore;
  ctx.font = '700 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 12;
  ctx.fillText(world.message, VIEW.width / 2, 120);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function panel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { drawHeart };
