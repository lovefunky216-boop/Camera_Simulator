/**
 * Hasselblad Camera Simulator Main Application Controller
 * Coordinates POV Waist-Level Shooting Mode, 3D Camera Body Studio, Audio, and UI.
 */

class CameraApp {
  constructor() {
    this.activeMode = 'pov'; // 'pov' or 'studio3d'
    this.currentModel = '907x'; // '907x' or '500c'
  }

  init() {
    // 1. Initialize POV Viewfinder Engine
    if (window.cameraPOV) {
      window.cameraPOV.init("pov-camera-stage");
    }

    // 2. Initialize 3D Camera Body Engine
    if (window.camera3DEngine && window.cameraPOV) {
      window.camera3DEngine.init("studio-3d-stage", window.cameraPOV.offscreenCanvas);
    }

    // 3. Setup UI Controls
    this.setupModeTabs();
    this.setupModelSelector();
    this.setupSceneSelector();
    this.setupFocusControls();
    this.setupExposureControls();
    this.setupShutterButtons();
    this.setupTiltSlider();
    this.setupKeyboardShortcuts();
    this.setupWishlistModal();
  }

  // Toggle between 1st-Person POV Shooting and 3D Camera Body Studio
  setupModeTabs() {
    const tabPOV = document.getElementById("tab-mode-pov");
    const tab3D = document.getElementById("tab-mode-3d");
    const stagePOV = document.getElementById("pov-camera-stage");
    const stage3D = document.getElementById("studio-3d-stage");
    const studioControls = document.getElementById("studio-3d-controls");

    if (tabPOV && tab3D) {
      tabPOV.onclick = () => {
        this.activeMode = 'pov';
        tabPOV.classList.add("active-tab");
        tab3D.classList.remove("active-tab");
        if (stagePOV) stagePOV.classList.remove("hidden");
        if (stage3D) stage3D.classList.add("hidden");
        if (studioControls) studioControls.classList.add("hidden");
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      };

      tab3D.onclick = () => {
        this.activeMode = 'studio3d';
        tab3D.classList.add("active-tab");
        tabPOV.classList.remove("active-tab");
        if (stagePOV) stagePOV.classList.add("hidden");
        if (stage3D) stage3D.classList.remove("hidden");
        if (studioControls) studioControls.classList.remove("hidden");
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
        if (window.camera3DEngine) window.camera3DEngine.onWindowResize();
      };
    }
  }

