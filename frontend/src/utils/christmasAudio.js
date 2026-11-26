/**
 * Plays a ~6.2 second warm music-box / celesta arrangement of "Jingle Bells"
 * with soft harmonic accompaniment and subtle sleigh-bell shimmer via Web Audio API.
 * Returns a controller `{ stop, isBlocked, resumeAndPlay }`.
 */

const NOTE_FREQ = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

// [note, startBeat, durationBeats] at 155 BPM (~0.387s per beat -> 16 beats = ~6.2s)
const JINGLE_BELLS_MELODY = [
  // "Jin-gle bells,"
  ['E5', 0, 0.9], ['E5', 1, 0.9], ['E5', 2, 1.8],
  // "jin-gle bells,"
  ['E5', 4, 0.9], ['E5', 5, 0.9], ['E5', 6, 1.8],
  // "jin-gle all the way!"
  ['E5', 8, 0.9], ['G5', 9, 0.9], ['C5', 10, 1.35], ['D5', 11.5, 0.5], ['E5', 12, 3.4],
];

// Gentle follow-up cadence notes in final 2 seconds ("Ho ho! Festive chord")
const ACCOMPANIMENT_CHORDS = [
  { notes: ['C4', 'G4'], beat: 0, dur: 3.8 },
  { notes: ['C4', 'G4'], beat: 4, dur: 3.8 },
  { notes: ['C4', 'E4'], beat: 8, dur: 1.9 },
  { notes: ['G4', 'B4'], beat: 10, dur: 1.9 },
  { notes: ['C4', 'E4', 'G4', 'C5'], beat: 12, dur: 3.6 },
];

const BEAT_SEC = 0.375; // 16 beats * 0.375s = 6.0 seconds total

export const playChristmasIntroSong = ({ onBlockedChange, onEnded } = {}) => {
  const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AudioCtx) {
    return { stop: () => {}, isBlocked: false, resumeAndPlay: async () => false };
  }

  let ctx = null;
  let stopped = false;
  let hasScheduled = false;
  let endTimer = null;
  const activeNodes = [];

  const cleanup = () => {
    stopped = true;
    if (endTimer) {
      window.clearTimeout(endTimer);
      endTimer = null;
    }
    for (const node of activeNodes) {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        // ignore already stopped
      }
    }
    activeNodes.length = 0;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
    ctx = null;
  };

  const scheduleMusic = () => {
    if (!ctx || stopped || hasScheduled) return;
    hasScheduled = true;

    const startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.42, startTime);
    masterGain.connect(ctx.destination);
    activeNodes.push(masterGain);

    // 1. Celesta / Music-box melody
    for (const [note, beat, durBeats] of JINGLE_BELLS_MELODY) {
      const freq = NOTE_FREQ[note];
      if (!freq) continue;
      const t0 = startTime + beat * BEAT_SEC;
      const dur = durBeats * BEAT_SEC;

      // Fundamental bell tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.28, t0 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.14);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.16);
      activeNodes.push(osc, gain);

      // Soft sparkle octave overtone
      const overtone = ctx.createOscillator();
      const overGain = ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, t0);

      overGain.gain.setValueAtTime(0.001, t0);
      overGain.gain.linearRampToValueAtTime(0.055, t0 + 0.01);
      overGain.gain.exponentialRampToValueAtTime(0.001, t0 + Math.min(dur * 0.65, 0.45));

      overtone.connect(overGain);
      overGain.connect(masterGain);
      overtone.start(t0);
      overtone.stop(t0 + Math.min(dur * 0.7, 0.5));
      activeNodes.push(overtone, overGain);
    }

    // 2. Warm accompaniment harmony
    for (const chord of ACCOMPANIMENT_CHORDS) {
      const t0 = startTime + chord.beat * BEAT_SEC;
      const dur = chord.dur * BEAT_SEC;
      for (const note of chord.notes) {
        const freq = NOTE_FREQ[note];
        if (!freq) continue;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(0.055, t0 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
        activeNodes.push(osc, gain);
      }
    }

    // 3. Soft sleigh-bell jingle shimmer on each beat
    const sampleRate = ctx.sampleRate;
    const bellBuffer = ctx.createBuffer(1, Math.floor(sampleRate * 0.12), sampleRate);
    const data = bellBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.032));
    }

    for (let beat = 0; beat < 15; beat += 1) {
      const t0 = startTime + beat * BEAT_SEC;
      const src = ctx.createBufferSource();
      src.buffer = bellBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5800, t0);
      filter.Q.setValueAtTime(3.2, t0);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(beat % 2 === 0 ? 0.065 : 0.035, t0);

      src.connect(filter);
      filter.connect(bellGain);
      bellGain.connect(masterGain);
      src.start(t0);
      activeNodes.push(src, filter, bellGain);
    }

    endTimer = window.setTimeout(() => {
      if (!stopped) {
        cleanup();
        onEnded?.();
      }
    }, 6350);
  };

  const tryStart = async () => {
    try {
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      if (ctx && ctx.state === 'running') {
        onBlockedChange?.(false);
        scheduleMusic();
        return true;
      }
      onBlockedChange?.(true);
      return false;
    } catch {
      onBlockedChange?.(true);
      return false;
    }
  };

  tryStart();

  return {
    stop: cleanup,
    resumeAndPlay: tryStart,
  };
};
