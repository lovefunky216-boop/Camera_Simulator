/**
 * Hasselblad UI Controller & Interactive Hardware Simulation
 * Dial mechanics, Exposure simulation, HNCS Color Profiles, XPan & Aspect masks, Waist-level tilt
 */

class CameraUI {
  constructor() {
    this.apertures = ["f/2.5", "f/2.8", "f/4.0", "f/5.6", "f/8.0", "f/11", "f/16", "f/22"];
    this.shutters = ["1/4000s", "1/2000s", "1/1000s", "1/500s", "1/250s", "1/125s", "1/60s", "1/30s", "1/15s", "1/8s", "1s"];
    this.isos = ["64", "100", "200", "400", "800", "1600", "3200", "6400", "12800", "25600"];

    this.apertureIdx = 0; // f/2.5
    this.shutterIdx = 4;  // 1/250s
    this.isoIdx = 0;      // 64
    this.evValue = 0.0;   // ±0.0

    this.colorProfile = "hncs-natural";
    this.aspectRatio = "4-3";
    this.tiltAngle = 0;
    this.gridMode = "3x3"; // 3x3, golden, none
    this.isPeakingOn = false;
    this.histogramTimer = null;
  }

  init() {
    this.setupDials();
    this.setupButtons();
    this.setupProfiles();
    this.setupAspectRatios();
    this.setupTiltScreen();
    this.setupHistogram();
    this.setupFileUpload();
    this.updateDisplays();
  }

  setupDials() {
    // Aperture buttons / wheel
    const apDown = document.getElementById("dial-ap-down");
    const apUp = document.getElementById("dial-ap-up");
    if (apDown) apDown.onclick = () => this.stepAperture(-1);
    if (apUp) apUp.onclick = () => this.stepAperture(1);

    // Shutter buttons / wheel
    const shDown = document.getElementById("dial-sh-down");
    const shUp = document.getElementById("dial-sh-up");
    if (shDown) shDown.onclick = () => this.stepShutter(-1);
    if (shUp) shUp.onclick = () => this.stepShutter(1);

    // ISO buttons / wheel
    const isoDown = document.getElementById("dial-iso-down");
    const isoUp = document.getElementById("dial-iso-up");
    if (isoDown) isoDown.onclick = () => this.stepISO(-1);
    if (isoUp) isoUp.onclick = () => this.stepISO(1);

    // EV buttons
    const evDown = document.getElementById("dial-ev-down");
    const evUp = document.getElementById("dial-ev-up");
    if (evDown) evDown.onclick = () => this.stepEV(-0.3);
    if (evUp) evUp.onclick = () => this.stepEV(0.3);
  }

  stepAperture(delta) {
    this.apertureIdx = Math.max(0, Math.min(this.apertures.length - 1, this.apertureIdx + delta));
    if (window.cameraAudio) window.cameraAudio.playDialTick();
    this.updateDisplays();
    this.applyExposureSim();
  }

  stepShutter(delta) {
    this.shutterIdx = Math.max(0, Math.min(this.shutters.length - 1, this.shutterIdx + delta));
    if (window.cameraAudio) window.cameraAudio.playDialTick();
    this.updateDisplays();
    this.applyExposureSim();
  }

  stepISO(delta) {
    this.isoIdx = Math.max(0, Math.min(this.isos.length - 1, this.isoIdx + delta));
    if (window.cameraAudio) window.cameraAudio.playDialTick();
    this.updateDisplays();
    this.applyExposureSim();
  }

  stepEV(delta) {
    this.evValue = Math.round((this.evValue + delta) * 10) / 10;
    if (this.evValue > 3.0) this.evValue = 3.0;
    if (this.evValue < -3.0) this.evValue = -3.0;
    if (window.cameraAudio) window.cameraAudio.playDialTick();
    this.updateDisplays();
    this.applyExposureSim();
  }

  updateDisplays() {
    const apText = this.apertures[this.apertureIdx];
    const shText = this.shutters[this.shutterIdx];
    const isoText = this.isos[this.isoIdx];
    const evText = (this.evValue >= 0 ? "+" : "") + this.evValue.toFixed(1);

    // HUD Bar Elements
    const hudAp = document.getElementById("hud-aperture");
    const hudSh = document.getElementById("hud-shutter");
    const hudIso = document.getElementById("hud-iso");
    const hudEv = document.getElementById("hud-ev");

    if (hudAp) hudAp.innerText = apText;
    if (hudSh) hudSh.innerText = shText;
    if (hudIso) hudIso.innerText = isoText;
    if (hudEv) hudEv.innerText = evText;

    // Top OLED Status Display Elements
    const topAp = document.getElementById("top-lcd-ap");
    const topSh = document.getElementById("top-lcd-sh");
    const topIso = document.getElementById("top-lcd-iso");
    const topEv = document.getElementById("top-lcd-ev");

    if (topAp) topAp.innerText = apText;
    if (topSh) topSh.innerText = shText;
    if (topIso) topIso.innerText = isoText;
    if (topEv) topEv.innerText = evText;
  }

