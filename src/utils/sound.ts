class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext?: typeof AudioContext})
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    delay = 0
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCard(): void {
    this.tone(360, 0.07, 'triangle', 0.08);
    this.tone(540, 0.06, 'sine', 0.05, 0.03);
  }

  public drawCard(): void {
    this.tone(240, 0.07, 'sine', 0.06);
  }

  public actionCard(): void {
    this.tone(440, 0.1, 'triangle', 0.08);
    this.tone(660, 0.12, 'triangle', 0.07, 0.06);
  }

  public wildCard(): void {
    this.tone(392, 0.11, 'sine', 0.07);
    this.tone(493.88, 0.11, 'sine', 0.07, 0.05);
    this.tone(587.33, 0.15, 'sine', 0.08, 0.1);
  }

  public unoShout(): void {
    this.tone(587.33, 0.1, 'triangle', 0.1);
    this.tone(880, 0.22, 'triangle', 0.11, 0.08);
  }

  public penalty(): void {
    this.tone(220, 0.14, 'sawtooth', 0.05);
    this.tone(164.81, 0.2, 'sawtooth', 0.05, 0.1);
  }

  public victory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, 0.22, 'triangle', 0.09, idx * 0.09);
    });
  }
}

export const soundEngine = new SoundEngine();
