// Menu screens drawn over the garden: title, the between-wave gift choice,
// pause, game over and victory. Pure drawing plus the card layout the input
// handling in main.js hit-tests against.

import { COLORS, VIEW, WAVES } from './config.js';
import { panel, roundRect } from './render.js';

export function drawTitle(ctx, world) {
  dim(ctx, 0.45);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lanternGlow;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText('✦  the hollow garden presents  ✦', VIEW.width / 2, 168);
  ctx.fillStyle = COLORS.lanternCore;
  ctx.font = '800 92px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(255, 202, 106, 0.55)';
  ctx.shadowBlur = 34;
  ctx.fillText('GLOAMKEEPER', VIEW.width / 2, 268);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.text;
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText('Keep the lantern lit through ten waves of night pests.', VIEW.width / 2, 322);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText('Moths, skitter beetles and husk blooms are coming for the light.', VIEW.width / 2, 352);
  ctx.fillText('Repel them with pulses of lantern light, gather their dew,', VIEW.width / 2, 380);
  ctx.fillText('and take a gift from the garden after every wave.', VIEW.width / 2, 408);

  button(ctx, startButtonRect(), 'BEGIN  —  click or press Enter', true);

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      Mouse click or Space — light pulse', VIEW.width / 2, 620);
  ctx.fillText('Shift — dash (briefly untouchable)      P — pause      M — mute', VIEW.width / 2, 648);
  ctx.fillText('Clear wave 10 to win. If the pests reach you, the light goes out.', VIEW.width / 2, 690);
}

export function startButtonRect() {
  return { x: VIEW.width / 2 - 210, y: 452, w: 420, h: 64 };
}

export function upgradeCardRects() {
  const rects = [];
  const w = 320;
  const h = 210;
  const gap = 28;
  const total = w * 3 + gap * 2;
  const x0 = (VIEW.width - total) / 2;
  for (let i = 0; i < 3; i++) rects.push({ x: x0 + i * (w + gap), y: 320, w, h });
  return rects;
}

export function drawUpgrade(ctx, world, hoverIndex) {
  dim(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lanternCore;
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText(`Wave ${world.wave} cleared`, VIEW.width / 2, 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText('The garden offers a gift. Choose one — click or press 1, 2, 3.', VIEW.width / 2, 232);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillText(`Score ${world.score} · Dew gathered ${world.dewCollected} · Next: wave ${world.wave + 1} of ${WAVES.total}`, VIEW.width / 2, 264);

  const rects = upgradeCardRects();
  world.choices.forEach((choice, i) => {
    const r = rects[i];
    ctx.fillStyle = i === hoverIndex ? 'rgba(38, 48, 92, 0.95)' : COLORS.panel;
    ctx.strokeStyle = i === hoverIndex ? COLORS.lanternGlow : COLORS.panelEdge;
    ctx.lineWidth = i === hoverIndex ? 2.5 : 1.5;
    roundRect(ctx, r.x, r.y, r.w, r.h, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.lanternGlow;
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText(String(i + 1), r.x + r.w / 2, r.y + 48);
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 25px system-ui, sans-serif';
    ctx.fillText(choice.name, r.x + r.w / 2, r.y + 92);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '500 16.5px system-ui, sans-serif';
    wrapText(ctx, choice.blurb, r.x + r.w / 2, r.y + 128, r.w - 44, 22);
  });
}

export function drawPause(ctx) {
  dim(ctx, 0.6);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lanternCore;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillText('Paused', VIEW.width / 2, 360);
  ctx.fillStyle = COLORS.text;
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText('The lantern waits. Press P or Esc to return to the garden.', VIEW.width / 2, 410);
}

export function drawEnd(ctx, world, won) {
  dim(ctx, 0.62);
  panel(ctx, VIEW.width / 2 - 330, 190, 660, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.lanternGlow : COLORS.heart;
  ctx.font = '800 56px system-ui, sans-serif';
  ctx.fillText(won ? 'THE GARDEN BLOOMS' : 'THE LIGHT GOES OUT', VIEW.width / 2, 292);
  ctx.fillStyle = COLORS.text;
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText(
    won
      ? 'Ten waves repelled. Dawn comes, and the lantern can rest.'
      : `The pests overran the lantern on wave ${world.wave}.`,
    VIEW.width / 2,
    340,
  );
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillStyle = COLORS.lanternCore;
  ctx.fillText(`Final score  ${world.score}`, VIEW.width / 2, 402);
  ctx.fillStyle = COLORS.text;
  ctx.font = '500 19px system-ui, sans-serif';
  ctx.fillText(`Waves cleared  ${won ? WAVES.total : world.wave - 1} / ${WAVES.total}`, VIEW.width / 2, 440);
  ctx.fillText(`Pests repelled  ${world.kills}`, VIEW.width / 2, 472);
  ctx.fillStyle = COLORS.dew;
  ctx.fillText(`Dew gathered  ${world.dewCollected}`, VIEW.width / 2, 504);
  button(ctx, restartButtonRect(), 'PLAY AGAIN  —  click or press R', true);
}

export function restartButtonRect() {
  return { x: VIEW.width / 2 - 200, y: 610 - 88, w: 400, h: 56 };
}

function button(ctx, rect, label, primary) {
  ctx.fillStyle = primary ? COLORS.lanternDeep : COLORS.panel;
  ctx.strokeStyle = COLORS.lanternCore;
  ctx.lineWidth = 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a1206';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);
}

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 6, 18, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
