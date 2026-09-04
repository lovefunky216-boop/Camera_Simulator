/**
 * Hasselblad 100MP YouTube Shorts Exact Flow Engine
 * 
 * Flow Sequence:
 * STEP 1: Scenic Landscape view with Hasselblad 907X camera in front, live preview on tilt screen
 * STEP 2: Press orange Shutter button (찰칵! Leaf shutter sound + Flash & Blackout)
 * STEP 3: Camera drops down, revealing the Full 100MP Masterpiece photograph
 * STEP 4: Cinematic Super-Zoom dive into micro details (30x magnification, rivets, textures)
 * STEP 5: Interactive 1:1 pixel exploration + PIP Mini-map + Next scene selection
 */

class ShortsCinematicEngine {
  constructor() {
    this.currentStep = 1; // 1: Framing, 2: Shutter, 3: Full Photo, 4: Deep Zoom, 5: Free Explore
    this.osdViewer = null;
    this.currentSceneId = 'duomo';
    this.isAutoZooming = false;
    this.autoZoomTimer = null;

    // Available High-Resolution Scenes
    this.scenes = {
      duomo: {
        title: "피렌체 두오모 대성당 광장",
        location: "Firenze, Italy",
        tileSource: "https://openseadragon.github.io/example-images/duomo/duomo.dzi",
        resolution: "13,920 × 10,200",
        megapixels: "142 Megapixels",
        targetZoomPoint: { x: 0.4912, y: 0.088 }, // Lantern cross and copper rivets
        zoomLevel: 14.5,
        detailTitle: "114미터 상공 돔 랜턴의 구리 리벳",
        detailDesc: "수백 미터 밖 꼭대기의 리벳과 금박 질감까지 1:1 픽셀로 선명하게 포착되었습니다."
      },
      highsmith: {
        title: "고대 양식 도서관 대전당",
        location: "Washington, D.C.",
        tileSource: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi",
        resolution: "7,026 × 9,221",
        megapixels: "65 Megapixels",
        targetZoomPoint: { x: 0.505, y: 0.125 }, // Fresco angels and gold leaf
        zoomLevel: 13.0,
        detailTitle: "천장 프레스코화 속 붓 터치와 금박",
        detailDesc: "거대한 돔 천장 벽화의 미세한 캔버스 균열과 24K 금박 디테일이 생생합니다."
      }
    };
  }

  init() {
    this.initOpenSeadragon();
    this.setupEventListeners();
    this.goToStep1();
  }

  initOpenSeadragon() {
    this.osdViewer = OpenSeadragon({
      id: "osd-full-viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: this.scenes[this.currentSceneId].tileSource,
      showNavigationControl: false,
      showNavigator: false,
      animationTime: 2.2,
      springStiffness: 5.5,
      zoomPerScroll: 1.3,
      minZoomImageRatio: 0.85,
      maxZoomPixelRatio: 8.0,
      constrainDuringPan: true,
      visibilityRatio: 0.95
    });

    // Real-time Zoom & Pan updates for PIP and UI
    this.osdViewer.addHandler("zoom", () => this.updatePipAndZoomBadge());
    this.osdViewer.addHandler("pan", () => this.updatePipAndZoomBadge());

    // When image is loaded
    this.osdViewer.addHandler("open", () => {
      this.syncTiltScreenPreview();
    });

    this.osdViewer.addHandler("update-viewport", () => {
      this.syncTiltScreenPreview();
    });
  }

