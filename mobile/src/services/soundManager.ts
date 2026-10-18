// Web Audio API Sound Synthesizer for tactile feedback & alarm simulation

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopAlarm();
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Soft tactile click for button presses
  playTap() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (_) {}
  }

  // Pleasant warm chime for successful connection / calibration
  playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = this.ctx!.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch (_) {}
  }

  // Pulsing emergency buzzer tone (frequency 880Hz / 440Hz alert)
  startAlarmTone() {
    if (this.isMuted || this.alarmOsc) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.alarmOsc = this.ctx.createOscillator();
      this.alarmGain = this.ctx.createGain();

      this.alarmOsc.type = 'sawtooth';
      this.alarmOsc.frequency.setValueAtTime(880, this.ctx.currentTime);

      // Pulse modulation
      this.alarmGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.alarmOsc.connect(this.alarmGain);
      this.alarmGain.connect(this.ctx.destination);
      this.alarmOsc.start();
    } catch (_) {}
  }

  stopAlarm() {
    try {
      if (this.alarmOsc) {
        this.alarmOsc.stop();
        this.alarmOsc.disconnect();
        this.alarmOsc = null;
      }
      if (this.alarmGain) {
        this.alarmGain.disconnect();
        this.alarmGain = null;
      }
    } catch (_) {}
  }
}

export const soundMgr = new SoundManager();