  applyExposureSim() {
    // Calculate brightness variation from base exposure
    // Aperture f/2.5, Shutter 1/250, ISO 64 as base 0.0
    const apDelta = (0 - this.apertureIdx) * 0.15; // smaller aperture = darker
    const shDelta = (this.shutterIdx - 4) * 0.12;  // slower shutter = brighter
    const isoDelta = (this.isoIdx - 0) * 0.15;    // higher ISO = brighter
    const totalExposure = this.evValue + apDelta + shDelta + isoDelta;

    const brightness = Math.max(0.4, Math.min(1.8, 1.0 + (totalExposure * 0.18)));
    const contrast = Math.max(0.8, Math.min(1.3, 1.0 + (totalExposure * 0.05)));

    const viewerEl = document.getElementById("openseadragon-viewer");
    if (viewerEl) {
      viewerEl.style.filter = `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) ${this.getColorFilterCSS()}`;
    }
  }

  getColorFilterCSS() {
    switch (this.colorProfile) {
      case "x-mono":
        return "grayscale(100%) contrast(1.3) brightness(0.95)";
      case "cinematic":
        return "saturate(1.35) contrast(1.18) hue-rotate(-4deg)";
      case "vintage":
        return "sepia(0.35) contrast(1.1) saturate(0.85) brightness(0.98)";
      case "hncs-natural":
      default:
        return "saturate(1.05) contrast(1.03)";
    }
  }

