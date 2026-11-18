class HapticsEngine {
  private enabled = true;

  public setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private pulse(pattern: number | number[]): void {
    if (!this.enabled || typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  public tap(): void {
    this.pulse(10);
  }

  public action(): void {
    this.pulse([16, 28, 16]);
  }

  public penalty(): void {
    this.pulse([30, 40, 40]);
  }

  public victory(): void {
    this.pulse([20, 40, 20, 40, 45]);
  }
}

export const haptics = new HapticsEngine();
