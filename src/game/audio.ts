/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Audio Synthesizer Engine for The Night Forest
class SoundManager {
  private ctx: AudioContext | null = null;
  private windNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private masterVolume: GainNode | null = null;
  private ambienceVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private windPlaying = false;
  private wailTimer: any = null;
  private sequencerTimer: any = null;
  private currentTheme: 'menu' | 'forest' | 'boss' | 'ending' | 'none' = 'none';

  // Horror atmospheric additions
  private dreadOsc1: OscillatorNode | null = null;
  private dreadOsc2: OscillatorNode | null = null;
  private dreadGain: GainNode | null = null;
  private dreadWobbleTimer: any = null;
  private horrorSoundEndTime = 0;
  private cackleTimer: any = null;
  private howlTimer: any = null;

  // Lantern properties
  private lanternSource: AudioBufferSourceNode | null = null;
  private lanternGain: GainNode | null = null;
  private lastLanternFuel = 100;
  private lowFuelTickTimer: any = null;
  private isLowFuelTickScheduled = false;

   init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.value = 0.8;
      this.masterVolume.connect(this.ctx.destination);

      this.ambienceVolume = this.ctx.createGain();
      this.ambienceVolume.gain.value = 0.4;
      this.ambienceVolume.connect(this.masterVolume);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.value = 0.5;
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.value = 0.7;
      this.sfxVolume.connect(this.masterVolume);

