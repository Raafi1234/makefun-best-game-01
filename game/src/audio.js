// All sound is synthesized with WebAudio — no audio files. A soft two-chord
// night pad loops under the game, and every action gets a short, quiet blip
// so the player hears feedback the moment something happens.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let padTimer = null;

  const ensure = () => {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    return true;
  };

  const tone = ({ freq = 440, end = null, dur = 0.15, type = 'sine', vol = 0.2, delay = 0 }) => {
    if (!ensure()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (end !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  // The night pad: two slow chords (Am add9, F maj7) cross-fading forever.
  const padChord = (freqs, dur) => {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.035, t0 + dur * 0.35);
      gain.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.connect(gain).connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
  };
  const padLoop = () => {
    if (!ctx) return;
    padChord([110, 164.81, 220, 246.94], 6);
    setTimeout(() => padChord([87.31, 130.81, 174.61, 220], 6), 3000);
  };

  return {
    unlock() {
      if (!ensure()) return;
      if (!padTimer) {
        padLoop();
        padTimer = setInterval(padLoop, 6000);
      }
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    pulse() {
      tone({ freq: 620, end: 180, dur: 0.22, type: 'sine', vol: 0.25 });
      tone({ freq: 1240, end: 320, dur: 0.14, type: 'triangle', vol: 0.1 });
    },
    dash() {
      tone({ freq: 300, end: 720, dur: 0.13, type: 'sawtooth', vol: 0.06 });
    },
    hurt() {
      tone({ freq: 220, end: 70, dur: 0.28, type: 'square', vol: 0.16 });
    },
    kill() {
      tone({ freq: 880, end: 1320, dur: 0.1, type: 'triangle', vol: 0.14 });
    },
    dew() {
      tone({ freq: 1560, end: 1980, dur: 0.07, type: 'sine', vol: 0.08 });
    },
    upgrade() {
      tone({ freq: 523, dur: 0.12, type: 'triangle', vol: 0.16 });
      tone({ freq: 659, dur: 0.12, type: 'triangle', vol: 0.16, delay: 0.09 });
      tone({ freq: 784, dur: 0.2, type: 'triangle', vol: 0.16, delay: 0.18 });
    },
    waveClear() {
      tone({ freq: 392, dur: 0.14, type: 'triangle', vol: 0.15 });
      tone({ freq: 523, dur: 0.22, type: 'triangle', vol: 0.15, delay: 0.11 });
    },
    gameOver() {
      tone({ freq: 330, end: 110, dur: 0.7, type: 'triangle', vol: 0.2 });
    },
    win() {
      [523, 659, 784, 1046].forEach((freq, i) =>
        tone({ freq, dur: 0.24, type: 'triangle', vol: 0.16, delay: i * 0.13 }),
      );
    },
    click() {
      tone({ freq: 740, dur: 0.05, type: 'sine', vol: 0.1 });
    },
  };
}
