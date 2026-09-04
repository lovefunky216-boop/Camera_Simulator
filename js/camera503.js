/**
 * Hasselblad 503CX Film Camera Controller
 * 
 * Flow:
 * 1. Closed Hood 503CX Illustration (Zeiss CF 80mm, Hands, Closed Lid)
 *    -> Click lid to pop open with metallic latch sound
 * 2. Open Hood 503CX Illustration (4 folding flaps, Ground Glass showing Southern Italy on Film)
 *    -> Click shutter button (or SPACE) with heavy mirror slap & mechanical shutter sound
 * 3. Optical Flash & Blackout
 * 4. 120 Square Medium Format Film Photo (Positano) appears with infinite smooth Deep Zoom
 * 5. Single '↺ 뚜껑 닫고 다시 찍기' reset button
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
      lidTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openHood();
      });
    }

    const closedView = document.getElementById("camera-closed-view");
    if (closedView) {
      closedView.addEventListener("click", () => {
        if (!this.isHoodOpen) this.openHood();
      });
    }

    // 2. Shutter Release Button Click (셔터 누르기)
    const shutterTrigger = document.getElementById("shutter-trigger");
    if (shutterTrigger) {
      shutterTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.takeShot();
      });
    }

    const shutterBtnBottom = document.getElementById("shutter-btn-bottom");
    if (shutterBtnBottom) {
      shutterBtnBottom.addEventListener("click", (e) => {
        e.stopPropagation();
        this.takeShot();
      });
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

    // 3. Re-shoot / Reset Button (다시 찍기)
    const resetBtn = document.getElementById("reshoot-camera-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetCamera());
    }
  }

  // 뚜껑 열기 (후드 팝업 & 금속 래치 사운드)
  openHood() {
    if (this.isHoodOpen) return;
    this.isHoodOpen = true;

    // 1. Play authentic metallic hood pop-open sound
    if (window.cameraAudio) {
      window.cameraAudio.playHoodOpen();
    }

    // 2. Transition from closed view to open ground glass view
    const cameraClosed = document.getElementById("camera-closed-view");
    const cameraOpen = document.getElementById("camera-open-view");
    const guideText = document.getElementById("camera-step-guide");

    if (cameraClosed) {
      cameraClosed.classList.add("opacity-0", "pointer-events-none");
    }

    if (cameraOpen) {
      cameraOpen.classList.remove("opacity-0", "pointer-events-none");
    }

    // Update guide text
    if (guideText) {
      guideText.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff6a00] animate-ping inline-block mr-1"></span>
        <span class="text-white font-bold">뷰파인더에 남부 이탈리아 풍경이 비칩니다.</span>
        <span class="text-zinc-400 ml-1">우측 셔터를 눌러 촬영하세요!</span>
      `;
    }
  }

  // 셔터 누르기 (찰-칵! 묵직한 미러 릴리즈 사운드 + 광학 플래시 + 현상 사진 전환)
  takeShot() {
    if (!this.isHoodOpen || this.hasTakenShot) return;
    this.hasTakenShot = true;

    // 1. Play heavy 503CX mirror slap & mechanical leaf shutter
    if (window.cameraAudio) {
      window.cameraAudio.playShutter();
    }

    // 2. Optical Flash & Blackout animation
    const blackout = document.getElementById("screen-blackout");
    if (blackout) {
      blackout.classList.remove("opacity-0");
      blackout.classList.add("opacity-100");
    }

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
      if (blackout) {
        blackout.classList.replace("opacity-100", "opacity-0");
      }
    }, 200);
  }

  // 촬영된 120 중형 필름 딥 줌 뷰어 초기화
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
  }
}

// Global initialization on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.cameraAudio = new CameraAudioEngine();
  window.camera503 = new Camera503Engine();
  window.camera503.init();
});