  // Switch between 907X & CFV 100C vs 500C/M & CFV 100C
  setupModelSelector() {
    const modelBtns = document.querySelectorAll("[data-model]");
    const modelBadge = document.getElementById("camera-model-badge");

    modelBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        modelBtns.forEach(b => b.classList.remove("active-model"));
        btn.classList.add("active-model");
        const model = btn.getAttribute("data-model");
        this.currentModel = model;

        // Update 3D model
        if (window.camera3DEngine) {
          window.camera3DEngine.switchCameraModel(model);
        }

        // Update POV body visuals
        if (window.cameraPOV) {
          window.cameraPOV.setCameraModel(model);
        }

        // Update HUD Badge
        if (modelBadge) {
          modelBadge.innerText = model === '500c' ? "500C/M & CFV 100C" : "907X & CFV 100C";
        }

        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      });
    });
  }

  // Setup Environmental Scene Selector
  setupSceneSelector() {
    const sceneBtns = document.querySelectorAll("[data-scene]");
    sceneBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sceneBtns.forEach(b => b.classList.remove("active-scene"));
        btn.classList.add("active-scene");
        const sceneName = btn.getAttribute("data-scene");

        if (window.cameraPOV) {
          window.cameraPOV.switchScene(sceneName);
        }
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      });
    });
  }

  // Setup Manual Focus Slider & Ring
  setupFocusControls() {
    const slider = document.getElementById("focus-slider");
    if (slider) {
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value) / 100;
        if (window.cameraPOV) window.cameraPOV.setFocus(val);
        if (window.cameraAudio) window.cameraAudio.playFocusTick();
      });
    }

    // Peaking toggle
    const peakingBtn = document.getElementById("toggle-peaking-btn");
    if (peakingBtn) {
      peakingBtn.onclick = () => {
        if (window.cameraPOV) {
          window.cameraPOV.isPeakingActive = !window.cameraPOV.isPeakingActive;
          peakingBtn.classList.toggle("text-[#ff6a00]", window.cameraPOV.isPeakingActive);
          peakingBtn.classList.toggle("border-[#ff6a00]", window.cameraPOV.isPeakingActive);
        }
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      };
    }
  }

  // Setup Exposure Dials & Aspect Ratio
  setupExposureControls() {
    // Aspect Ratio Buttons (4:3, 1:1, XPan)
    const aspectBtns = document.querySelectorAll("[data-aspect]");
    aspectBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        aspectBtns.forEach(b => b.classList.remove("active-aspect"));
        btn.classList.add("active-aspect");
        const aspect = btn.getAttribute("data-aspect");

        if (window.cameraPOV) {
          window.cameraPOV.aspect = aspect;
        }
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      });
    });
  }

  // Physical & Screen Shutter buttons
  setupShutterButtons() {
    // 1. POV Big Orange Shutter Button
    const povShutterBtn = document.getElementById("pov-shutter-btn");
    if (povShutterBtn) {
      povShutterBtn.onclick = () => {
        if (window.cameraPOV) window.cameraPOV.takeShot();
        if (window.camera3DEngine) window.camera3DEngine.animateShutterPress();
      };
    }

    // 2. Return to live view button
    const liveBtn = document.getElementById("pov-return-live-btn");
    if (liveBtn) {
      liveBtn.onclick = () => {
        if (window.cameraPOV) window.cameraPOV.resumeLiveView();
      };
    }

    // 3. Save official exhibition card button
    const saveCardBtn = document.getElementById("pov-save-card-btn");
    if (saveCardBtn) {
      saveCardBtn.onclick = () => {
        if (window.cameraPOV) window.cameraPOV.exportFramedCard();
      };
    }
  }

  // 3D Studio Tilt Slider (0 to 90 degrees)
  setupTiltSlider() {
    const tiltSlider = document.getElementById("tilt-angle-slider");
    const tiltText = document.getElementById("tilt-angle-text");

    if (tiltSlider) {
      tiltSlider.addEventListener("input", (e) => {
        const deg = parseInt(e.target.value, 10);
        if (tiltText) tiltText.innerText = `${deg}°`;
        if (window.camera3DEngine) window.camera3DEngine.setScreenTilt(deg);
      });
    }

    // Preset Tilt Angle Buttons (0°, 40°, 90°)
    const presetBtns = document.querySelectorAll("[data-preset-tilt]");
    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const deg = parseInt(btn.getAttribute("data-preset-tilt"), 10);
        if (tiltSlider) tiltSlider.value = deg;
        if (tiltText) tiltText.innerText = `${deg}°`;
        if (window.camera3DEngine) {
          window.camera3DEngine.setScreenTilt(deg);
          if (window.cameraAudio) window.cameraAudio.playToggleSound();
        }
      });
    });
  }

  // Keyboard Shortcuts (Space: Shutter release, F: Autofocus, Tab: Switch mode)
  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (window.cameraPOV) window.cameraPOV.takeShot();
        if (window.camera3DEngine) window.camera3DEngine.animateShutterPress();
      } else if (e.code === "KeyF") {
        // Snap to sharp focus
        if (window.cameraPOV) window.cameraPOV.setFocus(0.7);
        if (window.cameraAudio) window.cameraAudio.playDialTick();
      } else if (e.code === "KeyM") {
        // Toggle camera model
        const nextModel = this.currentModel === '907x' ? '500c' : '907x';
        const targetBtn = document.querySelector(`[data-model="${nextModel}"]`);
        if (targetBtn) targetBtn.click();
      }
    });
  }

  // Wishlist / Viral Modal
  setupWishlistModal() {
    const openBtn = document.getElementById("wishlist-open-btn");
    const closeBtn = document.getElementById("wishlist-close-btn");
    const modal = document.getElementById("wishlist-modal");

    if (openBtn && modal) {
      openBtn.onclick = () => {
        modal.classList.remove("hidden");
        if (window.cameraAudio) window.cameraAudio.playToggleSound();
      };
    }
    if (closeBtn && modal) {
      closeBtn.onclick = () => modal.classList.add("hidden");
    }

    // Sound toggle button
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.onclick = () => {
        if (window.cameraAudio) {
          window.cameraAudio.isMuted = !window.cameraAudio.isMuted;
          soundBtn.classList.toggle("text-[#ff6a00]", !window.cameraAudio.isMuted);
          soundBtn.classList.toggle("text-zinc-600", window.cameraAudio.isMuted);
        }
      };
    }
  }
}

window.cameraApp = new CameraApp();

window.addEventListener("DOMContentLoaded", () => {
  window.cameraApp.init();
});
