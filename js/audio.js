/**
 * Hasselblad 503CX Sound Engine
 * Synthesizes:
 * 1. Metallic hood pop-open latch sound
 * 2. Heavy 503CX auxiliary mirror slap & mechanical shutter
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

  // 1. Waist-level hood spring latch pop-open sound (찰칵! 촥)
  playHoodOpen() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Metallic latch click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.02);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.02);

    // Metal leaves expanding friction
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now + 0.01);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.01);
    noise.stop(now + 0.06);

    // Spring settle "tick"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.06);
    gain2.gain.setValueAtTime(0.35, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.07);

    this.triggerHaptic(15);
  }

  // 2. Heavy 503CX Mechanical Mirror Slap & Shutter (철-컥!)
  playShutter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Heavy Mirror flip-up thump
    const mirrorOsc = ctx.createOscillator();
    const mirrorGain = ctx.createGain();
    mirrorOsc.type = 'triangle';
    mirrorOsc.frequency.setValueAtTime(260, now);
    mirrorOsc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
    mirrorGain.gain.setValueAtTime(0.9, now);
    mirrorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    mirrorOsc.connect(mirrorGain);
    mirrorGain.connect(ctx.destination);
    mirrorOsc.start(now);
    mirrorOsc.stop(now + 0.09);

    // Mechanical gear whir & spring release
    const gearBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const gearData = gearBuffer.getChannelData(0);
    for (let i = 0; i < gearData.length; i++) {
      gearData[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.06);
    }
    const gearNoise = ctx.createBufferSource();
    gearNoise.buffer = gearBuffer;
    const gearFilter = ctx.createBiquadFilter();
    gearFilter.type = 'bandpass';
    gearFilter.frequency.setValueAtTime(1800, now);
    const gearGain = ctx.createGain();
    gearGain.gain.setValueAtTime(0.35, now);
    gearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    gearNoise.connect(gearFilter);
    gearFilter.connect(gearGain);
    gearGain.connect(ctx.destination);
    gearNoise.start(now);
    gearNoise.stop(now + 0.08);

    // Rear auxiliary shutter closure slap
    const flapDelay = 0.07;
    const flapOsc = ctx.createOscillator();
    const flapGain = ctx.createGain();
    flapOsc.type = 'sine';
    flapOsc.frequency.setValueAtTime(380, now + flapDelay);
    flapOsc.frequency.exponentialRampToValueAtTime(50, now + flapDelay + 0.08);
    flapGain.gain.setValueAtTime(0.75, now + flapDelay);
    flapGain.gain.exponentialRampToValueAtTime(0.001, now + flapDelay + 0.08);
    flapOsc.connect(flapGain);
    flapGain.connect(ctx.destination);
    flapOsc.start(now + flapDelay);
    flapOsc.stop(now + flapDelay + 0.08);

    this.triggerHaptic([30, 40, 70]);
  }

  triggerHaptic(pattern) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }
}

window.cameraAudio = new CameraAudioEngine();
