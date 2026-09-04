/**
 * Hasselblad 100MP Viewport & Deep-Zoom Engine
 * Manages OpenSeadragon, Scene presets, and Cinematic Super-Zoom Tour
 */

class CameraViewer {
  constructor() {
    this.viewer = null;
    this.currentSceneId = 'duomo';
    this.isTourRunning = false;
    this.tourStepTimeout = null;
    this.tourCurrentIndex = 0;

    this.scenes = {
      duomo: {
        title: "Florence Duomo Piazza",
        location: "Firenze, Italy",
        resolution: "13,920 × 10,200",
        megapixels: "142 Megapixels",
        sensor: "53.4 × 40.0mm 100MP Medium Format CMOS",
        tileSource: "https://openseadragon.github.io/example-images/duomo/duomo.dzi",
        tourPoints: [
          {
            title: "Full 142MP Medium Format Frame",
            desc: "The magnificent Santa Maria del Fiore Cathedral in full glory.",
            bounds: { x: 0, y: 0, width: 1, height: 0.732 },
            zoomLevel: 1.0,
            duration: 3500
          },
          {
            title: "100MP Detail: Gilded Cross on the Dome Lantern",
            desc: "Zooming into the copper lantern ball 114 meters above ground. Razor-sharp rivets and gilded plates.",
            point: { x: 0.4912, y: 0.088 },
            zoomLevel: 12.0,
            duration: 4500
          },
          {
            title: "100MP Detail: Marble Relief & Statues",
            desc: "Every chisel mark of the 14th century Gothic marble carvings preserved in 16-bit gradation.",
            point: { x: 0.4935, y: 0.385 },
            zoomLevel: 9.5,
            duration: 4500
          },
          {
            title: "100MP Detail: Piazza Pedestrians & Bicycles",
            desc: "Crowd in the piazza hundreds of meters away—expressions and bicycle spokes distinctly resolved.",
            point: { x: 0.428, y: 0.71 },
            zoomLevel: 11.0,
            duration: 4500
          },
          {
            title: "100% 1:1 Pixel Crop: Rose Window Geometric Mosaics",
            desc: "Zero chromatic aberration. True optical leaf shutter clarity at f/2.5.",
            point: { x: 0.505, y: 0.315 },
            zoomLevel: 16.0,
            duration: 5000
          }
        ]
      },
      highsmith: {
        title: "Library of Congress Grand Hall",
        location: "Washington, D.C.",
        resolution: "7,026 × 9,221",
        megapixels: "65 Megapixels",
        sensor: "53.4 × 40.0mm 100MP Medium Format CMOS",
        tileSource: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi",
        tourPoints: [
          {
            title: "Full Classical Architectural Hall",
            desc: "Gilded arches, marble staircases and frescoed ceilings.",
            bounds: { x: 0, y: 0, width: 1, height: 1.31 },
            zoomLevel: 1.0,
            duration: 3500
          },
          {
            title: "100MP Detail: Ceiling Fresco Allegory",
            desc: "Individual brushstrokes, canvas cracks and 24K gold leaf highlights.",
            point: { x: 0.505, y: 0.125 },
            zoomLevel: 12.0,
            duration: 4500
          },
          {
            title: "100MP Detail: Corinthian Capital Sculptures",
            desc: "Exquisite stone foliage and allegorical figures carved into Italian marble.",
            point: { x: 0.315, y: 0.465 },
            zoomLevel: 9.0,
            duration: 4500
          },
          {
            title: "100% 1:1 Pixel Crop: Commemorative Inscription",
            desc: "Every embossed serif letter clearly legible from across the grand hall.",
            point: { x: 0.50, y: 0.342 },
            zoomLevel: 14.0,
            duration: 5000
          }
        ]
      }
    };
  }

  init() {
    this.viewer = OpenSeadragon({
      id: "openseadragon-viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: this.scenes.duomo.tileSource,
      showNavigationControl: false,
      showNavigator: false,
      animationTime: 1.5,
      springStiffness: 6.5,
      zoomPerScroll: 1.28,
      minZoomImageRatio: 0.85,
      maxZoomPixelRatio: 6.0,
      constrainDuringPan: true,
      visibilityRatio: 0.9,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true
      },
      gestureSettingsTouch: {
        pinchToZoom: true
      }
    });

