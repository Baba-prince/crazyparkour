// Catchy instrumental beat — no vocals (Web Audio synth)
window.ParkourMusic = (() => {
  let ctx = null;
  let master = null;
  let sfx = null;
  let playing = false;
  let muted = false;
  let timer = null;
  let nextNoteTime = 0;
  let step = 0;

  const BPM = 128;
  const SIXTEENTH = 60 / BPM / 4;
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD = 0.18;

  const bassNotes = [110, 110, 130.81, 110, 98, 98, 110, 130.81];
  const leadNotes = [
    440, 0, 523.25, 440, 392, 0, 349.23, 392,
    440, 523.25, 587.33, 523.25, 440, 0, 392, 440,
  ];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Web Audio not supported");
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.35;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = muted ? 0 : 0.55;
    sfx.connect(ctx.destination);
    return ctx;
  }

  function envGain(g, start, dur, peak) {
    const a = Math.max(0.005, Math.min(0.02, dur * 0.15));
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + a);
    g.gain.linearRampToValueAtTime(0.0001, start + dur);
  }

  function tone(freq, type, start, dur, gain, freqEnd) {
    if (!freq || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), start);
      if (freqEnd) {
        osc.frequency.linearRampToValueAtTime(Math.max(20, freqEnd), start + dur);
      }
      envGain(g, start, dur, gain);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    } catch (_) { /* ignore schedule glitches */ }
  }

  function noiseHit(start, dur, gain, hipass) {
    if (!ctx) return;
    try {
      const size = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = hipass || 1000;
      const g = ctx.createGain();
      envGain(g, start, dur, gain);
      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start(start);
      src.stop(start + dur + 0.05);
    } catch (_) { /* ignore */ }
  }

  function scheduleStep(s, when) {
    if (s % 4 === 0) tone(140, "sine", when, 0.2, 0.85, 40);
    if (s % 8 === 4) {
      noiseHit(when, 0.12, 0.4, 900);
      tone(200, "triangle", when, 0.08, 0.25, 90);
    }
    if (s % 2 === 0) noiseHit(when, 0.035, 0.16, 4000);
    if (s % 8 === 6) noiseHit(when, 0.09, 0.2, 3000);

    const b = bassNotes[Math.floor(s / 2) % bassNotes.length];
    if (s % 2 === 0) tone(b, "square", when, 0.15, 0.18);

    const lead = leadNotes[s % leadNotes.length];
    if (lead) tone(lead, "triangle", when, 0.13, 0.16);

    if (s % 16 === 10) tone(880, "sine", when, 0.06, 0.08);
  }

  function scheduler() {
    if (!playing || !ctx) return;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(step % 16, nextNoteTime);
      nextNoteTime += SIXTEENTH;
      step += 1;
    }
  }

  async function unlock() {
    ensure();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // Silent buffer — required on some browsers to fully unlock audio
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  }

  async function start() {
    try {
      await unlock();
      if (playing) {
        if (ctx.state === "suspended") await ctx.resume();
        return true;
      }
      playing = true;
      step = 0;
      nextNoteTime = ctx.currentTime + 0.08;
      if (timer) clearInterval(timer);
      timer = setInterval(scheduler, LOOKAHEAD_MS);
      scheduler();
      return true;
    } catch (err) {
      console.error("ParkourMusic failed:", err);
      return false;
    }
  }

  function stop() {
    playing = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function setMuted(value) {
    muted = !!value;
    if (master) master.gain.value = muted ? 0 : 0.35;
    if (sfx) sfx.gain.value = muted ? 0 : 0.55;
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function isMuted() {
    return muted;
  }

  function isPlaying() {
    return playing && !muted;
  }

  /** Short springy jump blip */
  function jump() {
    if (!ctx || muted) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.linearRampToValueAtTime(520, t + 0.07);
      osc.frequency.linearRampToValueAtTime(360, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.015);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(g);
      g.connect(sfx || master);
      osc.start(t);
      osc.stop(t + 0.18);

      // Soft whoosh under the blip
      const size = Math.floor(ctx.sampleRate * 0.1);
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const ng = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      ng.gain.setValueAtTime(0.12, t);
      ng.gain.linearRampToValueAtTime(0.0001, t + 0.1);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(sfx || master);
      noise.start(t);
      noise.stop(t + 0.12);
    } catch (_) { /* ignore */ }
  }

  return { start, stop, toggleMute, setMuted, isMuted, isPlaying, jump };
})();
