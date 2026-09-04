/**
 * Hasselblad Sound Engine
 * Synthesizes:
 * 1. 907X & CFV 100C ultra-quiet high-precision Leaf Shutter
 * 2. Classic 500C/M mechanical auxiliary shutter & mirror flap
 * 3. Metal knurled dial clicks and focus ring mechanical friction
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

  // 1. 907X Modern Leaf Shutter (Silent, crisp magnetic solenoid & blades)
  play907xShutter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Solenoid magnetic trigger
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(160, now + 0.02);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.02);

    // Leaf blade opening noise
    const bladeBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
    const bladeData = bladeBuffer.getChannelData(0);
    for (let i = 0; i < bladeData.length; i++) {
      bladeData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const bladeNoise = ctx.createBufferSource();
    bladeNoise.buffer = bladeBuffer;
    const bladeFilter = ctx.createBiquadFilter();
    bladeFilter.type = 'bandpass';
    bladeFilter.frequency.setValueAtTime(3600, now + 0.005);
    bladeFilter.Q.setValueAtTime(3, now + 0.005);
    const bladeGain = ctx.createGain();
    bladeGain.gain.setValueAtTime(0.3, now + 0.005);
    bladeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    bladeNoise.connect(bladeFilter);
    bladeFilter.connect(bladeGain);
    bladeGain.connect(ctx.destination);
    bladeNoise.start(now + 0.005);
    bladeNoise.stop(now + 0.04);

    // Leaf closure snap & body damping resonance
    const closeDelay = 0.048;
    const oscClose = ctx.createOscillator();
    const gainClose = ctx.createGain();
    oscClose.type = 'sine';
    oscClose.frequency.setValueAtTime(420, now + closeDelay);
    oscClose.frequency.exponentialRampToValueAtTime(50, now + closeDelay + 0.06);
    gainClose.gain.setValueAtTime(0.65, now + closeDelay);
    gainClose.gain.exponentialRampToValueAtTime(0.001, now + closeDelay + 0.06);
    oscClose.connect(gainClose);
    gainClose.connect(ctx.destination);
    oscClose.start(now + closeDelay);
    oscClose.stop(now + closeDelay + 0.06);

    this.triggerHaptic([20, 30, 40]);
  }

  // 2. Classic 500C/M Mechanical Shutter (Mirror-up flap + auxiliary rear blinds + lens leaf)
  play500cShutter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Heavy Mirror flip-up thump
    const mirrorOsc = ctx.createOscillator();
    const mirrorGain = ctx.createGain();
    mirrorOsc.type = 'triangle';
    mirrorOsc.frequency.setValueAtTime(220, now);
    mirrorOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    mirrorGain.gain.setValueAtTime(0.85, now);
    mirrorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    mirrorOsc.connect(mirrorGain);
    mirrorGain.connect(ctx.destination);
    mirrorOsc.start(now);
    mirrorOsc.stop(now + 0.08);

    // Mechanical gear train / spring release whir
    const gearBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate);
    const gearData = gearBuffer.getChannelData(0);
    for (let i = 0; i < gearData.length; i++) {
      gearData[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05);
    }
    const gearNoise = ctx.createBufferSource();
    gearNoise.buffer = gearBuffer;
    const gearFilter = ctx.createBiquadFilter();
    gearFilter.type = 'bandpass';
    gearFilter.frequency.setValueAtTime(1600, now);
    const gearGain = ctx.createGain();
    gearGain.gain.setValueAtTime(0.35, now);
    gearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    gearNoise.connect(gearFilter);
    gearFilter.connect(gearGain);
    gearGain.connect(ctx.destination);
    gearNoise.start(now);
    gearNoise.stop(now + 0.09);

    // Auxiliary shutter slap & lens leaf completion
    const flapDelay = 0.075;
    const flapOsc = ctx.createOscillator();
    const flapGain = ctx.createGain();
    flapOsc.type = 'sine';
    flapOsc.frequency.setValueAtTime(320, now + flapDelay);
    flapOsc.frequency.exponentialRampToValueAtTime(60, now + flapDelay + 0.07);
    flapGain.gain.setValueAtTime(0.7, now + flapDelay);
    flapGain.gain.exponentialRampToValueAtTime(0.001, now + flapDelay + 0.07);
    flapOsc.connect(flapGain);
    flapGain.connect(ctx.destination);
    flapOsc.start(now + flapDelay);
    flapOsc.stop(now + flapDelay + 0.07);

    this.triggerHaptic([40, 50, 80]);
  }

  // Generic shutter trigger routing based on current camera model
  playShutter(cameraModel = '907x') {
    if (cameraModel === '500c') {
      this.play500cShutter();
    } else {
      this.play907xShutter();
    }
  }

  // Dial knurling click
  playDialTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.01);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.01);

    this.triggerHaptic(6);
  }

  // Focus ring smooth friction click
  playFocusTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.015);

    this.triggerHaptic(4);
  }

  // Switch toggle sound
  playToggleSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
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
