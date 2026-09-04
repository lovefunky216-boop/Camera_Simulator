/**
 * Hasselblad Audio Engine
 * Web Audio API based leaf shutter mechanical synthesis and dial clicks
 */

class CameraAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic Hasselblad XCD Leaf Shutter sound
  playLeafShutter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Solenoid click (Initial magnetic release trigger)
    const oscSolenoid = ctx.createOscillator();
    const gainSolenoid = ctx.createGain();
    oscSolenoid.type = 'triangle';
    oscSolenoid.frequency.setValueAtTime(1200, now);
    oscSolenoid.frequency.exponentialRampToValueAtTime(120, now + 0.025);
    gainSolenoid.gain.setValueAtTime(0.5, now);
    gainSolenoid.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    oscSolenoid.connect(gainSolenoid);
    gainSolenoid.connect(ctx.destination);
    oscSolenoid.start(now);
    oscSolenoid.stop(now + 0.025);

    // 2. High-speed leaf blades opening friction (Filtered noise)
    const openBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const openData = openBuffer.getChannelData(0);
    for (let i = 0; i < openData.length; i++) {
      openData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const openNoise = ctx.createBufferSource();
    openNoise.buffer = openBuffer;
    const openFilter = ctx.createBiquadFilter();
    openFilter.type = 'bandpass';
    openFilter.frequency.setValueAtTime(3200, now + 0.005);
    openFilter.Q.setValueAtTime(3, now + 0.005);
    const openGain = ctx.createGain();
    openGain.gain.setValueAtTime(0.35, now + 0.005);
    openGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    openNoise.connect(openFilter);
    openFilter.connect(openGain);
    openGain.connect(ctx.destination);
    openNoise.start(now + 0.005);
    openNoise.stop(now + 0.045);

    // 3. Shutter closing snap & body acoustic resonance
    const closeDelay = 0.055; // leaf transit time
    const oscClose = ctx.createOscillator();
    const gainClose = ctx.createGain();
    oscClose.type = 'sine';
    oscClose.frequency.setValueAtTime(380, now + closeDelay);
    oscClose.frequency.exponentialRampToValueAtTime(45, now + closeDelay + 0.08);
    gainClose.gain.setValueAtTime(0.7, now + closeDelay);
    gainClose.gain.exponentialRampToValueAtTime(0.001, now + closeDelay + 0.08);
    oscClose.connect(gainClose);
    gainClose.connect(ctx.destination);
    oscClose.start(now + closeDelay);
    oscClose.stop(now + closeDelay + 0.08);

    // 4. Subtle mechanical spring settling / damper echo
    const settleBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const settleData = settleBuffer.getChannelData(0);
    for (let i = 0; i < settleData.length; i++) {
      settleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const settleNoise = ctx.createBufferSource();
    settleNoise.buffer = settleBuffer;
    const settleFilter = ctx.createBiquadFilter();
    settleFilter.type = 'highpass';
    settleFilter.frequency.setValueAtTime(1800, now + closeDelay + 0.01);
    const settleGain = ctx.createGain();
    settleGain.gain.setValueAtTime(0.2, now + closeDelay + 0.01);
    settleGain.gain.exponentialRampToValueAtTime(0.001, now + closeDelay + 0.05);
    settleNoise.connect(settleFilter);
    settleFilter.connect(settleGain);
    settleGain.connect(ctx.destination);
    settleNoise.start(now + closeDelay + 0.01);
    settleNoise.stop(now + closeDelay + 0.06);

    // Trigger device haptic vibration if supported (mobile devices)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([20, 30, 45]);
      } catch (e) {
        // ignore
      }
    }
  }

  // Precision CNC dial tick sound
  playDialTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.012);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.012);

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  }

  // Mode switch click sound
  playToggleSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.02);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }
}

window.cameraAudio = new CameraAudioEngine();
