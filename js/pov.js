/**
 * Hasselblad Waist-Level POV Shooting Simulation Engine
 * First-person perspective holding the 907X / 500C, looking down into the tilted LCD screen.
 * Interactive aiming, manual focus ring, realistic leaf shutter release, and instant photo review.
 */

class CameraPOVEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.container = null;

    // Viewfinder dimensions
    this.vfWidth = 720;
    this.vfHeight = 540;

    // Camera handling physics & orientation
    this.pitch = 0;       // Up/Down looking angle
    this.yaw = 0;         // Left/Right panning angle
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Breathing / Micro handheld shake
    this.shakeTime = 0;

    // Optical Focus (0.0 to 1.0, 0.7 is sharp focus for current subject)
    this.focusValue = 0.7;
    this.sharpFocusTarget = 0.7;
    this.isPeakingActive = true;

    // Photographic Environment Scenes
    this.currentScene = 'temple'; // 'temple', 'street', 'studio', 'webcam'
    this.webcamStream = null;
    this.webcamVideo = null;
    this.isWebcamActive = false;

    // Scene Image Assets (Procedural canvas fallback + High-res photorealistic environments)
    this.sceneImages = {};

    // Camera Mode & State
    this.cameraModel = '907x'; // '907x' or '500c'
    this.isReviewMode = false;
    this.lastShotDataUrl = null;
    this.lastShotMetadata = null;

    // Exposure parameters
    this.aperture = "f/2.5";
    this.shutter = "1/250s";
    this.iso = "64";
    this.aspect = "4-3"; // 4-3, 1-1, xpan

    // Offscreen Canvas for optical rendering & processing
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.vfWidth;
    this.offscreenCanvas.height = this.vfHeight;
    this.offCtx = this.offscreenCanvas.getContext("2d");
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.canvas = document.getElementById("pov-viewfinder-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.setupEvents();
    this.initScenes();
    this.animate();
  }

  setupEvents() {
    // Mouse drag for camera panning (Looking around the scene)
    this.container.addEventListener("mousedown", (e) => {
      // Don't drag if clicked on button or dial
      if (e.target.closest("button") || e.target.closest("input")) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // Sensitivity
      this.targetYaw -= dx * 0.0035;
      this.targetPitch += dy * 0.0035;

      // Constraints
      this.targetPitch = Math.max(-0.6, Math.min(0.6, this.targetPitch));
      this.targetYaw = Math.max(-1.8, Math.min(1.8, this.targetYaw));
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    // Touch support for mobile devices
    this.container.addEventListener("touchstart", (e) => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener("touchmove", (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;

      this.targetYaw -= dx * 0.004;
      this.targetPitch += dy * 0.004;
      this.targetPitch = Math.max(-0.6, Math.min(0.6, this.targetPitch));
    });

    window.addEventListener("touchend", () => {
      this.isDragging = false;
    });

    // Mouse wheel on viewfinder adjusts Lens Focus Ring!
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.04 : 0.04;
      this.setFocus(this.focusValue + delta);
      if (window.cameraAudio) window.cameraAudio.playFocusTick();
    }, { passive: false });

    // DeviceOrientation for Mobile Gyroscope aiming
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma !== null && e.beta !== null) {
          // Subtle gyro tilt
          this.targetYaw = (e.gamma * Math.PI) / 180 * 0.8;
          this.targetPitch = ((e.beta - 45) * Math.PI) / 180 * 0.6;
        }
      });
    }
  }

  // Set Manual Focus (0.0 to 1.0)
  setFocus(val) {
    this.focusValue = Math.max(0.0, Math.min(1.0, val));
    const focusSlider = document.getElementById("focus-slider");
    const focusValText = document.getElementById("hud-focus-val");
    if (focusSlider) focusSlider.value = Math.round(this.focusValue * 100);
    if (focusValText) {
      const dist = (0.5 + this.focusValue * 4.5).toFixed(1);
      focusValText.innerText = `${dist}m`;
    }
  }

  // Setup High-Res Environmental Scene Backgrounds
  initScenes() {
    // 1. Classical Temple of Columns (Matching user's screenshot)
    this.generateTempleScene();
    // 2. City Sunset Street
    this.generateStreetScene();
    // 3. Fashion Studio
    this.generateStudioScene();
  }

  // Generate realistic ancient marble colonnade scene
  generateTempleScene() {
    const w = 1800;
    const h = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Sky gradient through columns
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#4a6fa5");
    sky.addColorStop(0.5, "#9bb7d4");
    sky.addColorStop(0.8, "#d9c5b2");
    sky.addColorStop(1, "#8c827a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Distant classical temple facade
    ctx.fillStyle = "rgba(220, 210, 195, 0.4)";
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.55);
    ctx.lineTo(w * 0.5, h * 0.42);
    ctx.lineTo(w * 0.65, h * 0.55);
    ctx.fill();

    // Giant Roman/Greek Marble Colonnade Rows (Perspective receding)
    const columnsCount = 8;
    for (let i = 0; i < columnsCount; i++) {
      // Left row columns
      const progress = i / columnsCount;
      const xLeft = w * 0.15 + (progress * w * 0.32);
      const colW = (1 - progress * 0.7) * 90;
      const topY = h * 0.15 + (progress * h * 0.25);
      const botY = h * 0.88 - (progress * h * 0.18);

      // Marble shaft
      const colGrad = ctx.createLinearGradient(xLeft - colW/2, 0, xLeft + colW/2, 0);
      colGrad.addColorStop(0, "#8a7e72");
      colGrad.addColorStop(0.3, "#d6cbbd");
      colGrad.addColorStop(0.7, "#f5eee6");
      colGrad.addColorStop(1, "#5c534a");
      ctx.fillStyle = colGrad;
      ctx.fillRect(xLeft - colW/2, topY, colW, botY - topY);

      // Fluting lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 2;
      for (let f = -colW/2 + 8; f < colW/2; f += 14) {
        ctx.beginPath();
        ctx.moveTo(xLeft + f, topY);
        ctx.lineTo(xLeft + f, botY);
        ctx.stroke();
      }

      // Column Capital (Corinthian / Ionic details)
      ctx.fillStyle = "#e2d7c9";
      ctx.fillRect(xLeft - colW * 0.7, topY - 24, colW * 1.4, 26);
      ctx.fillStyle = "#c9beaF";
      ctx.fillRect(xLeft - colW * 0.6, botY, colW * 1.2, 22);

      // Right row columns
      const xRight = w * 0.85 - (progress * w * 0.32);
      const colGradR = ctx.createLinearGradient(xRight - colW/2, 0, xRight + colW/2, 0);
      colGradR.addColorStop(0, "#5c534a");
      colGradR.addColorStop(0.3, "#d6cbbd");
      colGradR.addColorStop(0.7, "#f5eee6");
      colGradR.addColorStop(1, "#8a7e72");
      ctx.fillStyle = colGradR;
      ctx.fillRect(xRight - colW/2, topY, colW, botY - topY);
    }

    // Top Architrave / Marble Ceiling
    const archGrad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
    archGrad.addColorStop(0, "#2c2621");
    archGrad.addColorStop(1, "#9e9184");
    ctx.fillStyle = archGrad;
    ctx.fillRect(0, 0, w, h * 0.22);

    // Flagstone Marble Floor with sun reflections
    const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    floorGrad.addColorStop(0, "#9c9083");
    floorGrad.addColorStop(1, "#423b33");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Sunlight ray beams
    const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, 600);
    sunGrad.addColorStop(0, "rgba(255, 245, 210, 0.45)");
    sunGrad.addColorStop(0.5, "rgba(255, 220, 160, 0.15)");
    sunGrad.addColorStop(1, "transparent");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    this.sceneImages.temple = canvas;
  }

  // Generate European City Sunset Street scene
  generateStreetScene() {
    const w = 1800;
    const h = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Golden hour sky
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, "#1f2d4d");
    sky.addColorStop(0.4, "#8a4f5d");
    sky.addColorStop(0.75, "#e07a38");
    sky.addColorStop(1, "#fcd074");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.75);

    // City Buildings Silhouettes & Warm Windows
    ctx.fillStyle = "#1e1b24";
    ctx.fillRect(w * 0.05, h * 0.25, 220, h * 0.55);
    ctx.fillRect(w * 0.22, h * 0.18, 260, h * 0.62);
    ctx.fillRect(w * 0.62, h * 0.15, 280, h * 0.65);
    ctx.fillRect(w * 0.82, h * 0.28, 240, h * 0.52);

    // Glowing Cafe lights & lanterns
    ctx.fillStyle = "#ffb03a";
    for (let bx = w * 0.08; bx < w * 0.92; bx += 70) {
      for (let by = h * 0.35; by < h * 0.7; by += 45) {
        if (Math.random() > 0.4) {
          ctx.fillRect(bx, by, 16, 22);
        }
      }
    }

    // Cobblestone street & golden hour asphalt reflection
    const road = ctx.createLinearGradient(0, h * 0.7, 0, h);
    road.addColorStop(0, "#574136");
    road.addColorStop(0.3, "#a6683d");
    road.addColorStop(1, "#1c1613");
    ctx.fillStyle = road;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    this.sceneImages.street = canvas;
  }

  // Generate Minimalist Studio scene
  generateStudioScene() {
    const w = 1800;
    const h = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Studio backdrop gradient
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 50, w * 0.5, h * 0.5, 750);
    bg.addColorStop(0, "#e2e8f0");
    bg.addColorStop(0.4, "#94a3b8");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Studio Softbox highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.45, 320, 420, 0, 0, Math.PI * 2);
    ctx.fill();

    // Elegant Sculptural Portrait Silhouette in Center
    ctx.fillStyle = "#0f172a";
    // Head & shoulders
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.38, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.65, 210, 180, 0, 0, Math.PI);
    ctx.fill();

    this.sceneImages.studio = canvas;
  }

  // Switch Scene Environment
  switchScene(sceneName) {
    if (sceneName === 'webcam') {
      this.enableWebcam();
    } else {
      this.disableWebcam();
      this.currentScene = sceneName;
    }
  }

  // WebCam Live Passthrough (Real-World Shooting!)
  async enableWebcam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("이 브라우저에서는 웹캠/카메라 기능을 지원하지 않습니다.");
        return;
      }
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use rear camera on phones if available!
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      this.webcamVideo = document.createElement("video");
      this.webcamVideo.srcObject = this.webcamStream;
      this.webcamVideo.setAttribute("playsinline", "true");
      this.webcamVideo.play();
      this.isWebcamActive = true;
      this.currentScene = 'webcam';
    } catch (err) {
      console.error("Webcam access error:", err);
      alert("카메라 권한을 얻을 수 없습니다. 기본 씬으로 돌아갑니다.");
      this.currentScene = 'temple';
    }
  }

  disableWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    this.isWebcamActive = false;
  }

  // Switch Camera Body Model ('907x' or '500c')
  setCameraModel(model) {
    this.cameraModel = model;
    const bodyFrame = document.getElementById("pov-camera-body");
    const hoodOverlay = document.getElementById("pov-500c-hood");
    const shutterBtn = document.getElementById("pov-shutter-btn");

    if (bodyFrame) {
      bodyFrame.className = `pov-body-${model} relative flex flex-col items-center justify-end`;
    }
    if (hoodOverlay) {
      hoodOverlay.classList.toggle("hidden", model !== '500c');
    }
    if (shutterBtn) {
      shutterBtn.className = model === '500c' ? "shutter-500c-btn" : "shutter-907x-btn";
    }

    if (window.cameraAudio) window.cameraAudio.playToggleSound();
  }

  // Shutter Release (찰칵!)
  takeShot() {
    if (this.isReviewMode) {
      // Exit review mode back to live
      this.resumeLiveView();
      return;
    }

    // 1. Play leaf shutter sound
    if (window.cameraAudio) {
      window.cameraAudio.playShutter(this.cameraModel);
    }

    // 2. Trigger instant blackout & flash
    const flash = document.getElementById("pov-flash-layer");
    const blackout = document.getElementById("pov-blackout-layer");

    if (flash) {
      flash.classList.remove("opacity-0");
      flash.classList.add("opacity-80");
      setTimeout(() => flash.classList.replace("opacity-80", "opacity-0"), 80);
    }

    if (blackout) {
      blackout.classList.remove("opacity-0");
      blackout.classList.add("opacity-100");
      setTimeout(() => blackout.classList.replace("opacity-100", "opacity-0"), 140);
    }

    // 3. Capture current viewfinder frame as shot
    const capturedCanvas = document.createElement("canvas");
    capturedCanvas.width = this.vfWidth;
    capturedCanvas.height = this.vfHeight;
    const cCtx = capturedCanvas.getContext("2d");
    cCtx.drawImage(this.offscreenCanvas, 0, 0);

    this.lastShotDataUrl = capturedCanvas.toDataURL("image/jpeg", 0.95);
    this.lastShotMetadata = {
      model: this.cameraModel === '500c' ? "HASSELBLAD 500C/M & CFV 100C" : "HASSELBLAD 907X & CFV 100C",
      lens: this.cameraModel === '500c' ? "Planar 2.8/80 C T*" : "XCD 2.5/38V",
      aperture: this.aperture,
      shutter: this.shutter,
      iso: this.iso,
      time: new Date().toLocaleTimeString(),
      megapixels: "100MP 16-BIT RAW"
    };

    // 4. Switch LCD screen into REVIEW (PLAY) mode after shutter click
    setTimeout(() => {
      this.enterReviewMode();
    }, 180);
  }

  enterReviewMode() {
    this.isReviewMode = true;
    const reviewBanner = document.getElementById("pov-review-banner");
    const liveBtn = document.getElementById("pov-return-live-btn");
    const saveCardBtn = document.getElementById("pov-save-card-btn");

    if (reviewBanner) reviewBanner.classList.remove("hidden");
    if (liveBtn) liveBtn.classList.remove("hidden");
    if (saveCardBtn) saveCardBtn.classList.remove("hidden");
  }

  resumeLiveView() {
    this.isReviewMode = false;
    const reviewBanner = document.getElementById("pov-review-banner");
    const liveBtn = document.getElementById("pov-return-live-btn");
    const saveCardBtn = document.getElementById("pov-save-card-btn");

    if (reviewBanner) reviewBanner.classList.add("hidden");
    if (liveBtn) liveBtn.classList.add("hidden");
    if (saveCardBtn) saveCardBtn.classList.add("hidden");

    if (window.cameraAudio) window.cameraAudio.playToggleSound();
  }

  // Export official Hasselblad framed exhibition card
  exportFramedCard() {
    if (!this.lastShotDataUrl || !this.lastShotMetadata) return;

    const cardW = 1200;
    const cardH = 1000;
    const card = document.createElement("canvas");
    card.width = cardW;
    card.height = cardH;
    const ctx = card.getContext("2d");

    // Obsidian Black matte background
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, cardW, cardH);

    // Subtle edge border
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cardW - 2, cardH - 2);

    // Main photo area
    const margin = 50;
    const photoW = cardW - margin * 2;
    const photoH = 750;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, margin, margin, photoW, photoH);

      // Bottom Hasselblad Metadata Bar
      const barY = margin + photoH + 45;

      // Orange "H" logo
      ctx.fillStyle = "#ff6a00";
      ctx.beginPath();
      ctx.arc(margin + 20, barY + 14, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0c0c0e";
      ctx.font = "900 20px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("H", margin + 20, barY + 14);

      // Camera title
      ctx.textAlign = "left";
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "bold 18px -apple-system, sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText(this.lastShotMetadata.model, margin + 48, barY + 10);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "500 12px monospace";
      ctx.fillText(`HNCS 16-BIT COLOR · WAIST-LEVEL VIEWFINDER · GOTHENBURG SWEDEN`, margin + 48, barY + 30);

      // Right: Lens & Exposure parameters
      ctx.textAlign = "right";
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "600 16px monospace";
      ctx.fillText(`${this.lastShotMetadata.lens} · ${this.lastShotMetadata.aperture} · ${this.lastShotMetadata.shutter} · ISO ${this.lastShotMetadata.iso}`, cardW - margin, barY + 10);

      ctx.fillStyle = "#71717a";
      ctx.font = "400 12px sans-serif";
      ctx.fillText(`CAPTURED WITH HASSELBLAD 100MP SIMULATOR`, cardW - margin, barY + 30);

      // Download
      const link = document.createElement("a");
      link.href = card.toDataURL("image/jpeg", 0.95);
      link.download = `Hasselblad_Shot_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = this.lastShotDataUrl;
  }

  // Render optical viewfinder frame (60 FPS Loop)
  renderViewfinder() {
    const w = this.vfWidth;
    const h = this.vfHeight;
    const ctx = this.offCtx;

    // Smooth camera inertia & handheld micro-shake
    this.yaw += (this.targetYaw - this.yaw) * 0.12;
    this.pitch += (this.targetPitch - this.pitch) * 0.12;
    this.shakeTime += 0.04;

    const shakeX = Math.sin(this.shakeTime * 1.8) * 1.5;
    const shakeY = Math.cos(this.shakeTime * 2.3) * 1.2;

    // 1. If in Review Mode, show the captured photograph
    if (this.isReviewMode && this.lastShotDataUrl) {
      if (!this._reviewImg) {
        this._reviewImg = new Image();
        this._reviewImg.src = this.lastShotDataUrl;
      }
      if (this._reviewImg.complete) {
        ctx.drawImage(this._reviewImg, 0, 0, w, h);
      }
      // Draw Review Watermark Badge
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(w - 110, 16, 95, 26);
      ctx.fillStyle = "#ff6a00";
      ctx.font = "bold 11px monospace";
      ctx.fillText("▶ PLAYBACK", w - 102, 33);
      return;
    }

    // 2. Render Live Viewfinder
    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Calculate optical blur based on focus delta (|focus - 0.7|)
    const focusDelta = Math.abs(this.focusValue - this.sharpFocusTarget);
    const blurPx = Math.max(0, focusDelta * 18); // Up to 18px gaussian blur

    // CSS filter blur on offscreen context
    if (blurPx > 0.5) {
      ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
    } else {
      ctx.filter = "none";
    }

    // Draw Environment Scene (or Webcam)
    if (this.isWebcamActive && this.webcamVideo && this.webcamVideo.readyState >= 2) {
      // Draw live video feed
      const vW = this.webcamVideo.videoWidth;
      const vH = this.webcamVideo.videoHeight;
      // Center crop into viewfinder
      ctx.drawImage(this.webcamVideo, 0, 0, vW, vH, 0, 0, w, h);
    } else {
      const bgImg = this.sceneImages[this.currentScene] || this.sceneImages.temple;
      if (bgImg) {
        // Calculate viewport window into panoramic background
        // Map yaw (-1.8 to 1.8) and pitch (-0.6 to 0.6) to source image offsets
        const maxOffsetX = bgImg.width - w;
        const maxOffsetY = bgImg.height - h;

        const normYaw = (this.yaw + 1.8) / 3.6; // 0 to 1
        const normPitch = (this.pitch + 0.6) / 1.2;

        const srcX = Math.max(0, Math.min(maxOffsetX, normYaw * maxOffsetX + shakeX));
        const srcY = Math.max(0, Math.min(maxOffsetY, normPitch * maxOffsetY + shakeY));

        ctx.drawImage(bgImg, srcX, srcY, w, h, 0, 0, w, h);
      }
    }

    ctx.restore();

    // 3. Focus Peaking Overlay (Orange shimmer on high-contrast edges when sharp!)
    if (this.isPeakingActive && focusDelta < 0.08) {
      ctx.strokeStyle = "rgba(255, 106, 0, 0.45)";
      ctx.lineWidth = 1.5;
      // Draw peaking edges around center subject
      const cx = w * 0.5;
      const cy = h * 0.52;
      ctx.strokeRect(cx - 80, cy - 120, 160, 240);

      ctx.fillStyle = "rgba(255, 106, 0, 0.85)";
      ctx.font = "bold 10px monospace";
      ctx.fillText("PEAKING: SHARP", cx - 45, cy + 145);
    }

    // 4. Viewfinder Frame Crosshair & Autofocus Box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    const midX = w * 0.5;
    const midY = h * 0.5;
    // Central AF brackets
    ctx.strokeRect(midX - 35, midY - 35, 70, 70);
    ctx.fillStyle = focusDelta < 0.08 ? "#22c55e" : "#ff6a00";
    ctx.fillRect(midX - 2, midY - 2, 4, 4);

    // 5. Crop Aspect Ratio Masks (1:1 Square or 65:24 XPan)
    if (this.aspect === "1-1" || this.cameraModel === '500c') {
      // 1:1 Square Medium Format
      const sqSize = h;
      const sideW = (w - sqSize) / 2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
      ctx.fillRect(0, 0, sideW, h);
      ctx.fillRect(w - sideW, 0, sideW, h);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.strokeRect(sideW, 0, sqSize, h);
    } else if (this.aspect === "xpan") {
      // 65:24 Ultra-wide Panoramic
      const xpHeight = w * (24 / 65);
      const topH = (h - xpHeight) / 2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
      ctx.fillRect(0, 0, w, topH);
      ctx.fillRect(0, h - topH, w, topH);
      ctx.strokeStyle = "rgba(255, 106, 0, 0.35)";
      ctx.strokeRect(0, topH, w, xpHeight);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Render Viewfinder to Offscreen Canvas
    this.renderViewfinder();

    // 2. Transfer to visible POV canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    // 3. Sync to 3D studio texture if active
    if (window.camera3DEngine) {
      window.camera3DEngine.updateScreenTexture();
    }
  }
}

window.cameraPOV = new CameraPOVEngine();
