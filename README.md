# makefun-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Raafi1234/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Raafi1234/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Gloamkeeper — a best-game-01 entry

Keep the lantern lit through ten waves of night pests. **Gloamkeeper** is a
complete, original arena-survival game that runs offline in a desktop browser
from static files — no build step, no network, no libraries.

You are the lantern keeper of the Hollow Garden. Moths flutter in crooked
spirals, skitter beetles zigzag fast, and husk blooms lumber toward the light
and split into moths when felled. Repel them with pulses of lantern light,
dash through danger, gather the dew they drop, and after every cleared wave
choose one of three gifts from the garden (wider flame, a second heart, wind
step, and six more) — builds diverge run to run. Clear wave 10 to win; if the
pests reach you five times, the light goes out.

## Play

```sh
make run        # serves game/ at http://localhost:8080
```

WASD / arrows move · mouse click or Space fires a light pulse · Shift dashes
(briefly untouchable) · P pauses · M mutes. All sound is synthesized live
with WebAudio — a soft night pad under short action blips — and all art is
drawn in code on canvas.

## Layout

- `game/index.html` — the page; `game/src/` holds one module per job:
  `config` (tuning + palette), `random` (seeded RNG), `input`, `audio`
  (WebAudio synth), `world` (simulation: waves, pests, dew, scoring),
  `upgrades` (the gift pool), `render` (garden, actors, HUD), `screens`
  (title, gift choice, pause, endings), `shots` (screenshot staging),
  `main` (boot + state machine).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with `vendor/makefun-game.ts`.
- `screenshots/` — real renders of the game (title, a wave-4 battle, the
  gift choice, victory), staged deterministically via `?shot=` URLs and
  captured with `tools/take-shots.mjs`.

## Run it



---

<sub>Entered on [make.fun](https://make.fun/?ref=waxf8q9w&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