  setupEventListeners() {
    // 1. Orange Shutter Button (찰칵!)
    const shutterBtn = document.getElementById("shorts-shutter-btn");
    if (shutterBtn) {
      shutterBtn.onclick = () => this.triggerShutterSequence();
    }

    // Spacebar shortcut
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        this.triggerShutterSequence();
      }
    });

    // 2. Next Scene / Re-shoot button
    const reshootBtn = document.getElementById("reshoot-btn");
    if (reshootBtn) {
      reshootBtn.onclick = () => this.goToStep1();
    }

    // 3. Scene Selection Tabs
    const sceneBtns = document.querySelectorAll("[data-scene]");
    sceneBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sceneBtns.forEach(b => b.classList.remove("active-scene"));
        btn.classList.add("active-scene");
        const sceneId = btn.getAttribute("data-scene");
        this.switchScene(sceneId);
      });
    });

    // 4. Download Card button
    const downloadBtn = document.getElementById("download-shorts-card-btn");
    if (downloadBtn) {
      downloadBtn.onclick = () => this.exportShortsCard();
    }
  }

  // Switch to another scene
  switchScene(sceneId) {
    if (!this.scenes[sceneId]) return;
    this.currentSceneId = sceneId;
    if (window.cameraAudio) window.cameraAudio.playToggleSound();

    this.osdViewer.open(this.scenes[sceneId].tileSource);
    this.goToStep1();
  }

  // Sync the live view on the camera's 40° tilt LCD screen
  syncTiltScreenPreview() {
    const tiltCanvas = document.getElementById("tilt-lcd-canvas");
    if (!tiltCanvas || !this.osdViewer) return;

    const sourceCanvas = this.osdViewer.drawer?.canvas;
    if (!sourceCanvas) return;

    const ctx = tiltCanvas.getContext("2d");
    ctx.clearRect(0, 0, tiltCanvas.width, tiltCanvas.height);
    // Draw current scene onto the tilt LCD screen
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, tiltCanvas.width, tiltCanvas.height);
  }

  // ============================================================
  // STEP 1: Scenic Landscape view + Camera in front
  // ============================================================
  goToStep1() {
    this.currentStep = 1;
    clearTimeout(this.autoZoomTimer);
    this.isAutoZooming = false;

    // Reset OpenSeadragon to full frame
    if (this.osdViewer && this.osdViewer.viewport) {
      this.osdViewer.viewport.goHome(true);
    }

    // Show step 1 UI (Camera in front, instructions)
    document.getElementById("camera-front-rig").classList.remove("translate-y-full", "opacity-0", "pointer-events-none");
    document.getElementById("shorts-step-banner").innerText = "STEP 1: 전체 풍경을 핫셀블라드 틸트 화면으로 조준 중";
    document.getElementById("shorts-step-sub").innerText = "오렌지 셔터 버튼을 눌러 1억 화소 사진을 찰칵 찍어보세요!";

    // Hide zoom details and PIP
    document.getElementById("zoom-reveal-overlay").classList.add("opacity-0", "pointer-events-none");
    document.getElementById("pip-minimap-container").classList.add("hidden");
    document.getElementById("post-shot-controls").classList.add("hidden");
  }

  // ============================================================
  // STEP 2 & 3: 찰칵! Shutter release -> Full Photo Reveal
  // ============================================================
  triggerShutterSequence() {
    if (this.currentStep !== 1) return;
    this.currentStep = 2;

    // 1. Play leaf shutter sound
    if (window.cameraAudio) {
      window.cameraAudio.play907xShutter();
    }

    // 2. Flash & Blackout animation
    const flash = document.getElementById("shorts-flash");
    const blackout = document.getElementById("shorts-blackout");

    flash.classList.remove("opacity-0");
    flash.classList.add("opacity-80");
    setTimeout(() => flash.classList.replace("opacity-80", "opacity-0"), 80);

    blackout.classList.remove("opacity-0");
    blackout.classList.add("opacity-100");
    setTimeout(() => blackout.classList.replace("opacity-100", "opacity-0"), 150);

    // 3. Camera lowers down smoothly, revealing the Full 100MP Masterpiece Photo!
    setTimeout(() => {
      this.goToStep3FullPhoto();
    }, 200);
  }

  goToStep3FullPhoto() {
    this.currentStep = 3;
    const scene = this.scenes[this.currentSceneId];

    // Lower the camera down
    document.getElementById("camera-front-rig").classList.add("translate-y-full", "opacity-0", "pointer-events-none");

    // Update banner for Step 3
    document.getElementById("shorts-step-banner").innerText = `STEP 2: 찰칵! 1억 화소 전체 원본 사진 촬영 완료 (${scene.resolution})`;
    document.getElementById("shorts-step-sub").innerText = "잠시 후 쇼츠처럼 극소 디테일로 파고드는 줌인이 시작됩니다...";

    // Show post shot controls & PIP
    document.getElementById("post-shot-controls").classList.remove("hidden");
    document.getElementById("pip-minimap-container").classList.remove("hidden");

    // 4. After 1.8 seconds, automatically trigger the dramatic deep zoom (Step 4)!
    this.autoZoomTimer = setTimeout(() => {
      this.goToStep4SuperZoom();
    }, 1800);
  }

  // ============================================================
  // STEP 4: Cinematic Super-Zoom Dive (The Shorts Magic!)
  // ============================================================
  goToStep4SuperZoom() {
    this.currentStep = 4;
    this.isAutoZooming = true;
    const scene = this.scenes[this.currentSceneId];

    // Update Banner
    document.getElementById("shorts-step-banner").innerText = "STEP 3: 🔍 쇼츠 감성 100MP 극한 딥 줌 (극소 디테일 공개!)";
    document.getElementById("shorts-step-sub").innerText = `[${scene.detailTitle}] 수백 미터 밖 극소 영역으로 30배 깊이 줌인 중...`;

    // Smoothly pan & zoom to the exact micro detail point!
    const target = new OpenSeadragon.Point(scene.targetZoomPoint.x, scene.targetZoomPoint.y);
    this.osdViewer.viewport.panTo(target, false);
    this.osdViewer.viewport.zoomTo(scene.zoomLevel, target, false);

    // Show the detail overlay banner
    setTimeout(() => {
      const revealBox = document.getElementById("zoom-reveal-overlay");
      document.getElementById("reveal-title").innerText = scene.detailTitle;
      document.getElementById("reveal-desc").innerText = scene.detailDesc;
      revealBox.classList.remove("opacity-0", "pointer-events-none");

      if (window.cameraAudio) window.cameraAudio.playDialTick();
      this.currentStep = 5; // Ready for free exploration
    }, 2200);
  }

  // Update PIP Mini-map and 1:1 Pixel Crop Badge in real time
  updatePipAndZoomBadge() {
    if (!this.osdViewer || !this.osdViewer.viewport) return;

    // 1. Calculate Real Zoom
    const item = this.osdViewer.world.getItemAt(0);
    if (!item) return;

    const containerWidth = this.osdViewer.viewport.getContainerSize().x;
    const imageWidth = item.getContentSize().x;
    const currentViewportZoom = this.osdViewer.viewport.getZoom(true);
    const realZoomPct = Math.round(((currentViewportZoom * imageWidth) / containerWidth) * 100);

    const zoomText = document.getElementById("hud-zoom-pct");
    if (zoomText) zoomText.innerText = `${realZoomPct}%`;

    // 2. Update PIP Mini-map Red Crop Box
    const bounds = this.osdViewer.viewport.getBounds(true);
    const pipBox = document.getElementById("pip-red-box");
    if (pipBox) {
      const pipW = 180;
      const pipH = 135;
      const left = Math.max(0, Math.min(pipW, bounds.x * pipW));
      const top = Math.max(0, Math.min(pipH, bounds.y * pipH));
      const w = Math.max(8, Math.min(pipW, bounds.width * pipW));
      const h = Math.max(6, Math.min(pipH, bounds.height * pipH));

      pipBox.style.left = `${left}px`;
      pipBox.style.top = `${top}px`;
      pipBox.style.width = `${w}px`;
      pipBox.style.height = `${h}px`;
    }

    // 3. 1:1 Sensor Crop Badge
    const badge = document.getElementById("sensor-crop-badge");
    if (badge) {
      if (realZoomPct >= 90) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  }

  // Export framed gallery card
  exportShortsCard() {
    const canvas = this.osdViewer?.drawer?.canvas;
    if (!canvas) return;

    const card = document.createElement("canvas");
    card.width = 1280;
    card.height = 960;
    const ctx = card.getContext("2d");

    // Dark background
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, card.width, card.height);

    // Photo
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 40, 40, 1200, 800);

    // Bottom Bar
    ctx.fillStyle = "#ff6a00";
    ctx.beginPath();
    ctx.arc(65, 890, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("H", 65, 897);

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("HASSELBLAD 907X & CFV 100C", 95, 888);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "12px monospace";
    ctx.fillText("100MP MEDIUM FORMAT · 16-BIT RAW · HNCS · SWEDEN", 95, 908);

    const link = document.createElement("a");
    link.href = card.toDataURL("image/jpeg", 0.95);
    link.download = `Hasselblad_100MP_Shorts_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.shortsEngine = new ShortsCinematicEngine();

window.addEventListener("DOMContentLoaded", () => {
  window.shortsEngine.init();
});
