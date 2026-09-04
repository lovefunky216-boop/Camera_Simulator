/**
 * Hasselblad EXIF Card Generator & Export Engine
 * Generates an official Hasselblad-styled framed card with PIP mini-map and camera metadata
 */

class CameraExporter {
  constructor() {
    this.isCapturing = false;
  }

  // Capture current viewfinder and generate official Hasselblad metadata card
  async captureAndExport() {
    if (this.isCapturing) return;
    this.isCapturing = true;

    try {
      // 1. Get OpenSeadragon canvas
      const osdViewer = window.cameraViewer?.viewer;
      if (!osdViewer) return;

      const sourceCanvas = osdViewer.drawer?.canvas;
      if (!sourceCanvas) return;

      // 2. Play shutter sound & flash
      if (window.cameraAudio) window.cameraAudio.playLeafShutter();
      this.triggerFlashAndBlackout();

      // 3. Prepare canvas
      const cardWidth = 1400;
      const cardHeight = 1100;
      const canvas = document.createElement("canvas");
      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext("2d");

      // Background - Hasselblad Matte Obsidian Black
      ctx.fillStyle = "#0c0c0d";
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Subtle metallic border
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, cardWidth - 2, cardHeight - 2);

      // 4. Draw Captured Image in upper area
      const imgMargin = 40;
      const imgAreaW = cardWidth - (imgMargin * 2);
      const imgAreaH = 860;

      // Draw active canvas content scaled into image area
      ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, imgMargin, imgMargin, imgAreaW, imgAreaH);

      // 5. Draw Picture-in-Picture (PIP) Context Thumbnail in bottom-right corner of image area
      // Showing the whole scene so viewers realize how insanely deep this zoom is!
      const pipW = 200;
      const pipH = 150;
      const pipX = imgMargin + imgAreaW - pipW - 16;
      const pipY = imgMargin + imgAreaH - pipH - 16;

      ctx.save();
      // Drop shadow for PIP
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#18181b";
      ctx.fillRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
      ctx.strokeStyle = "#ff6a00";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
      ctx.restore();

      // Draw overall scene thumbnail if available
      try {
        const item = osdViewer.world.getItemAt(0);
        if (item) {
          // OpenSeadragon thumbnail drawing
          ctx.fillStyle = "#27272a";
          ctx.fillRect(pipX, pipY, pipW, pipH);
          ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, pipX, pipY, pipW, pipH);

          // PIP Label
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.fillRect(pipX, pipY + pipH - 22, pipW, 22);
          ctx.font = "bold 10px 'SF Mono', Menlo, monospace";
          ctx.fillStyle = "#ff6a00";
          ctx.fillText("100MP MACRO CROP", pipX + 8, pipY + pipH - 7);
        }
      } catch (e) {
        // ignore pip error
      }

      // 6. Draw Hasselblad Metadata Bar at Bottom
      const barY = imgMargin + imgAreaH + 30;

      // Left: Hasselblad Iconic "H" Logo Mark & Typography
      // Draw stylized "H" badge
      const hX = imgMargin + 4;
      const hY = barY + 12;
      ctx.fillStyle = "#ff6a00";
      ctx.beginPath();
      ctx.arc(hX + 16, hY + 16, 18, 0, Math.PI * 2);
      ctx.fill();

      // "H" letter inside badge
      ctx.fillStyle = "#0c0c0d";
      ctx.font = "900 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("H", hX + 16, hY + 16);

      // Hasselblad Brand Text
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "700 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("HASSELBLAD", hX + 44, hY + 14);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("CFV 100C & 907X · 100MP MEDIUM FORMAT", hX + 44, hY + 31);

      // Right: Photographic EXIF Parameters
      const rightX = cardWidth - imgMargin;
      ctx.textAlign = "right";

      const aperture = document.getElementById("hud-aperture")?.innerText || "f/2.5";
      const shutter = document.getElementById("hud-shutter")?.innerText || "1/250s";
      const iso = document.getElementById("hud-iso")?.innerText || "64";
      const zoom = document.getElementById("zoom-text")?.innerText || "100%";

      ctx.fillStyle = "#f4f4f5";
      ctx.font = "600 15px 'SF Mono', Menlo, monospace";
      ctx.fillText(`XCD 38mm V · ${aperture} · ${shutter} · ISO ${iso}`, rightX, hY + 14);

      ctx.fillStyle = "#71717a";
      ctx.font = "400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`16-BIT RAW · HNCS COLOUR · REAL ZOOM ${zoom} · SWEDEN`, rightX, hY + 31);

      // 7. Show Modal Preview & Download
      const exportDataUrl = canvas.toDataURL("image/jpeg", 0.94);
      this.showExportModal(exportDataUrl);

    } catch (err) {
      console.error("Capture failed:", err);
      alert("이미지 캡처 중 오류가 발생했습니다.");
    } finally {
      this.isCapturing = false;
    }
  }

  // Camera Flash & Blackout animation
  triggerFlashAndBlackout() {
    const blackout = document.getElementById("blackout-layer");
    const flash = document.getElementById("flash-layer");
    if (!blackout) return;

    if (flash) {
      flash.classList.remove("opacity-0");
      flash.classList.add("opacity-60");
      setTimeout(() => {
        flash.classList.remove("opacity-60");
        flash.classList.add("opacity-0");
      }, 70);
    }

    blackout.classList.remove("opacity-0");
    blackout.classList.add("opacity-100");
    setTimeout(() => {
      blackout.classList.remove("opacity-100");
      blackout.classList.add("opacity-0");
    }, 140);
  }

  // Display Export Dialog
  showExportModal(dataUrl) {
    const modal = document.getElementById("export-modal");
    const imgPreview = document.getElementById("export-preview-img");
    const downloadBtn = document.getElementById("download-card-btn");
    const shareBtn = document.getElementById("share-card-btn");

    if (!modal || !imgPreview) return;

    imgPreview.src = dataUrl;
    modal.classList.remove("hidden");

    // Download action
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `Hasselblad_100MP_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    }

    // Web Share action
    if (shareBtn) {
      shareBtn.onclick = async () => {
        if (navigator.share) {
          try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "Hasselblad_100MP_Shot.jpg", { type: "image/jpeg" });
            await navigator.share({
              title: "Hasselblad 100MP Virtual Experience",
              text: "핫셀블라드 1억 화소 가상 카메라로 촬영한 초고해상도 디테일 사진입니다! #Hasselblad #100MP",
              files: [file]
            });
          } catch (e) {
            console.log("Share cancelled or failed", e);
          }
        } else {
          // Copy link to clipboard
          navigator.clipboard.writeText(window.location.href);
          alert("사이트 링크가 클립보드에 복사되었습니다! 친구들에게 공유해보세요.");
        }
      };
    }
  }

  closeModal() {
    const modal = document.getElementById("export-modal");
    if (modal) modal.classList.add("hidden");
  }
}

window.cameraExporter = new CameraExporter();
