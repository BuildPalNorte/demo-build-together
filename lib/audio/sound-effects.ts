// Pure Web Audio API synthesized sound effects engine for Build Together
// Zero external mp3/wav files. 100% synthesized in real time.

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Rate limiting to prevent audio clipping during concurrent bursts
  private lastNodeSoundTime = 0;
  private lastConnectionSoundTime = 0;
  private readonly MIN_NODE_INTERVAL_MS = 140;
  private readonly MIN_CONNECTION_INTERVAL_MS = 220;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('bt_audio_muted');
      this.isMuted = savedMute !== null ? savedMute === 'true' : true;
    }
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bt_audio_muted', String(muted));
    }
    if (!muted) {
      this.initContext();
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  /**
   * Futuristic digital pop with ascending pitch
   * Duration: ~160ms. Pleasant, clean, non-harsh.
   */
  public playNodeCreated(): void {
    if (this.isMuted) return;

    const now = Date.now();
    if (now - this.lastNodeSoundTime < this.MIN_NODE_INTERVAL_MS) {
      return; // Rate limited during burst
    }
    this.lastNodeSoundTime = now;

    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;

      // Oscillator 1: Main ascending tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);

      // Soft envelope
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      // Lowpass filter for smooth warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {
      // Audio autoplay policy or device sleep
    }
  }

  /**
   * Harmonious electronic chime with two complementary notes (E5 + B5)
   * Duration: ~340ms. Rewarding, elegant, spatial.
   */
  public playConnectionFormed(): void {
    if (this.isMuted) return;

    const now = Date.now();
    if (now - this.lastConnectionSoundTime < this.MIN_CONNECTION_INTERVAL_MS) {
      return; // Rate limited during burst
    }
    this.lastConnectionSoundTime = now;

    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;

      // Two complementary notes: E5 (659.25Hz) and B5 (987.77Hz)
      const frequencies = [659.25, 987.77];
      const offsets = [0, 0.07];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteStart = t + offsets[idx];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, noteStart);
        filter.Q.setValueAtTime(3.0, noteStart);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    } catch {
      // Autoplay or background audio constraint
    }
  }
}

export const soundEffects = new SoundEffectsEngine();