      this.startAmbience();
      this.startWailScheduler();
      this.startLanternFlame();
    } catch (e) {
      console.warn("Failed to initialize AudioContext", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume().catch((err) => {
          console.warn("Failed to resume AudioContext async:", err);
        });
      } catch (e) {
        console.warn("Error calling this.ctx.resume():", e);
      }
    }
  }

  // Generate white noise for wind/sfx
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private startAmbience() {
    if (!this.ctx || this.windPlaying) return;
    this.windPlaying = true;

    try {
      // 1. Wind (filtered white noise)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 350;
      filter.Q.value = 2.0;

      const windGain = this.ctx.createGain();
      windGain.gain.value = 0.15;

      noise.connect(filter);
      filter.connect(windGain);
      windGain.connect(this.ambienceVolume!);
      noise.start();

      // Slow wind modulation
      const modulateWind = () => {
        if (!this.ctx || !this.windPlaying) return;
        const now = this.ctx.currentTime;
        const nextTime = now + 4 + Math.random() * 4;
        filter.frequency.exponentialRampToValueAtTime(150 + Math.random() * 350, nextTime);
        filter.Q.linearRampToValueAtTime(1.0 + Math.random() * 3.0, nextTime);
        windGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.14, nextTime);
        setTimeout(modulateWind, (nextTime - now) * 1000);
      };
      modulateWind();

      // 2. Deep Rumble (low frequency engine of foreboding)
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.value = 45; // ultra low
      rumbleGain.gain.value = 0.25;

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ambienceVolume!);
      rumbleOsc.start();

      // Rumble modulation
      const modulateRumble = () => {
        if (!this.ctx || !this.windPlaying) return;
        const now = this.ctx.currentTime;
        rumbleOsc.frequency.linearRampToValueAtTime(40 + Math.random() * 10, now + 5);
        rumbleGain.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.1, now + 5);
        setTimeout(modulateRumble, 5000);
      };
      modulateRumble();

    } catch (e) {
      console.warn("Ambience creation failed", e);
    }
  }

  private startWailScheduler() {
    const scheduleNext = () => {
      this.wailTimer = setTimeout(() => {
        if (Math.random() > 0.4) {
          this.playGhostlyWail();
        } else {
          this.playOwlCall();
        }
        scheduleNext();
      }, 18000 + Math.random() * 15000); // 18-33 seconds
    };
    scheduleNext();
  }

  playOwlCall() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // An owl hoot is typically a dual short whistle with frequency slide
    const hoot = (delay: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now + delay);
      osc.frequency.exponentialRampToValueAtTime(580, now + delay + 0.15);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

      osc.connect(gain);
      gain.connect(this.ambienceVolume!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    };

    hoot(0);
    hoot(0.2); // Double hoot ("hoo-hoo")
  }

  playGhostlyWail() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Resonant filtered sound sweeping around mid frequencies
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 1.2);
    osc.frequency.exponentialRampToValueAtTime(110, now + 2.5);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 1.5);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceVolume!);
    
    osc.start(now);
    osc.stop(now + 3.0);
  }

  playSfx(type: string) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    
    switch (type) {
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start();
        osc.stop(now + 0.06);
        break;
      }
      case 'dash': {
        // High pass filtered noise burst
        const source = this.ctx.createBufferSource();
        source.buffer = this.createNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(4000, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolume!);

        source.start();
        source.stop(now + 0.3);
        break;
      }
      case 'attack': {
        // Wooden/whoosh swing
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolume!);

        osc.start();
        osc.stop(now + 0.18);
        break;
      }
      case 'hit': {
        // Impact thud
        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

        noise.buffer = this.createNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        noise.connect(filter);
        filter.connect(gain);
        
        gain.connect(this.sfxVolume!);

        osc.start();
        noise.start();
        osc.stop(now + 0.2);
        noise.stop(now + 0.2);
        break;
      }
      case 'hurt': {
        // Grunt / impact chord
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(130, now);
        osc1.frequency.linearRampToValueAtTime(70, now + 0.18);

        osc2.frequency.setValueAtTime(95, now);
        osc2.frequency.linearRampToValueAtTime(50, now + 0.18);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxVolume!);

        osc1.start();
        osc2.start();
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.22);
        break;
      }
      case 'collect': {
        // Arpeggio (magical golden sweep)
        const delay = 0.08;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          const noteTime = now + (i * delay);
          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

          osc.connect(gain);
          gain.connect(this.sfxVolume!);
          osc.start(noteTime);
          osc.stop(noteTime + 0.4);
        });
        break;
      }
      case 'power': {
        // Big radiant shockwave ring
        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = 220;

        mod.type = 'sine';
        mod.frequency.value = 25; // 25hz vibrating LFO
        modGain.gain.value = 50;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.7, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.sfxVolume!);

        osc.start();
        mod.start();
        osc.stop(now + 1.3);
        mod.stop(now + 1.3);
        break;
      }
      case 'boss_slam': {
        // Earth shaking explosion
        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

        noise.buffer = this.createNoiseBuffer();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(40, now + 0.5);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolume!);

        osc.start();
        noise.start();
        osc.stop(now + 0.65);
        noise.stop(now + 0.65);
        break;
      }
      case 'boss_phase': {
        // Screeching dark wind
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.6);
        osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start();
        osc.stop(now + 1.4);
        break;
      }
      case 'collapse': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start();
        osc.stop(now + 0.85);
        break;
      }
      case 'chime': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxVolume!);

        osc1.start();
        osc2.start();
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
        break;
      }
    }
  }

  setMusicTheme(theme: 'menu' | 'forest' | 'boss' | 'ending' | 'none') {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    // Clear previous sequencer loops
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }

    // Stop continuous background drone and horror schedules when changing theme
    this.stopAmbientForestDread();
    this.stopHorrorAmbientScheduler();
    this.stopLanternFlame();
    this.stopLowFuelTick();

    // Stop currently running synth notes
    this.activeOscillators.forEach(item => {
      try {
        item.osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];

    if (theme === 'none') return;

    // We can write a custom procedural tempo scheduler
    let step = 0;
    let tempo = 125; // default BPM

    let pattern: number[] = [];
    let oscType: OscillatorType = 'sine';
    let baseOctave = 130; // C3 approx

    if (theme === 'menu') {
      tempo = 90;
      pattern = [0, 4, 7, 11, 7, 4, 12, 7]; // Dark minor chord progressions
      oscType = 'triangle';
      baseOctave = 110; // A2 approx
    } else if (theme === 'forest') {
      tempo = 110;
      pattern = [0, 3, 5, 7, 10, 7, 5, 3]; // Folk-like pentatonic minor scale
      oscType = 'sine';
      baseOctave = 146.83; // D3
      this.startAmbientForestDread();
      this.startHorrorAmbientScheduler();
    } else if (theme === 'boss') {
      tempo = 135;
      pattern = [0, 1, 4, 1, 0, 1, 4, 5]; // Oppressive Phrygian dominant
      oscType = 'sawtooth';
      baseOctave = 82.41; // E2 (low and heavy)
    } else if (theme === 'ending') {
      tempo = 100;
      pattern = [0, 4, 7, 9, 12, 7, 9, 4]; // Highly triumphant G-major style chord
      oscType = 'triangle';
      baseOctave = 196; // G3 (warm and light)
    }

    const playNoteAtStep = () => {
      if (!this.ctx || this.currentTheme !== theme) return;

      const now = this.ctx.currentTime;
      const noteOffset = pattern[step % pattern.length];
      
      // Map semitone offset to multiplier
      const freq = baseOctave * Math.pow(1.059463, noteOffset);

      // Simple bass/melody node
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, now);
      
      // Make high beats/accents
      const isDownbeat = (step % 4 === 0);
      const vol = isDownbeat ? 0.18 : 0.08;

      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(vol, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + (60 / tempo) * 0.95);

      osc.connect(noteGain);
      noteGain.connect(this.musicVolume!);
      
      osc.start(now);
      osc.stop(now + (60 / tempo));

      const item = { osc, gain: noteGain };
      this.activeOscillators.push(item);
      
      // Garbage collect old osc references after they stop
      setTimeout(() => {
        const index = this.activeOscillators.indexOf(item);
        if (index > -1) {
          this.activeOscillators.splice(index, 1);
        }
      }, (60 / tempo) * 1200);

      // Also schedule a simple drum tick procedurally
      if (theme === 'boss' && step % 2 === 0) {
        // Low tribal bass drum
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.frequency.setValueAtTime(95, now);
        drumOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        drumGain.gain.setValueAtTime(0.35, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        drumOsc.connect(drumGain);
        drumGain.connect(this.musicVolume!);
        drumOsc.start(now);
        drumOsc.stop(now + 0.25);
      } else if (theme === 'forest' && step % 4 === 0) {
        // Softer hand drum pattern
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.type = 'triangle';
        drumOsc.frequency.setValueAtTime(110, now);
        drumOsc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        drumGain.gain.setValueAtTime(0.2, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        drumOsc.connect(drumGain);
        drumGain.connect(this.musicVolume!);
        drumOsc.start(now);
        drumOsc.stop(now + 0.2);
      }

      step++;
    };

    // Calculate interval milliseconds
    const ms = (60 / tempo) * 1000;
    playNoteAtStep();
    this.sequencerTimer = setInterval(playNoteAtStep, ms);
  }

  playSpiritChime() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Play a sequence of 3-5 randomized high-frequency gentle bell-like notes
    const numTones = 3 + Math.floor(Math.random() * 3); // 3 to 5 notes
    for (let i = 0; i < numTones; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      // High sweet wind-chime frequencies (pentatonic scale feel)
      const frequencies = [880, 987, 1046, 1174, 1318, 1568, 1760];
      const baseFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
      osc.frequency.setValueAtTime(baseFreq, now + i * 0.15 + Math.random() * 0.1);
      
      // Long gentle decayed release for each note
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.15 + 0.02 + Math.random() * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.2 + Math.random() * 0.3);
      
      osc.connect(gain);
      gain.connect(this.ambienceVolume || this.masterVolume!);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 1.6);
    }
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  playWitchCackle() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    if (now < this.horrorSoundEndTime) return;
    this.horrorSoundEndTime = now + 1.2;

    try {
      const distortion = this.ctx.createWaveShaper();
      distortion.curve = this.makeDistortionCurve(200);
      distortion.oversample = '4x';

      const masterGainNode = this.ctx.createGain();
      masterGainNode.gain.setValueAtTime(0.15, now);

      distortion.connect(masterGainNode);
      masterGainNode.connect(this.ambienceVolume || this.masterVolume!);

      // 4 bursts of 200ms with 50ms gaps
      const freqs = [
        { start: 800, end: 600 },
        { start: 600, end: 400 },
        { start: 900, end: 600 },
        { start: 600, end: 300 }
      ];

      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const burstGain = this.ctx.createGain();

        osc.type = 'sawtooth';

        const burstStart = now + i * 0.25;
        const burstEnd = burstStart + 0.20;

        osc.frequency.setValueAtTime(freqs[i].start, burstStart);
        osc.frequency.exponentialRampToValueAtTime(freqs[i].end, burstEnd);

        burstGain.gain.setValueAtTime(0, burstStart);
        burstGain.gain.linearRampToValueAtTime(1.0, burstStart + 0.02);
        burstGain.gain.exponentialRampToValueAtTime(0.001, burstEnd);

        osc.connect(burstGain);
        burstGain.connect(distortion);

        osc.start(burstStart);
        osc.stop(burstEnd);
      }
    } catch (e) {
      console.warn("Failed playing Witch Cackle sound", e);
    }
  }

  playHyenaHowl() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    if (now < this.horrorSoundEndTime) return;
    this.horrorSoundEndTime = now + 2.5;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';

      // 300Hz -> 600Hz -> 200Hz over 2000ms
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(200, now + 2.0);

      // Vibrato: 6Hz LFO modulating pitch ±30Hz
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(6, now);
      lfoGain.gain.setValueAtTime(30, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc.connect(gainNode);
      gainNode.connect(this.ambienceVolume || this.masterVolume!);

      lfo.start(now);
      osc.start(now);

      lfo.stop(now + 2.0);
      osc.stop(now + 2.0);
    } catch (e) {
      console.warn("Failed playing Hyena Howl sound", e);
    }
  }

  private startAmbientForestDread() {
    if (!this.ctx || this.dreadOsc1) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      this.dreadOsc1 = this.ctx.createOscillator();
      this.dreadOsc2 = this.ctx.createOscillator();
      this.dreadGain = this.ctx.createGain();

      this.dreadOsc1.type = 'sine';
      this.dreadOsc1.frequency.setValueAtTime(40, now);

      this.dreadOsc2.type = 'sine';
      this.dreadOsc2.frequency.setValueAtTime(43, now);

      this.dreadGain.gain.setValueAtTime(0.06, now);

      this.dreadOsc1.connect(this.dreadGain);
      this.dreadOsc2.connect(this.dreadGain);
      this.dreadGain.connect(this.ambienceVolume || this.masterVolume!);

      this.dreadOsc1.start();
      this.dreadOsc2.start();

      const wobble = () => {
        if (!this.ctx || !this.dreadGain || !this.dreadOsc1) return;
        const curNow = this.ctx.currentTime;
        const nextTime = curNow + 4 + Math.random() * 4;
        const targetGain = 0.04 + Math.random() * 0.04; // 0.06 ± 0.02 range
        this.dreadGain.gain.linearRampToValueAtTime(targetGain, nextTime);
        this.dreadWobbleTimer = setTimeout(wobble, (nextTime - curNow) * 1000);
      };
      wobble();
    } catch (e) {
      console.warn("Failed starting ambient Forest Dread", e);
    }
  }

  private stopAmbientForestDread() {
    if (this.dreadWobbleTimer) {
      clearTimeout(this.dreadWobbleTimer);
      this.dreadWobbleTimer = null;
    }
    if (this.dreadOsc1) {
      try { this.dreadOsc1.stop(); } catch (e) {}
      this.dreadOsc1 = null;
    }
    if (this.dreadOsc2) {
      try { this.dreadOsc2.stop(); } catch (e) {}
      this.dreadOsc2 = null;
    }
    this.dreadGain = null;
  }

  private stopHorrorAmbientScheduler() {
    if (this.cackleTimer) {
      clearTimeout(this.cackleTimer);
      this.cackleTimer = null;
    }
    if (this.howlTimer) {
      clearTimeout(this.howlTimer);
      this.howlTimer = null;
    }
  }

  private startHorrorAmbientScheduler() {
    this.stopHorrorAmbientScheduler();

    const scheduleCackle = () => {
      const delay = (25 + Math.random() * 20) * 1000; // 25-45s
      this.cackleTimer = setTimeout(() => {
        if (this.currentTheme === 'forest') {
          this.playWitchCackle();
        }
        scheduleCackle();
      }, delay);
    };

    const scheduleHowl = () => {
      const delay = (30 + Math.random() * 20) * 1000; // 30-50s
      this.howlTimer = setTimeout(() => {
        if (this.currentTheme === 'forest') {
          this.playHyenaHowl();
        }
        scheduleHowl();
      }, delay);
    };

    scheduleCackle();
    scheduleHowl();
  }

  playEnemyGrunt(enemyId: number, gainVal: number) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      const duration = 0.2 + Math.random() * 0.2; // 200 - 400ms
      const baseFreq = 80 + (enemyId * 13) % 41; // 80 - 120Hz range

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gainNode = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.Q.setValueAtTime(8, now);

      const numSteps = 3 + Math.floor(Math.random() * 3); // 3 to 5 steps
      const stepDuration = duration / numSteps;
      for (let s = 1; s < numSteps; s++) {
        const stepFreq = 80 + Math.random() * 100; // 80 to 180Hz range
        osc.frequency.setValueAtTime(stepFreq, now + s * stepDuration);
      }

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gainVal, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Failed playing enemy grunt sound", e);
    }
  }

  playEyeDisappear() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Failed playing eye disappear sound", e);
    }
  }

  startLanternFlame() {
    if (!this.ctx || this.lanternSource) return;
    this.resume();
    try {
      this.lanternSource = this.ctx.createBufferSource();
      this.lanternSource.buffer = this.createNoiseBuffer();
      this.lanternSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.lanternGain = this.ctx.createGain();
      this.lanternGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.lanternSource.connect(filter);
      filter.connect(this.lanternGain);
      this.lanternGain.connect(this.ambienceVolume || this.masterVolume!);

      this.lanternSource.start();
    } catch (e) {
      console.warn("Failed to start lantern flame sound:", e);
    }
  }

  stopLanternFlame() {
    if (this.lanternSource) {
      try {
        this.lanternSource.stop();
      } catch (e) {}
      this.lanternSource = null;
    }
    this.lanternGain = null;
  }

  playLowFuelTick() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.09, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Failed to play low fuel tick sound", e);
    }
  }

  private scheduleLowFuelTick() {
    if (this.lowFuelTickTimer) {
      clearTimeout(this.lowFuelTickTimer);
    }
    this.isLowFuelTickScheduled = true;

    const tick = () => {
      const fuel = this.lastLanternFuel;
      if (fuel <= 0 || fuel >= 25) {
        this.isLowFuelTickScheduled = false;
        return;
      }
      this.playLowFuelTick();

      let gap = 1200;
      if (fuel >= 10) {
        const t = (fuel - 10) / 15;
        gap = 400 + t * 800;
      } else if (fuel >= 5) {
        const t = (fuel - 5) / 5;
        gap = 150 + t * 250;
      } else {
        gap = 150;
      }

      this.lowFuelTickTimer = setTimeout(tick, gap + 80);
    };

    tick();
  }

  stopLowFuelTick() {
    this.isLowFuelTickScheduled = false;
    if (this.lowFuelTickTimer) {
      clearTimeout(this.lowFuelTickTimer);
      this.lowFuelTickTimer = null;
    }
  }

  updateLanternSound(fuel: number) {
    if (!this.ctx) return;
    this.lastLanternFuel = fuel;

    if (fuel > 0) {
      if (!this.lanternSource) {
        this.startLanternFlame();
      }
      if (this.lanternGain) {
        this.lanternGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }
    } else {
      this.stopLanternFlame();
    }

    if (fuel < 25 && fuel > 0) {
      if (!this.isLowFuelTickScheduled) {
        this.scheduleLowFuelTick();
      }
    } else {
      this.stopLowFuelTick();
    }
  }

  playLanternFlickerSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      const freq = 180 + (Math.random() * 40 - 20);
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn("Failed to play lantern flicker sound", e);
    }
  }

  dimMusic() {
    if (this.musicVolume && this.ctx) {
      try {
        this.musicVolume.gain.linearRampToValueAtTime(0.10, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
    if (this.ambienceVolume && this.ctx) {
      try {
        this.ambienceVolume.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  undimMusic() {
    if (this.musicVolume && this.ctx) {
      try {
        this.musicVolume.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
    if (this.ambienceVolume && this.ctx) {
      try {
        this.ambienceVolume.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  playHeartbeatSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      // Lub
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(60, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.sfxVolume || this.masterVolume!);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Dub
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(52, now + 0.22);
      gain2.gain.setValueAtTime(0, now + 0.22);
      gain2.gain.linearRampToValueAtTime(0.13, now + 0.22 + 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22 + 0.065);
      osc2.connect(gain2);
      gain2.connect(this.sfxVolume || this.masterVolume!);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.22 + 0.065);
    } catch (e) {
      console.warn("Failed to play heartbeat sound", e);
    }
  }

  playShieldBashSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.15);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Failed to play shield bash sound", e);
    }
  }

  playReflectSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.20);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);
      osc.start(now);
      osc.stop(now + 0.20);
    } catch (e) {
      console.warn("Failed to play reflect sound", e);
    }
  }

  playSpearStrikeSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.10);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume || this.masterVolume!);
      osc.start(now);
      osc.stop(now + 0.10);
    } catch (e) {
      console.warn("Failed to play spear strike sound", e);
    }
  }
}

export const gameAudio = new SoundManager();
window.gameAudio = gameAudio;
