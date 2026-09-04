/**
 * Hasselblad 503CX Authentic Film Experience Controller
 * Photorealistic Top-Down POV:
 * 1. Closed Hood Lid -> Click to pop open
 * 2. Open Hood with Ground Glass showing Southern Italy on Film
 * 3. Shutter click with heavy mechanical mirror slap
 * 4. Full 120 Film Square photograph with ultra-smooth deep zoom
 */

class Camera503Engine {
  constructor() {
    this.isHoodOpen = false;
    this.hasTakenShot = false;
    this.viewer = null;
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 1. Hood Lid Click (뚜껑 클릭)
    const lidTrigger = document.getElementById("hood-lid-trigger");
    if (lidTrigger) {
      lidTrigger.addEventListener("click", () => this.openHood());
    }

    // 2. Shutter Release Button (셔터 누르기)
    const shutterTrigger = document.getElementById("shutter-trigger");
    if (shutterTrigger) {
      shutterTrigger.addEventListener("click", () => this.takeShot());
    }

    // Spacebar keyboard shortcut
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!this.isHoodOpen) {
          this.openHood();
        } else if (!this.hasTakenShot) {
          this.takeShot();
        }
      }
    });

    // 3. Re-shoot Reset Button (다시 뚜껑 닫고 찍기)
    const resetBtn = document.getElementById("reshoot-camera-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetCamera());
    }
  }

  // 뚜껑 열기 (후드 팝업)
  openHood() {
    if (this.isHoodOpen) return;
    this.isHoodOpen = true;

    // 1. Play authentic metallic hood pop sound
    if (window.cameraAudio) {
      window.cameraAudio.playHoodOpen();
    }

    // 2. Transition from closed camera to open hood camera
    const cameraClosed = document.getElementById("camera-closed-view");
    const cameraOpen = document.getElementById("camera-open-view");
    const guideText = document.getElementById("camera-step-guide");

    if (cameraClosed) {
      cameraClosed.classList.add("opacity-0", "pointer-events-none");
    }
    if (cameraOpen) {
      cameraOpen.classList.remove("opacity-0", "pointer-events-none");
    }

    // Update guide
    if (guideText) {
      guideText.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff6a00] animate-ping inline-block mr-1"></span>
        <span class="text-white font-bold">뷰파인더에 남부 이탈리아 풍경이 비칩니다.</span>
        <span class="text-zinc-400 ml-1">우측 하단 셔터를 눌러 촬영하세요!</span>
      `;
    }
  }

  // 셔터 누르기 (찰-칵! 철컥!)
  takeShot() {
    if (!this.isHoodOpen || this.hasTakenShot) return;
    this.hasTakenShot = true;

    // 1. Play heavy 503CX mirror slap & leaf shutter
    if (window.cameraAudio) {
      window.cameraAudio.playShutter();
    }

    // 2. Instant optical flash & blackout
    const blackout = document.getElementById("screen-blackout");
    blackout.classList.remove("opacity-0");
    blackout.classList.add("opacity-100");

    // 3. Switch to 120 Film Square Photo Zoom Viewer
    setTimeout(() => {
      const cameraStage = document.getElementById("camera-pov-stage");
      const photoStage = document.getElementById("photo-result-stage");
      const guideText = document.getElementById("camera-step-guide");

      if (cameraStage) cameraStage.classList.add("hidden");
      if (photoStage) photoStage.classList.remove("hidden");

      if (guideText) {
        guideText.innerHTML = `
          <span>🎞️ <strong class="text-white">120 중형 필름 현상 완료!</strong></span>
          <span class="text-zinc-400 ml-2">마우스 휠이나 터치로 세부 디테일을 마음껏 확대해보세요.</span>
        `;
      }

      this.initFilmZoomViewer();

      // Fade out blackout
      blackout.classList.replace("opacity-100", "opacity-0");
    }, 200);
  }

  // Initialize smooth deep zoom on the captured 120 film photo
  initFilmZoomViewer() {
    if (this.viewer) {
      this.viewer.viewport.goHome(true);
      return;
    }

    this.viewer = OpenSeadragon({
      id: "film-zoom-viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: {
        type: 'image',
        url: 'assets/southern_italy.jpg'
      },
      showNavigationControl: false,
      showNavigator: false,
      animationTime: 1.2,
      springStiffness: 7.0,
      zoomPerScroll: 1.3,
      minZoomImageRatio: 0.9,
      maxZoomPixelRatio: 6.0,
      constrainDuringPan: true,
      visibilityRatio: 0.95
    });

    const zoomText = document.getElementById("current-zoom-pct");
    this.viewer.addHandler("zoom", (e) => {
      if (zoomText) {
        const pct = Math.round(e.zoom * 100);
        zoomText.innerText = `${pct}%`;
      }
    });
  }

  // 다시 뚜껑 닫고 처음으로 (Reset)
  resetCamera() {
    this.isHoodOpen = false;
    this.hasTakenShot = false;

    const cameraStage = document.getElementById("camera-pov-stage");
    const photoStage = document.getElementById("photo-result-stage");
    const cameraClosed = document.getElementById("camera-closed-view");
    const cameraOpen = document.getElementById("camera-open-view");
    const guideText = document.getElementById("camera-step-guide");

    if (photoStage) photoStage.classList.add("hidden");
    if (cameraStage) cameraStage.classList.remove("hidden");

    if (cameraClosed) {
      cameraClosed.classList.remove("opacity-0", "pointer-events-none");
    }
    if (cameraOpen) {
      cameraOpen.classList.add("opacity-0", "pointer-events-none");
    }

    if (guideText) {
      guideText.innerHTML = `
        <span class="animate-bounce inline-block mr-1">👆</span>
        <span class="text-white font-bold">카메라 뚜껑을 탭하여 열어보세요.</span>
      `;
    }

    if (window.cameraAudio) {
      window.cameraAudio.playHoodOpen();
    }
  }
}

window.camera503 = new Camera503Engine();

window.addEventListener("DOMContentLoaded", () => {
  window.camera503.init();
});
