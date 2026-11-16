// The between-wave choices. After each cleared wave the keeper picks one of
// three gifts from the garden; every gift stacks, so builds diverge run to
// run. `apply` mutates the player's derived stats in world.js.

export const UPGRADES = [
  {
    id: 'wide-flame',
    name: 'Wide Flame',
    blurb: 'Light pulse reaches +22% farther.',
    apply: (p) => {
      p.pulseRadius *= 1.22;
    },
  },
  {
    id: 'quick-wick',
    name: 'Quick Wick',
    blurb: 'Light pulse recharges 18% faster.',
    apply: (p) => {
      p.pulseCooldown *= 0.82;
    },
  },
  {
    id: 'heavy-light',
    name: 'Heavy Light',
    blurb: 'Pulses hit +1 harder. Husks fear you.',
    apply: (p) => {
      p.pulseDamage += 1;
    },
  },
  {
    id: 'swift-boots',
    name: 'Swift Boots',
    blurb: 'Move 12% faster through the moss.',
    apply: (p) => {
      p.speed *= 1.12;
    },
  },
  {
    id: 'second-heart',
    name: 'Second Heart',
    blurb: '+1 max heart, and mend 1 now.',
    apply: (p) => {
      p.maxHp += 1;
      p.hp = Math.min(p.maxHp, p.hp + 1);
    },
  },
  {
    id: 'mend',
    name: 'Dew Poultice',
    blurb: 'Mend 2 hearts right now.',
    apply: (p) => {
      p.hp = Math.min(p.maxHp, p.hp + 2);
    },
  },
  {
    id: 'wind-step',
    name: 'Wind Step',
    blurb: 'Dash recharges 25% faster.',
    apply: (p) => {
      p.dashCooldown *= 0.75;
    },
  },
  {
    id: 'dew-magnet',
    name: 'Dew Magnet',
    blurb: 'Dew drifts to you from twice as far.',
    apply: (p) => {
      p.magnetRadius *= 2;
    },
  },
  {
    id: 'thick-cloak',
    name: 'Thick Cloak',
    blurb: 'Briefly untouchable after any hit: +0.5s.',
    apply: (p) => {
      p.invulnSec += 0.5;
    },
  },
];

// Draw three distinct gifts for the choice screen.
export function drawChoices(random) {
  const pool = [...UPGRADES];
  const choices = [];
  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(random.next() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}
