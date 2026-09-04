/**
 * Hasselblad 503CX Analog Film Experience Engine
 * 
 * Exact Flow:
 * 1. Closed 503CX body -> Tap hood lid to pop open
 * 2. Ground glass reveals beautiful Southern Italy landscape
 * 3. Press classic shutter button -> Mechanical mirror slap & leaf shutter
 * 4. 6x6 Square Film photo appears with smooth Deep Zoom inspection
 */

class Camera503Engine {
  constructor() {
    this.isHoodOpen = false;
    this.hasTakenShot = false;
    this.viewer = null;

    // High resolution Southern Italy coastal scenery DZI / tileSource
    this.photoSource = "https://openseadragon.github.io/example-images/duomo/duomo.dzi";
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 1. Hood Lid Click (뚜껑 클릭하여 열기)
    const hoodLid = document.getElementById("hood-closed-lid");
    if (hoodLid) {
      hoodLid.addEventListener("click", () => this.openHood());
    }

    // 2. Shutter Button Click (셔터 누르기)
    const shutterBtn = document.getElementById("classic-shutter-btn");
    if (shutterBtn) {
      shutterBtn.addEventListener("click", () => this.takeShot());
    }

    // Spacebar to trigger shutter when hood is open
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

    // 3. Reset Button (다시 뚜껑 닫고 찍기)
    const resetBtn = document.getElementById("reset-camera-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetCamera());
    }
  }

  // 뚜껑 열기 (후드 팝업)
  openHood() {
    if (this.isHoodOpen) return;
    this.isHoodOpen = true;

    // 1. Play mechanical pop open sound
    if (window.cameraAudio) {
      window.cameraAudio.playHoodOpen();
    }

    // 2. Hide closed lid, show open folding hood
    const closedLid = document.getElementById("hood-closed-lid");
    const openHood = document.getElementById("hood-opened-view");
    const stepGuide = document.getElementById("step-guide-text");
    const shutterBtn = document.getElementById("classic-shutter-btn");

    if (closedLid) closedLid.classList.add("hood-popped");
    setTimeout(() => {
      if (closedLid) closedLid.classList.add("hidden");
      if (openHood) openHood.classList.remove("hidden");
    }, 200);

    // Update guide text
    if (stepGuide) {
      stepGuide.innerHTML = `<span class="text-[#ff6a00] font-bold animate-pulse">●</span> 우측 하단 <span class="text-white font-bold">셔터 버튼</span>을 눌러 사진을 찍으세요.`;
    }

    // Highlight shutter button
    if (shutterBtn) {
      shutterBtn.classList.add("ring-4", "ring-[#ff6a00]/50", "animate-pulse");
    }
  }

  // 셔터 누르기 (찰칵-철컥!)
  takeShot() {
    if (!this.isHoodOpen || this.hasTakenShot) return;
    this.hasTakenShot = true;

    // 1. Play heavy 503CX mirror slap and shutter sound
    if (window.cameraAudio) {
      window.cameraAudio.playShutter();
    }

    // 2. Instant Blackout & Flash
    const blackout = document.getElementById("shot-blackout");
    blackout.classList.remove("opacity-0");
    blackout.classList.add("opacity-100");

    // 3. Transition from camera body to 6x6 Film Photo Zoom Viewer
    setTimeout(() => {
      const cameraStage = document.getElementById("camera-body-stage");
      const photoStage = document.getElementById("photo-result-stage");
      const stepGuide = document.getElementById("step-guide-text");

      if (cameraStage) cameraStage.classList.add("hidden");
      if (photoStage) photoStage.classList.remove("hidden");

      if (stepGuide) {
        stepGuide.innerHTML = `<span>📷 120 중형 필름 현상 완료!</span> <span class="text-zinc-400">마우스 휠이나 터치로 세부 디테일을 마음껏 확대해보세요.</span>`;
      }

      // Initialize OpenSeadragon for smooth deep zooming on the captured photo
      this.initPhotoViewer();

      // Fade out blackout
      blackout.classList.replace("opacity-100", "opacity-0");
    }, 180);
  }

  // OpenSeadragon 필름 사진 딥 줌 뷰어 초기화
  initPhotoViewer() {
    if (this.viewer) {
      this.viewer.viewport.goHome(true);
      return;
    }

    this.viewer = OpenSeadragon({
      id: "film-photo-viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: this.photoSource,
      showNavigationControl: false,
      showNavigator: false,
      animationTime: 1.5,
      springStiffness: 6.0,
      zoomPerScroll: 1.3,
      minZoomImageRatio: 0.85,
      maxZoomPixelRatio: 8.0,
      constrainDuringPan: true,
      visibilityRatio: 0.95
    });

    const zoomIndicator = document.getElementById("film-zoom-val");
    this.viewer.addHandler("zoom", (e) => {
      if (zoomIndicator) {
        const z = Math.round(e.zoom * 100);
        zoomIndicator.innerText = `${z}%`;
      }
    });
  }

  // 다시 뚜껑 닫고 처음으로
  resetCamera() {
    this.isHoodOpen = false;
    this.hasTakenShot = false;

    const cameraStage = document.getElementById("camera-body-stage");
    const photoStage = document.getElementById("photo-result-stage");
    const closedLid = document.getElementById("hood-closed-lid");
    const openHood = document.getElementById("hood-opened-view");
    const stepGuide = document.getElementById("step-guide-text");
    const shutterBtn = document.getElementById("classic-shutter-btn");

    if (photoStage) photoStage.classList.add("hidden");
    if (cameraStage) cameraStage.classList.remove("hidden");

    if (closedLid) {
      closedLid.classList.remove("hidden", "hood-popped");
    }
    if (openHood) {
      openHood.classList.add("hidden");
    }

    if (shutterBtn) {
      shutterBtn.classList.remove("ring-4", "ring-[#ff6a00]/50", "animate-pulse");
    }

    if (stepGuide) {
      stepGuide.innerHTML = `<span class="animate-bounce inline-block mr-1">👆</span> 카메라 뚜껑을 탭하여 열어보세요.`;
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