    this.setupEvents();
  }

  setupEvents() {
    const zoomText = document.getElementById("zoom-text");
    const hudRes = document.getElementById("hud-resolution");
    const topLcdZoom = document.getElementById("top-lcd-zoom");

    // Realtime Zoom level updating
    this.viewer.addHandler("zoom", (e) => {
      const currentZoom = this.calculateRealPixelZoom();
      const zoomStr = `${Math.round(currentZoom)}%`;
      if (zoomText) zoomText.innerText = zoomStr;
      if (topLcdZoom) topLcdZoom.innerText = zoomStr;

      // Update 1:1 Indicator badge
      const badge1to1 = document.getElementById("pixel-crop-badge");
      if (badge1to1) {
        if (currentZoom >= 95 && currentZoom <= 130) {
          badge1to1.classList.remove("opacity-0", "pointer-events-none");
          badge1to1.classList.add("opacity-100");
        } else {
          badge1to1.classList.add("opacity-0", "pointer-events-none");
          badge1to1.classList.remove("opacity-100");
        }
      }
    });

    // When new image is opened
    this.viewer.addHandler("open", () => {
      const item = this.viewer.world.getItemAt(0);
      if (item && hudRes) {
        const size = item.getContentSize();
        hudRes.innerText = `${size.x.toLocaleString()} × ${size.y.toLocaleString()}`;
      }
      this.updateHudSceneInfo();
    });

    // Tap/Click autofocus crosshair animation
    this.viewer.addHandler("canvas-click", (e) => {
      if (!e.quick) return;
      const webPoint = e.position;
      this.showAutofocusReticle(webPoint.x, webPoint.y);
      if (window.cameraAudio) {
        window.cameraAudio.playDialTick();
      }
    });
  }

  // Calculate actual pixel magnification ratio relative to 1:1 image sensor resolution
  calculateRealPixelZoom() {
    if (!this.viewer || !this.viewer.viewport) return 100;
    const item = this.viewer.world.getItemAt(0);
    if (!item) return Math.round(this.viewer.viewport.getZoom() * 100);

    const containerWidth = this.viewer.viewport.getContainerSize().x;
    const imageWidth = item.getContentSize().x;
    const currentViewportZoom = this.viewer.viewport.getZoom(true);
    
    // 1:1 ratio is when 1 image pixel equals 1 screen pixel
    const pixelRatio = (currentViewportZoom * imageWidth) / containerWidth;
    return pixelRatio * 100;
  }

  // Visual Autofocus Box effect on click
  showAutofocusReticle(x, y) {
    const box = document.getElementById("af-reticle");
    if (!box) return;

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.classList.remove("opacity-0", "scale-125");
    box.classList.add("opacity-100", "scale-100", "active");

    clearTimeout(this._reticleTimeout);
    this._reticleTimeout = setTimeout(() => {
      box.classList.remove("opacity-100", "scale-100", "active");
      box.classList.add("opacity-0", "scale-125");
    }, 600);
  }

  // Switch between scenes
  loadScene(sceneId) {
    if (this.isTourRunning) {
      this.stopCinematicTour();
    }
    const scene = this.scenes[sceneId];
    if (!scene) return;
    this.currentSceneId = sceneId;

    if (window.cameraAudio) window.cameraAudio.playToggleSound();

    this.viewer.open(scene.tileSource);
  }

  // Update HUD elements with current scene details
  updateHudSceneInfo() {
    const scene = this.scenes[this.currentSceneId];
    if (!scene) return;

    const titleEl = document.getElementById("scene-title-badge");
    const mpEl = document.getElementById("sensor-mp-badge");
    if (titleEl) titleEl.innerText = scene.title;
    if (mpEl) mpEl.innerText = scene.megapixels;
  }

  // Load user's custom high-res photo
  loadCustomImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        this.scenes.custom = {
          title: file.name.replace(/\.[^/.]+$/, ""),
          location: "User Photo",
          resolution: `${img.width.toLocaleString()} × ${img.height.toLocaleString()}`,
          megapixels: `${Math.round((img.width * img.height) / 1000000)} MP RAW`,
          sensor: "Custom Image Stream",
          tileSource: {
            type: 'image',
            url: imgDataUrl
          },
          tourPoints: [
            {
              title: "100% Full Resolution Fit",
              desc: "Viewing custom user photograph.",
              zoomLevel: 1.0,
              point: { x: 0.5, y: 0.5 },
              duration: 3500
            },
            {
              title: "100MP Center Micro Detail",
              desc: "Deep zooming into the sharpest focal plane.",
              zoomLevel: 4.5,
              point: { x: 0.5, y: 0.5 },
              duration: 4500
            }
          ]
        };
        this.currentSceneId = 'custom';
        this.viewer.open(this.scenes.custom.tileSource);
      };
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Start the Viral Shorts / Reels Cinematic Deep-Zoom Tour
  startCinematicTour() {
    const scene = this.scenes[this.currentSceneId];
    if (!scene || !scene.tourPoints || scene.tourPoints.length === 0) return;

    this.isTourRunning = true;
    this.tourCurrentIndex = 0;

    const tourBanner = document.getElementById("tour-hud-banner");
    const tourBtn = document.getElementById("tour-btn");
    if (tourBanner) tourBanner.classList.remove("hidden");
    if (tourBtn) {
      tourBtn.classList.add("bg-[#ff6a00]", "text-black");
      tourBtn.innerText = "■ 투어 중지";
    }

    if (window.cameraAudio) window.cameraAudio.playToggleSound();
    this.runTourStep();
  }

  runTourStep() {
    if (!this.isTourRunning) return;
    const scene = this.scenes[this.currentSceneId];
    const point = scene.tourPoints[this.tourCurrentIndex];

    const titleEl = document.getElementById("tour-step-title");
    const descEl = document.getElementById("tour-step-desc");
    const stepEl = document.getElementById("tour-step-counter");

    if (titleEl) titleEl.innerText = point.title;
    if (descEl) descEl.innerText = point.desc;
    if (stepEl) stepEl.innerText = `STEP ${this.tourCurrentIndex + 1} / ${scene.tourPoints.length}`;

    // Pan & Zoom
    if (point.bounds) {
      this.viewer.viewport.fitBounds(new OpenSeadragon.Rect(
        point.bounds.x,
        point.bounds.y,
        point.bounds.width,
        point.bounds.height
      ), false);
    } else if (point.point) {
      const targetPoint = new OpenSeadragon.Point(point.point.x, point.point.y);
      this.viewer.viewport.panTo(targetPoint, false);
      this.viewer.viewport.zoomTo(point.zoomLevel, targetPoint, false);
    }

    if (window.cameraAudio) window.cameraAudio.playDialTick();

    // Next step timer
    this.tourStepTimeout = setTimeout(() => {
      if (!this.isTourRunning) return;
      this.tourCurrentIndex++;
      if (this.tourCurrentIndex >= scene.tourPoints.length) {
        // Loop or end
        this.tourCurrentIndex = 0;
      }
      this.runTourStep();
    }, point.duration || 4500);
  }

  stopCinematicTour() {
    this.isTourRunning = false;
    clearTimeout(this.tourStepTimeout);

    const tourBanner = document.getElementById("tour-hud-banner");
    const tourBtn = document.getElementById("tour-btn");
    if (tourBanner) tourBanner.classList.add("hidden");
    if (tourBtn) {
      tourBtn.classList.remove("bg-[#ff6a00]", "text-black");
      tourBtn.innerHTML = `
        <svg class="w-4 h-4 text-[#ff6a00]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span>100MP 디테일 투어</span>
      `;
    }
  }

  toggleCinematicTour() {
    if (this.isTourRunning) {
      this.stopCinematicTour();
    } else {
      this.startCinematicTour();
    }
  }

  // Reset to full view
  resetView() {
    if (this.viewer && this.viewer.viewport) {
      this.viewer.viewport.goHome();
      if (window.cameraAudio) window.cameraAudio.playToggleSound();
    }
  }
}

window.cameraViewer = new CameraViewer();
