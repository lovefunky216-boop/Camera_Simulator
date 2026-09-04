/**
 * Hasselblad 100MP Official Sample Simulator Controller
 * 
 * Flow:
 * 1. Location Selector (Official 100MP Hasselblad Master Photos)
 * 2. Closed 503CX Illustration -> Tap to open with mechanical latch click
 * 3. Open Hood 503CX -> Upright (정방향) Ground Glass focusing screen with acute-matte grid
 * 4. Shutter Trigger (or SPACE) -> Heavy mirror slap + flash -> 100MP Deep Zoom
 * 5. OpenSeadragon Infinite Deep Zoom exploring 100-megapixel raw detail
 */

const HASSELBLAD_SCENES = {
  iceland: {
    id: "iceland",
    name: "아이슬란드 빙하 강",
    photographer: "Hans Strand (Hasselblad Master)",
    camera: "Hasselblad X2D 100C",
    lens: "XCD 2,5/38V",
    resolution: "11,131 × 8,348",
    megapixels: "92.9 MP",
    preview: "assets/scenes/iceland.jpg",
    fullUrl: "https://cdn.hasselblad.com/f/77891/11131x8348/32a7905911/hans-strand-x2d-xcd38v-2.jpg"
  },
  dolomites: {
    id: "dolomites",
    name: "돌로미티 알프스 봉우리",
    photographer: "Martin Rak",
    camera: "Hasselblad X2D 100C",
    lens: "XCD 3,2-4,5/20-35E",
    resolution: "8,742 × 11,656",
    megapixels: "101.9 MP",
    preview: "assets/scenes/dolomites.jpg",
    fullUrl: "https://cdn.hasselblad.com/f/77891/8742x11656/42c8bd0fa5/martin-rak-x2d-xcd20-35e-2.jpg"
  },
  greenland: {
    id: "greenland",
    name: "그린란드 극지 마을",
    photographer: "Weimin Chu (NatGeo Travel Winner)",
    camera: "Hasselblad X2D 100C",
    lens: "XCD 3,2-4,5/20-35E",
    resolution: "11,656 × 8,742",
    megapixels: "101.9 MP",
    preview: "assets/scenes/greenland.jpg",
    fullUrl: "https://cdn.hasselblad.com/f/77891/11656x8742/5f56d30d2a/weimin-chu-x2d-xcd20-35e-2.jpg"
  },
  norway: {
    id: "norway",
    name: "노르웨이 서해안 피오르",
    photographer: "Mads Selvig",
    camera: "Hasselblad X2D 100C",
    lens: "XCD 4/28P",
    resolution: "11,656 × 8,742",
    megapixels: "101.9 MP",
    preview: "assets/scenes/norway.jpg",
    fullUrl: "https://cdn.hasselblad.com/f/77891/11656x8742/24b10794e5/mads-selvig-x2d-xcd-28p-2-full-size.jpg"
  },
  tuscany: {
    id: "tuscany",
    name: "토스카나 안개 평원",
    photographer: "Albrecht Voss",
    camera: "Hasselblad X2D 100C",
    lens: "XCD 3,2-4,5/20-35E",
    resolution: "11,656 × 8,742",
    megapixels: "101.9 MP",
    preview: "assets/scenes/tuscany.jpg",
    fullUrl: "https://cdn.hasselblad.com/f/77891/11656x8742/bb8fac6fcb/albrecht-voss-x2d-xcd20-35e-1.jpg"
  }
};

class Camera100MPEngine {
  constructor() {
    this.currentSceneId = "iceland";
    this.isHoodOpen = false;
    this.hasTakenShot = false;
    this.viewer = null;
  }

  get currentScene() {
    return HASSELBLAD_SCENES[this.currentSceneId] || HASSELBLAD_SCENES.iceland;
  }

  init() {
    this.setupEventListeners();
    this.updateSceneView();
  }

  setupEventListeners() {
    // 1. Location / Scene Select Change
    const locationSelect = document.getElementById("location-select");
    if (locationSelect) {
      locationSelect.addEventListener("change", (e) => {
        this.currentSceneId = e.target.value;
        this.updateSceneView();
      });
    }

    // 2. Hood Lid Click (뚜껑 클릭)
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

    // 3. Shutter Release Button Click (셔터 누르기)
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

    // Spacebar shortcut
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

    // 4. Re-shoot / Reset Button (다시 찍기)
    const resetBtn = document.getElementById("reshoot-camera-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetCamera());
    }
  }