  setupProfiles() {
    const profileBtns = document.querySelectorAll("[data-color-profile]");
    profileBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        profileBtns.forEach(b => b.classList.remove("active-profile"));
        btn.classList.add("active-profile");
        this.colorProfile = btn.getAttribute("data-color-profile");
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
        this.applyExposureSim();
      });
    });
  }

  setupAspectRatios() {
    const aspectBtns = document.querySelectorAll("[data-aspect]");
    const maskContainer = document.getElementById("aspect-mask-container");
    const hudAspect = document.getElementById("hud-aspect-badge");

    aspectBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        aspectBtns.forEach(b => b.classList.remove("active-aspect"));
        btn.classList.add("active-aspect");
        this.aspectRatio = btn.getAttribute("data-aspect");

        if (window.cameraAudio) window.cameraAudio.playToggleSound();

        // Update masks
        if (maskContainer) {
          maskContainer.className = `absolute inset-0 pointer-events-none transition-all duration-300 z-10 aspect-${this.aspectRatio}`;
        }
        if (hudAspect) {
          if (this.aspectRatio === "xpan") hudAspect.innerText = "65:24 XPAN";
          else if (this.aspectRatio === "1-1") hudAspect.innerText = "1:1 SQUARE";
          else hudAspect.innerText = "4:3 MEDIUM";
        }
      });
    });
  }

  setupTiltScreen() {
    const tiltBtns = document.querySelectorAll("[data-tilt]");
    const cameraBody = document.getElementById("camera-viewfinder-frame");

    tiltBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tiltBtns.forEach(b => b.classList.remove("active-tilt"));
        btn.classList.add("active-tilt");
        const angle = parseInt(btn.getAttribute("data-tilt"), 10);
        this.tiltAngle = angle;

        if (window.cameraAudio) window.cameraAudio.playToggleSound();

        if (cameraBody) {
          cameraBody.style.transform = `perspective(1000px) rotateX(${angle}deg)`;
        }
      });
    });
  }

  setupButtons() {
    // Shutter Button
    const shutterBtn = document.getElementById("shutter-btn");
    if (shutterBtn) {
      shutterBtn.onclick = () => {
        if (window.cameraExporter) {
          window.cameraExporter.captureAndExport();
        }
      };
    }

    // Cinematic Tour Button
    const tourBtn = document.getElementById("tour-btn");
    if (tourBtn) {
      tourBtn.onclick = () => {
        if (window.cameraViewer) {
          window.cameraViewer.toggleCinematicTour();
        }
      };
    }

    // Grid Toggle Button
    const gridBtn = document.getElementById("grid-toggle-btn");
    const gridOverlay = document.getElementById("grid-overlay");
    if (gridBtn && gridOverlay) {
      gridBtn.onclick = () => {
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
        if (this.gridMode === "3x3") {
          this.gridMode = "golden";
          gridOverlay.className = "absolute inset-0 pointer-events-none z-10 grid-golden";
          gridBtn.innerText = "GOLDEN";
          gridBtn.className = "px-2 py-0.5 rounded text-[10px] border border-[#ff6a00] text-[#ff6a00]";
        } else if (this.gridMode === "golden") {
          this.gridMode = "none";
          gridOverlay.className = "hidden";
          gridBtn.innerText = "OFF";
          gridBtn.className = "px-2 py-0.5 rounded text-[10px] border border-zinc-700 text-zinc-500";
        } else {
          this.gridMode = "3x3";
          gridOverlay.className = "absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/10";
          gridBtn.innerText = "3×3";
          gridBtn.className = "px-2 py-0.5 rounded text-[10px] border border-[#ff6a00] text-[#ff6a00]";
        }
      };
    }

    // Focus Peaking Toggle
    const peakingBtn = document.getElementById("peaking-btn");
    const peakingOverlay = document.getElementById("peaking-overlay");
    if (peakingBtn) {
      peakingBtn.onclick = () => {
        this.isPeakingOn = !this.isPeakingOn;
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
        peakingBtn.classList.toggle("text-[#ff6a00]", this.isPeakingOn);
        peakingBtn.classList.toggle("border-[#ff6a00]", this.isPeakingOn);
        if (peakingOverlay) {
          peakingOverlay.classList.toggle("hidden", !this.isPeakingOn);
        }
      };
    }

    // Reset View Button
    const resetBtn = document.getElementById("reset-view-btn");
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (window.cameraViewer) window.cameraViewer.resetView();
      };
    }

    // Scene Buttons
    const sceneBtns = document.querySelectorAll("[data-scene]");
    sceneBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sceneBtns.forEach(b => b.classList.remove("active-scene"));
        btn.classList.add("active-scene");
        const sceneId = btn.getAttribute("data-scene");
        if (window.cameraViewer) window.cameraViewer.loadScene(sceneId);
      });
    });

    // Modal close buttons
    const exportClose = document.getElementById("close-export-btn");
    if (exportClose) exportClose.onclick = () => window.cameraExporter?.closeModal();

    // Wishlist Modal
    const wishlistBtn = document.getElementById("wishlist-btn");
    const wishlistModal = document.getElementById("wishlist-modal");
    const closeWishlistBtn = document.getElementById("close-wishlist-btn");

    if (wishlistBtn && wishlistModal) {
      wishlistBtn.onclick = () => {
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
        wishlistModal.classList.remove("hidden");
      };
    }
    if (closeWishlistBtn && wishlistModal) {
      closeWishlistBtn.onclick = () => wishlistModal.classList.add("hidden");
    }

    // Sound Mute Toggle
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.onclick = () => {
        if (window.cameraAudio) {
          window.cameraAudio.isMuted = !window.cameraAudio.isMuted;
          soundBtn.classList.toggle("text-zinc-600", window.cameraAudio.isMuted);
          soundBtn.classList.toggle("text-[#ff6a00]", !window.cameraAudio.isMuted);
        }
      };
    }

    // Keyboard Shortcuts (Space: Shutter, T: Tour, R: Reset, G: Grid)
    window.addEventListener("keydown", (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (window.cameraExporter) window.cameraExporter.captureAndExport();
      } else if (e.code === "KeyT") {
        if (window.cameraViewer) window.cameraViewer.toggleCinematicTour();
      } else if (e.code === "KeyR") {
        if (window.cameraViewer) window.cameraViewer.resetView();
      } else if (e.code === "KeyG") {
        if (gridBtn) gridBtn.click();
      }
    });
  }

  setupFileUpload() {
    const fileInput = document.getElementById("custom-file-input");
    const dropZone = document.getElementById("upload-drop-zone");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && window.cameraViewer) {
          window.cameraViewer.loadCustomImage(file);
        }
      });
    }

    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("border-[#ff6a00]", "bg-[#ff6a00]/10");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("border-[#ff6a00]", "bg-[#ff6a00]/10");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-[#ff6a00]", "bg-[#ff6a00]/10");
        const file = e.dataTransfer.files[0];
        if (file && window.cameraViewer) {
          window.cameraViewer.loadCustomImage(file);
        }
      });
    }
  }

  // Realtime Live Histogram Simulator
  setupHistogram() {
    const canvas = document.getElementById("histogram-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderHistogram = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle dark grid
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, 0); ctx.lineTo(w * 0.25, h);
      ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h);
      ctx.moveTo(w * 0.75, 0); ctx.lineTo(w * 0.75, h);
      ctx.stroke();

      // Dynamic curve based on exposure EV & ISO
      const shift = (this.evValue * 8);
      const points = 32;

      ctx.fillStyle = "rgba(255, 106, 0, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let i = 0; i <= points; i++) {
        const x = (i / points) * w;
        const norm = (i - 16 + shift) / 7;
        const bell = Math.exp(-0.5 * norm * norm);
        const noise = (Math.sin(i * 1.5 + Date.now() * 0.002) * 0.1);
        const y = h - Math.max(4, (bell + noise) * (h * 0.85));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // White envelope line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * w;
        const norm = (i - 16 + shift) / 7;
        const bell = Math.exp(-0.5 * norm * norm);
        const noise = (Math.sin(i * 1.5 + Date.now() * 0.002) * 0.1);
        const y = h - Math.max(4, (bell + noise) * (h * 0.85));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(renderHistogram);
    };

    requestAnimationFrame(renderHistogram);
  }
}

window.cameraUI = new CameraUI();
