/**
 * Hasselblad 3D Camera Body & Mechanical Hinge Engine (Three.js)
 * High-fidelity PBR rendering of 907X & CFV 100C and 500C/M bodies with real-time 0°-90° tilting LCD
 */

class Camera3DEngine {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.cameraGroup = null;      // Main root for camera model
    this.screenPivot = null;      // Hinge pivot for LCD tilt (0 to 90 degrees)
    this.screenMesh = null;       // LCD screen mesh showing live viewfinder
    this.screenMaterial = null;

    this.currentModel = '907x';   // '907x' or '500c'
    this.model907xGroup = null;
    this.model500cGroup = null;
    this.currentTiltDeg = 40;     // Default 40 degree waist-level tilt

    this.viewfinderCanvas = null; // Canvas source for LCD texture
    this.screenTexture = null;

    this.animatingTilt = false;
    this.targetTiltDeg = 40;
  }

  init(containerId, viewfinderCanvas) {
    this.container = document.getElementById(containerId);
    this.viewfinderCanvas = viewfinderCanvas;
    if (!this.container) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 5.8);

    // 2. WebGL Renderer with High-DPI & Tone Mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 2.5;
      this.controls.maxDistance = 12.0;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't flip below table
      this.controls.target.set(0, 0.2, 0);
    }

    // 4. Lighting Environment (Studio Lighting for Swedish Metal & Leather)
    this.setupLighting();

    // 5. Materials
    this.setupMaterials();

    // 6. Build 3D Models (907X & 500C/M)
    this.cameraGroup = new THREE.Group();
    this.scene.add(this.cameraGroup);

    this.build907xModel();
    this.build500cModel();

    // Initial model visibility
    this.switchCameraModel('907x');
    this.setScreenTilt(40);

    // 7. Event Handlers
    window.addEventListener('resize', () => this.onWindowResize());

    // 8. Start Render Loop
    this.animate();
  }

  setupLighting() {
    // Soft ambient studio fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // Key Light (Main soft shadow)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // Rim / Edge Light (Highlights Swedish Chrome bevels)
    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    rimLight.position.set(-5, 4, -4);
    this.scene.add(rimLight);

    // Bottom soft reflection
    const fillLight = new THREE.DirectionalLight(0xffedd5, 0.4);
    fillLight.position.set(0, -3, 3);
    this.scene.add(fillLight);

    // Studio Pedestal / Ground shadow catcher
    const groundGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.9,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1.45;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  setupMaterials() {
    // Hasselblad Classic Polished Chrome Trim
    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8ee,
      metalness: 0.96,
      roughness: 0.12
    });

    // Dark Anodized Aluminum
    this.blackMetalMat = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      metalness: 0.82,
      roughness: 0.35
    });

    // Swedish Black Leatherette Skin (PBR textured feel)
    this.leatherMat = new THREE.MeshStandardMaterial({
      color: 0x101012,
      roughness: 0.92,
      metalness: 0.05
    });

    // Iconic Hasselblad Orange Accent (Shutter button)
    this.orangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      metalness: 0.5,
      roughness: 0.25,
      emissive: 0xd65100,
      emissiveIntensity: 0.15
    });

    // Coated Optical Lens Glass
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.6,
      reflectivity: 0.9
    });

    // Live Viewfinder Screen Material (Rendered from canvas)
    if (this.viewfinderCanvas) {
      this.screenTexture = new THREE.CanvasTexture(this.viewfinderCanvas);
      this.screenTexture.minFilter = THREE.LinearFilter;
      this.screenTexture.magFilter = THREE.LinearFilter;
    }

    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      color: 0xffffff
    });
  }

  // ==========================================
  // 1. Build Hasselblad 907X & CFV 100C Body
  // ==========================================
  build907xModel() {
    this.model907xGroup = new THREE.Group();

    // 1.1 CFV 100C Digital Back (Rear Main Module: 102 x 93 x 84 mm proportional)
    const backGeo = new THREE.BoxGeometry(2.1, 2.0, 1.2);
    const backMesh = new THREE.Mesh(backGeo, this.leatherMat);
    backMesh.position.set(0, 0, -0.4);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    this.model907xGroup.add(backMesh);

    // Back Chrome Trim Edges
    const backTrimGeo = new THREE.BoxGeometry(2.16, 2.06, 1.15);
    const backTrim = new THREE.Mesh(backTrimGeo, this.chromeMat);
    backTrim.position.set(0, 0, -0.4);
    this.model907xGroup.add(backTrim);

    // 1.2 907X Thin Camera Body (Front Module: only 28mm thick!)
    const bodyGeo = new THREE.BoxGeometry(2.18, 2.08, 0.45);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.chromeMat);
    bodyMesh.position.set(0, 0, 0.4);
    bodyMesh.castShadow = true;
    this.model907xGroup.add(bodyMesh);

    // Front Leather Inset
    const frontLeatherGeo = new THREE.BoxGeometry(2.05, 1.95, 0.46);
    const frontLeather = new THREE.Mesh(frontLeatherGeo, this.leatherMat);
    frontLeather.position.set(0, 0, 0.4);
    this.model907xGroup.add(frontLeather);

    // 1.3 Lens Mount Ring (Large Swedish Medium Format Flange)
    const mountGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.15, 48);
    const mount = new THREE.Mesh(mountGeo, this.chromeMat);
    mount.rotation.x = Math.PI / 2;
    mount.position.set(0, 0, 0.65);
    this.model907xGroup.add(mount);

    // 1.4 Hasselblad XCD 38V Lens Barrel
    const lensGroup = new THREE.Group();
    lensGroup.position.set(0, 0, 0.72);

    // Base barrel
    const barrelGeo = new THREE.CylinderGeometry(0.82, 0.85, 1.1, 48);
    const barrel = new THREE.Mesh(barrelGeo, this.blackMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    lensGroup.add(barrel);

    // Knurled Metal Focus Ring
    const focusRingGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.45, 64);
    const focusRing = new THREE.Mesh(focusRingGeo, this.blackMetalMat);
    focusRing.rotation.x = Math.PI / 2;
    focusRing.position.z = 0.52;
    lensGroup.add(focusRing);

    // Lens Front Element (Glass)
    const glassGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.05, 48);
    const glass = new THREE.Mesh(glassGeo, this.glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.z = 1.12;
    lensGroup.add(glass);

    // Front Chrome Bezel with XCD text vibe
    const lensRimGeo = new THREE.TorusGeometry(0.78, 0.05, 16, 64);
    const lensRim = new THREE.Mesh(lensRimGeo, this.chromeMat);
    lensRim.position.z = 1.15;
    lensGroup.add(lensRim);

    this.model907xGroup.add(lensGroup);

    // 1.5 Iconic Orange Shutter Release Button on Lower-Right Front Corner
    const shutterBezelGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 32);
    const shutterBezel = new THREE.Mesh(shutterBezelGeo, this.chromeMat);
    shutterBezel.rotation.x = Math.PI / 2;
    shutterBezel.position.set(0.78, -0.72, 0.68);
    this.model907xGroup.add(shutterBezel);

    const shutterInnerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.14, 32);
    this.shutterButtonMesh = new THREE.Mesh(shutterInnerGeo, this.orangeMat);
    this.shutterButtonMesh.rotation.x = Math.PI / 2;
    this.shutterButtonMesh.position.set(0.78, -0.72, 0.72);
    this.model907xGroup.add(this.shutterButtonMesh);

    // 1.6 Control Wheel (Dial) around the Shutter
    const dialGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 36);
    const dial = new THREE.Mesh(dialGeo, this.blackMetalMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.78, -0.72, 0.64);
    this.model907xGroup.add(dial);

    // 1.7 Tilting Touch LCD Display & Hinge (The Key Feature!)
    // Pivot located at top-rear edge of CFV 100C back
    this.screenPivot907x = new THREE.Group();
    this.screenPivot907x.position.set(0, 0.98, -1.0); // Top hinge position

    // Screen Housing (Aluminum Frame)
    const screenFrameGeo = new THREE.BoxGeometry(1.9, 1.75, 0.14);
    const screenFrame = new THREE.Mesh(screenFrameGeo, this.blackMetalMat);
    screenFrame.position.set(0, -0.875, 0.07);
    this.screenPivot907x.add(screenFrame);

    // Screen Chrome Bezel
    const screenTrimGeo = new THREE.BoxGeometry(1.94, 1.79, 0.12);
    const screenTrim = new THREE.Mesh(screenTrimGeo, this.chromeMat);
    screenTrim.position.set(0, -0.875, 0.07);
    this.screenPivot907x.add(screenTrim);

    // 3.2-inch Touchscreen LCD Display Surface
    const screenDisplayGeo = new THREE.PlaneGeometry(1.68, 1.28);
    this.screenMesh907x = new THREE.Mesh(screenDisplayGeo, this.screenMaterial);
    this.screenMesh907x.position.set(0, -0.82, 0.15);
    // Face outwards
    this.screenMesh907x.rotation.y = Math.PI;
    this.screenPivot907x.add(this.screenMesh907x);

    // Hasselblad Brand Text Bar at bottom of screen
    const brandBarGeo = new THREE.BoxGeometry(1.7, 0.22, 0.02);
    const brandBar = new THREE.Mesh(brandBarGeo, this.blackMetalMat);
    brandBar.position.set(0, -1.6, 0.15);
    this.screenPivot907x.add(brandBar);

    this.model907xGroup.add(this.screenPivot907x);
    this.cameraGroup.add(this.model907xGroup);
  }

  // ==========================================
  // 2. Build Classic 500C/M & CFV 100C Body
  // ==========================================
  build500cModel() {
    this.model500cGroup = new THREE.Group();

    // 2.1 Classic 500C/M Cube Body (Heavy Solid Chrome & Leatherette)
    const body500Geo = new THREE.BoxGeometry(2.3, 2.3, 2.0);
    const body500Mesh = new THREE.Mesh(body500Geo, this.leatherMat);
    body500Mesh.position.set(0, 0, 0.1);
    body500Mesh.castShadow = true;
    this.model500cGroup.add(body500Mesh);

    // Signature 500C Chrome Rails & Screws
    const railsGeo = new THREE.BoxGeometry(2.38, 2.38, 1.95);
    const railsMesh = new THREE.Mesh(railsGeo, this.chromeMat);
    railsMesh.position.set(0, 0, 0.1);
    this.model500cGroup.add(railsMesh);

    // 2.2 Classic Chrome C-Lens with Shutter Speed / Aperture Rings
    const cLensGroup = new THREE.Group();
    cLensGroup.position.set(0, 0, 1.1);

    const cBarrelGeo = new THREE.CylinderGeometry(0.85, 0.88, 1.4, 48);
    const cBarrel = new THREE.Mesh(cBarrelGeo, this.chromeMat);
    cBarrel.rotation.x = Math.PI / 2;
    cBarrel.position.z = 0.7;
    cLensGroup.add(cBarrel);

    const cRingGeo = new THREE.CylinderGeometry(0.89, 0.89, 0.35, 48);
    const cRing = new THREE.Mesh(cRingGeo, this.blackMetalMat);
    cRing.rotation.x = Math.PI / 2;
    cRing.position.z = 0.6;
    cLensGroup.add(cRing);

    const cGlassGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.05, 48);
    const cGlass = new THREE.Mesh(cGlassGeo, this.glassMat);
    cGlass.rotation.x = Math.PI / 2;
    cGlass.position.z = 1.42;
    cLensGroup.add(cGlass);

    this.model500cGroup.add(cLensGroup);

    // 2.3 Classic Film Winding Crank on Right Side
    const crankBaseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 32);
    const crankBase = new THREE.Mesh(crankBaseGeo, this.chromeMat);
    crankBase.rotation.z = Math.PI / 2;
    crankBase.position.set(1.22, 0, 0.1);
    this.model500cGroup.add(crankBase);

    const crankArmGeo = new THREE.BoxGeometry(0.1, 0.8, 0.12);
    const crankArm = new THREE.Mesh(crankArmGeo, this.chromeMat);
    crankArm.position.set(1.28, 0.35, 0.1);
    this.model500cGroup.add(crankArm);

    // 2.4 Classic Shutter Button Lower Right Front
    const cShutterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 32);
    const cShutter = new THREE.Mesh(cShutterGeo, this.chromeMat);
    cShutter.rotation.x = Math.PI / 2;
    cShutter.position.set(0.85, -0.85, 1.15);
    this.model500cGroup.add(cShutter);

    // 2.5 Classic Waist-Level Viewfinder Hood (Pop-up Folding Metal Leaves)
    const hoodGroup = new THREE.Group();
    hoodGroup.position.set(0, 1.18, 0.1);

    // Ground Glass Focusing Screen
    const groundGlassGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const groundGlass = new THREE.Mesh(groundGlassGeo, this.screenMaterial);
    groundGlass.rotation.x = -Math.PI / 2;
    groundGlass.position.y = 0.02;
    hoodGroup.add(groundGlass);

    // Four Metal Hood Flaps (Open position)
    const flapMat = this.blackMetalMat;
    // Front Flap
    const fFlapGeo = new THREE.BoxGeometry(1.65, 1.2, 0.04);
    const fFlap = new THREE.Mesh(fFlapGeo, flapMat);
    fFlap.position.set(0, 0.6, 0.8);
    fFlap.rotation.x = -0.1;
    hoodGroup.add(fFlap);

    // Back Flap
    const bFlap = new THREE.Mesh(fFlapGeo, flapMat);
    bFlap.position.set(0, 0.6, -0.8);
    bFlap.rotation.x = 0.1;
    hoodGroup.add(bFlap);

    // Left/Right Side Flaps
    const sFlapGeo = new THREE.BoxGeometry(0.04, 1.2, 1.6);
    const lFlap = new THREE.Mesh(sFlapGeo, flapMat);
    lFlap.position.set(-0.8, 0.6, 0);
    lFlap.rotation.z = -0.1;
    hoodGroup.add(lFlap);

    const rFlap = new THREE.Mesh(sFlapGeo, flapMat);
    rFlap.position.set(0.8, 0.6, 0);
    rFlap.rotation.z = 0.1;
    hoodGroup.add(rFlap);

    this.model500cGroup.add(hoodGroup);

    // 2.6 CFV 100C Attached to Rear of 500C
    const cfvBackGeo = new THREE.BoxGeometry(2.1, 2.0, 0.8);
    const cfvBack = new THREE.Mesh(cfvBackGeo, this.leatherMat);
    cfvBack.position.set(0, 0, -1.25);
    cfvBack.castShadow = true;
    this.model500cGroup.add(cfvBack);

    const cfvTrimGeo = new THREE.BoxGeometry(2.16, 2.06, 0.75);
    const cfvTrim = new THREE.Mesh(cfvTrimGeo, this.chromeMat);
    cfvTrim.position.set(0, 0, -1.25);
    this.model500cGroup.add(cfvTrim);

    this.cameraGroup.add(this.model500cGroup);
  }

  // Switch between Modern 907X and Classic 500C/M
  switchCameraModel(modelName) {
    this.currentModel = modelName;
    if (this.model907xGroup) {
      this.model907xGroup.visible = (modelName === '907x');
    }
    if (this.model500cGroup) {
      this.model500cGroup.visible = (modelName === '500c');
    }
  }

  // Set LCD Screen Tilt Angle (0 degrees = flat against back, 40 degrees = waist level, 90 degrees = flat top down)
  setScreenTilt(degrees) {
    degrees = Math.max(0, Math.min(90, degrees));
    this.targetTiltDeg = degrees;
    this.currentTiltDeg = degrees;

    if (this.screenPivot907x) {
      // Rotate around X-axis (in radians)
      const rad = THREE.MathUtils.degToRad(degrees);
      this.screenPivot907x.rotation.x = rad;
    }
  }

  // Trigger tactile 3D Shutter Button press animation
  animateShutterPress() {
    if (!this.shutterButtonMesh) return;
    const initialZ = 0.72;
    this.shutterButtonMesh.position.z = 0.66; // Pressed inward
    setTimeout(() => {
      this.shutterButtonMesh.position.z = initialZ;
    }, 120);
  }

  // Update screen texture from live 2D viewfinder canvas
  updateScreenTexture() {
    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    this.updateScreenTexture();

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.camera3DEngine = new Camera3DEngine();