  // 장소 변경 시 뷰파인더 이미지 및 가이드 갱신
  updateSceneView() {
    const groundGlassImg = document.getElementById("ground-glass-img");
    if (groundGlassImg) {
      // Use local preview, or fallback to full url
      groundGlassImg.src = this.currentScene.preview;
      groundGlassImg.onerror = () => {
        groundGlassImg.src = this.currentScene.fullUrl;
      };
    }

    const guideText = document.getElementById("camera-step-guide");
    if (guideText && this.isHoodOpen && !this.hasTakenShot) {
      guideText.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff6a00] animate-ping inline-block mr-1"></span>
        <span class="text-white font-bold">${this.currentScene.name} 풍경이 비칩니다.</span>
        <span class="text-zinc-400 ml-1">셔터를 눌러 1억 화소로 촬영하세요!</span>
      `;
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
        <span class="text-white font-bold">뷰파인더에 ${this.currentScene.name} 풍경이 정방향으로 비칩니다.</span>
        <span class="text-zinc-400 ml-1">우측 셔터를 눌러 1억 화소로 촬영하세요!</span>
      `;
    }
  }

  // 셔터 누르기 (찰-칵! 묵직한 미러 릴리즈 사운드 + 광학 플래시 + 1억 화소 현상)
  takeShot() {
    if (!this.isHoodOpen || this.hasTakenShot) return;
    this.hasTakenShot = true;

    // 1. Play heavy 503CX mirror slap & mechanical shutter
    if (window.cameraAudio) {
      window.cameraAudio.playShutter();
    }

    // 2. Optical Flash & Blackout animation
    const blackout = document.getElementById("screen-blackout");
    if (blackout) {
      blackout.classList.remove("opacity-0");
      blackout.classList.add("opacity-100");
    }

    // 3. Switch to 100MP Deep Zoom Viewer
    setTimeout(() => {
      const cameraStage = document.getElementById("camera-pov-stage");
      const photoStage = document.getElementById("photo-result-stage");
      const guideText = document.getElementById("camera-step-guide");

      if (cameraStage) cameraStage.classList.add("hidden");
      if (photoStage) photoStage.classList.remove("hidden");

      // Update photo metadata in result stage
      const cameraInfo = document.getElementById("photo-camera-info");
      const resInfo = document.getElementById("photo-resolution-info");
      const authorInfo = document.getElementById("photo-author-info");

      if (cameraInfo) cameraInfo.innerText = `${this.currentScene.camera} · ${this.currentScene.lens}`;
      if (resInfo) resInfo.innerText = `${this.currentScene.resolution} (${this.currentScene.megapixels})`;
      if (authorInfo) authorInfo.innerText = this.currentScene.photographer;

      if (guideText) {
        guideText.innerHTML = `
          <span>✨ <strong class="text-white">${this.currentScene.name} 1억 화소 촬영 완료!</strong></span>
          <span class="text-zinc-400 ml-2">마우스 휠이나 터치로 원본 디테일을 무한 확대해보세요.</span>
        `;
      }

      this.init100MPZoomViewer();

      // Fade out blackout
      if (blackout) {
        blackout.classList.replace("opacity-100", "opacity-0");
      }
    }, 200);
  }

  // 1억 화소 OpenSeadragon 딥 줌 뷰어 초기화
  init100MPZoomViewer() {
    const scene = this.currentScene;

    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }

    // Initialize with official Hasselblad high-res image
    this.viewer = OpenSeadragon({
      id: "film-zoom-viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: {
        type: 'image',
        url: scene.fullUrl,
        crossOriginPolicy: false
      },
      showNavigationControl: false,
      showNavigator: false,
      animationTime: 1.2,
      springStiffness: 7.0,
      zoomPerScroll: 1.3,
      minZoomImageRatio: 0.9,
      maxZoomPixelRatio: 8.0,
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

    // Fallback handler if external CDN image takes time
    this.viewer.addHandler("open-failed", () => {
      console.warn("OpenSeadragon full URL open failed, falling back to local preview");
      if (this.viewer) {
        this.viewer.open({
          type: 'image',
          url: scene.preview,
          crossOriginPolicy: false
        });
      }
    });
  }

  // 다시 뚜껑 닫고 초기화 (Reset)
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

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  window.cameraAudio = new CameraAudioEngine();
  window.camera100MP = new Camera100MPEngine();
  window.camera100MP.init();
});
