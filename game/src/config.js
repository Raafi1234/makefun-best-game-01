// Gloamkeeper — central tuning and palette.
// Every number that shapes how a run feels lives here so the other modules
// stay about behaviour, not constants.

export const VIEW = { width: 1280, height: 800 };

// The Hollow Garden at night: deep indigo dark, moss, and one warm lantern.
export const COLORS = {
  nightTop: '#0b1026',
  nightBottom: '#131a38',
  mossDark: '#16283f',
  mossLight: '#1e3a52',
  stone: '#2b3f5e',
  lanternCore: '#fff3c4',
  lanternGlow: '#ffca6a',
  lanternDeep: '#f59e42',
  keeperCloak: '#7dd3fc',
  keeperTrim: '#e0f2fe',
  dew: '#8ef6d2',
  heart: '#fb7185',
  heartEmpty: '#3b4763',
  text: '#e8ecf8',
  textDim: '#93a0c2',
  panel: 'rgba(10, 14, 32, 0.82)',
  panelEdge: '#3d4c7a',
  mothWing: '#c4b5fd',
  mothBody: '#6d5ba8',
  beetleShell: '#f472b6',
  beetleDark: '#9d2c63',
  huskPetal: '#fda4af',
  huskCore: '#881337',
  elite: '#fde047',
};

export const PLAYER = {
  radius: 16,
  baseSpeed: 265, // px per second
  baseMaxHp: 5,
  contactInvulnSec: 0.9,
  pulse: {
    baseRadius: 128,
    baseDamage: 1,
    baseCooldownSec: 0.85,
    knockback: 340,
    ringSec: 0.32, // how long the light ring stays visible
  },
  dash: {
    baseCooldownSec: 2.4,
    durationSec: 0.16,
    speed: 980,
    invulnSec: 0.28,
  },
};

export const WAVES = {
  total: 10,
  // Enemies per wave before per-type mixing: grows steadily, with a breather
  // on wave 5 (the garden "blooms" and mostly husks arrive).
  counts: [6, 9, 12, 15, 10, 18, 21, 24, 27, 32],
  spawnIntervalSec: 0.85,
  betweenWavesSec: 1.6,
};

export const ENEMIES = {
  moth: { radius: 14, hp: 1, speed: 92, damage: 1, dew: 1, score: 10 },
  beetle: { radius: 12, hp: 1, speed: 168, damage: 1, dew: 1, score: 15 },
  husk: { radius: 26, hp: 4, speed: 44, damage: 1, dew: 4, score: 40 },
  eliteScale: 1.45, // radius multiplier for elites
  eliteHpBonus: 2,
  eliteScoreMul: 3,
};

export const SCORING = {
  waveClearBonus: 100,
  dewValue: 5, // score per dew gathered, on top of kill score
  winBonus: 500,
};
