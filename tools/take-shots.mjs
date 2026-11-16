// Screenshot + smoke-test tool for Gloamkeeper (local only, not part of the
// entry). Uses the workspace's headless Chromium (puppeteer-core +
// @sparticuz/chromium from ~/workspace/makefun/.tools).
//
//   node tools/take-shots.mjs shots   — write screenshots/ from shots.json
//   node tools/take-shots.mjs play    — scripted play-test, reports errors
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun/.tools/package.json');
const puppeteer = require('puppeteer-core');
const chromiumModule = require('@sparticuz/chromium');
const chromium = chromiumModule.default ?? chromiumModule;

const BASE = process.env.GAME_URL ?? 'http://localhost:8901';
const mode = process.argv[2] ?? 'shots';

const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  executablePath: exe,
  args: [...chromium.args, '--no-sandbox', '--hide-scrollbars'],
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

if (mode === 'shots') {
  const shots = JSON.parse(readFileSync(new URL('../shots.json', import.meta.url), 'utf8'));
  for (const shot of shots) {
    for (let attempt = 1; ; attempt++) {
      try {
        await page.goto(BASE + '/' + shot.query, { waitUntil: 'load', timeout: 60000 });
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
        console.log('retry', shot.name, err.message.slice(0, 80));
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    const out = new URL(`../screenshots/${shot.name}`, import.meta.url);
    await page.screenshot({ path: out.pathname, type: 'jpeg', quality: 85 });
    console.log('wrote', shot.name);
  }
} else {
  // Play-test: title → begin → move, pulse, dash → survive some seconds.
  await page.goto(BASE + '/?seed=7', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.mouse.click(640, 484); // BEGIN button
  await new Promise((r) => setTimeout(r, 400));
  await page.keyboard.down('d');
  await new Promise((r) => setTimeout(r, 600));
  await page.keyboard.up('d');
  await page.mouse.click(700, 400); // pulse
  await page.keyboard.down('Shift');
  await new Promise((r) => setTimeout(r, 120));
  await page.keyboard.up('Shift');
  await page.keyboard.down('w');
  await new Promise((r) => setTimeout(r, 2500));
  await page.keyboard.up('w');
  await page.keyboard.press('p'); // pause
  await new Promise((r) => setTimeout(r, 250));
  await page.keyboard.press('p'); // resume
  await new Promise((r) => setTimeout(r, 1500));
  const probe = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const g = canvas.getContext('2d');
    const data = g.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    let distinct = new Set();
    for (let i = 0; i < data.length; i += 401 * 4) {
      sum += data[i] + data[i + 1] + data[i + 2];
      distinct.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    }
    return { meanBrightness: sum / (data.length / (401 * 4)) / 3, distinctColors: distinct.size };
  });
  await page.screenshot({ path: '/tmp/gloam-playtest.jpg', type: 'jpeg', quality: 85 });
  console.log('probe:', JSON.stringify(probe));
  writeFileSync('/tmp/gloam-playtest.json', JSON.stringify({ probe, errors }, null, 2));
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
if (errors.length) process.exit(1);
