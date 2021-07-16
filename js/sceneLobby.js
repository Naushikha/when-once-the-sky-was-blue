import * as THREE from "./lib/three.module.js";
import { FirstPersonControls } from "./lib/FirstPersonControls.js";
// import { OrbitControls } from "./lib/OrbitControls.js";
import { MTLLoader } from "./lib/MTLLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";
// Bloom (Transition light effect) imports
import { EffectComposer } from "./lib/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/postprocessing/RenderPass.js";
import { ShaderPass } from "./lib/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "./lib/postprocessing/UnrealBloomPass.js";
// FXAA
import { FXAAShader } from "./lib/postprocessing/shaders/FXAAShader.js";
// Subtitles
import { SubtitleHandler } from "./subtitleHandler.js";
// Credits
import { CreditsHandler } from "./creditsHandler.js";
import { FadeInOutEffect } from "./fadeInOutEffect.js";

class SceneLobby {
  dataPath = "./data/";
  clock = new THREE.Clock();

  constructor(renderer, manager, stats) {
    this.renderer = renderer;
    this.manager = manager;
    this.stats = stats;
    this.renderState = false;
    this.animation = new TWEEN.Group(); // Animation

    // Setup this scene and its camera ------------------------------------------
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    // Load everything on to the screen -----------------------------------------

    // Skybox
    const skyBoxLoader = new THREE.CubeTextureLoader(this.manager);
    skyBoxLoader.setPath(this.dataPath);

    this.currentSkybox = "black";
    const skyboxTextures = {
      black: skyBoxLoader.load([
        "txt/black_sb_front.png",
        "txt/black_sb_back.png",
        "txt/black_sb_top.png",
        "txt/black_sb_bottom.png",
        "txt/black_sb_left.png",
        "txt/black_sb_right.png",
      ]),
      purple: skyBoxLoader.load([
        "txt/purple_sb_front.png",
        "txt/purple_sb_back.png",
        "txt/purple_sb_top.png",
        "txt/purple_sb_bottom.png",
        "txt/purple_sb_left.png",
        "txt/purple_sb_right.png",
      ]),
      red: skyBoxLoader.load([
        "txt/red_sb_front.png",
        "txt/red_sb_back.png",
        "txt/red_sb_top.png",
        "txt/red_sb_bottom.png",
        "txt/red_sb_left.png",
        "txt/red_sb_right.png",
      ]),
      yellow: skyBoxLoader.load([
        "txt/yellow_sb_front.png",
        "txt/yellow_sb_back.png",
        "txt/yellow_sb_top.png",
        "txt/yellow_sb_bottom.png",
        "txt/yellow_sb_left.png",
        "txt/yellow_sb_right.png",
      ]),
      blue: skyBoxLoader.load([
        "txt/blue_sb_front.png",
        "txt/blue_sb_back.png",
        "txt/blue_sb_top.png",
        "txt/blue_sb_bottom.png",
        "txt/blue_sb_left.png",
        "txt/blue_sb_right.png",
      ]),
    };
    this.scene.background = skyboxTextures[this.currentSkybox];
    this.skyboxTextures = skyboxTextures; // Export this for bloom

    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    const mtlLoader = new MTLLoader(manager);

    // Francis 1 - Left
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        root.position.x = -20;
        root.rotation.y += Math.PI / 6;
        root.scale.set(0.1, 0.1, 0.1);
        this.scene.add(root);
        this.francis1 = root;
        // Franci texture
        root.userData.texture = new THREE.TextureLoader(this.manager).load(
          `${this.dataPath}txt/francis1.jpg`
        );
        root.userData.perfPending = 1; // Franci performance not done yet
      });
    });

    // Francis 2 - Middle
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        root.position.z = -10;
        root.scale.set(0.1, 0.1, 0.1);
        this.scene.add(root);
        this.francis2 = root;
        // Franci texture
        root.userData.texture = new THREE.TextureLoader(this.manager).load(
          `${this.dataPath}txt/francis2.jpg`
        );
        root.userData.perfPending = 2; // Franci performance not done yet
      });
    });

    // Francis 3 - Right
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        root.position.x = 20;
        root.rotation.y -= Math.PI / 6;
        root.scale.set(0.1, 0.1, 0.1);
        this.scene.add(root);
        this.francis3 = root;
        // Franci texture
        root.userData.texture = new THREE.TextureLoader(this.manager).load(
          `${this.dataPath}txt/francis3.jpg`
        );
        root.userData.perfPending = 3; // Franci performance not done yet
      });
    });

    // Francis US
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        root.position.z = 45;
        root.position.y = -20;
        root.rotation.y += Math.PI;
        root.scale.set(0.2, 0.2, 0.2);
        this.scene.add(root);
        this.francisUs = root;
      });
    });

    // Arcs for Franci
    const arcTexture = new THREE.TextureLoader(this.manager).load(
      `${this.dataPath}txt/arch.png`
    );
    const arcPTexture = new THREE.TextureLoader(this.manager).load(
      // Portal arc
      `${this.dataPath}txt/arch_portal.png`
    );
    const arcGeometry = new THREE.PlaneGeometry(20, 40);
    const arcMaterial = new THREE.MeshBasicMaterial({
      map: arcTexture,
      color: 0xcccccc,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const arcMaterial2 = new THREE.MeshBasicMaterial({
      map: arcTexture,
      color: 0xcccccc,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const arcPMaterial = new THREE.MeshBasicMaterial({
      map: arcPTexture,
      color: 0xcccccc,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const arc1 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc1.position.set(30, 10, -20);
    arc1.rotation.y -= Math.PI / 6;
    this.scene.add(arc1);
    const arc2 = new THREE.Mesh(arcGeometry, arcMaterial2);
    arc2.position.set(0, 10, -25);
    this.scene.add(arc2);
    const arcP = new THREE.Mesh(arcGeometry, arcPMaterial); // This is infront of arc2 to appear in at the end
    arcP.position.set(0, 10, -24.9);
    this.scene.add(arcP);
    const arc3 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc3.position.set(-30, 10, -20);
    arc3.rotation.y += Math.PI / 6;
    this.scene.add(arc3);
    const arc4 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc4.position.set(0, 10, 55);
    this.scene.add(arc4);
    this.arcs = {
      a1: arc1,
      a2: arc2,
      a3: arc3,
      a4: arc4,
      ap: arcP,
    };

    this.setupBloom();

    // Bloom sphere
    const bloomGeometry = new THREE.IcosahedronGeometry(1, 15);
    const bloomMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bloom = new THREE.Mesh(bloomGeometry, bloomMaterial);
    bloom.scale.setScalar(0);
    bloom.position.y = 30;
    bloom.layers.toggle(this.BLOOM_SCENE);
    bloom.layers.enable(this.BLOOM_SCENE);
    this.scene.add(bloom);
    this.bloom = bloom;

    // Arc glow
    arc1.layers.toggle(this.BLOOM_SCENE);
    arc1.layers.enable(this.BLOOM_SCENE);
    arc2.layers.toggle(this.BLOOM_SCENE);
    arc2.layers.enable(this.BLOOM_SCENE);
    arc3.layers.toggle(this.BLOOM_SCENE);
    arc3.layers.enable(this.BLOOM_SCENE);
    arc4.layers.toggle(this.BLOOM_SCENE);
    arc4.layers.enable(this.BLOOM_SCENE);
    arcP.layers.enable(this.BLOOM_SCENE);
    arcP.material.opacity = 0;

    // Lighting
    // Main light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    this.scene.add(directionalLight1);
    directionalLight1.position.set(0, 35, 40);
    // Lights for francis hover
    const francis1SpotLight = new THREE.SpotLight(0xffffff, 0, 40, 0.4);
    francis1SpotLight.position.set(0, 16, 24); // Camera position
    const sp1Target = new THREE.Object3D();
    sp1Target.position.set(-20, 10, 0);
    francis1SpotLight.target = sp1Target;
    this.scene.add(francis1SpotLight);
    this.scene.add(francis1SpotLight.target);
    this.francis1SpotLight = francis1SpotLight;

    const francis2SpotLight = new THREE.SpotLight(0xffffff, 0, 40, 0.33);
    francis2SpotLight.position.set(0, 17, 24); // Camera position
    const sp2Target = new THREE.Object3D();
    sp2Target.position.set(0, 11, 0);
    francis2SpotLight.target = sp2Target;
    this.scene.add(francis2SpotLight);
    this.scene.add(francis2SpotLight.target);
    this.francis2SpotLight = francis2SpotLight;

    const francis3SpotLight = new THREE.SpotLight(0xffffff, 0, 40, 0.4);
    francis3SpotLight.position.set(0, 16, 24); // Camera position
    const sp3Target = new THREE.Object3D();
    sp3Target.position.set(20, 10, 0);
    francis3SpotLight.target = sp3Target;
    this.scene.add(francis3SpotLight);
    this.scene.add(francis3SpotLight.target);
    this.francis3SpotLight = francis3SpotLight;

    const francis4SpotLight = new THREE.SpotLight(0xffffff, 3, 40, 0.8);
    francis4SpotLight.position.set(0, 16, 20); // Camera position
    const sp4Target = new THREE.Object3D();
    sp4Target.position.set(0, 3, 38);
    francis4SpotLight.target = sp4Target;
    this.scene.add(francis4SpotLight);
    this.scene.add(francis4SpotLight.target);

    this.setupFrancisAnimations();

    // Load subtitles
    const subHandler = new SubtitleHandler(
      "captions-overlay",
      "instruc",
      "caption"
    );
    subHandler.load(`${this.dataPath}srt/lobby.srt`);
    this.subHandler = subHandler;

    const endingSubHandler = new SubtitleHandler(
      "captions-overlay",
      "instruc",
      "caption"
    );
    endingSubHandler.load(`${this.dataPath}srt/ending.srt`);
    this.endingSubHandler = endingSubHandler;

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener("mousemove", this.onMouseMove.bind(this), false);

    // Define the controls ------------------------------------------------------
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new FirstPersonControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.movementSpeed = 0;
    this.controls.lookSpeed = 0.017;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 30; // 30
    this.controls.enabled = false; // Disable it after creation

    this.camera.position.set(0, 16, 40);
    this.camera.rotation.x = Math.PI / 2; // To prevent pointing at francis at start
    this.renderState = false; // We won't be rendering straight away

    this.interactive = false; // Do not allow any interactions with franci
  }
  setFranciTexture(whichFranci) {
    // Change texture
    whichFranci.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = whichFranci.userData.texture;
        child.material.needsUpdate = true;
      }
    });
    // Set light to max
    const maxLight = 3;
    switch (whichFranci.userData.perfPending) {
      case 1:
        this.francis1SpotLight.intensity = maxLight;
        break;
      case 2:
        this.francis2SpotLight.intensity = maxLight * 2;
        break;
      case 3:
        this.francis3SpotLight.intensity = maxLight;
        break;
      default:
        break;
    }
    whichFranci.userData.perfPending = 0; // This is also used as an indication to prevent interaction, checked later in the render loop
  }
  setFranciOpacity(whichFranci, opacity) {
    whichFranci.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true;
        child.material.opacity = opacity;
        child.material.needsUpdate = true;
      }
    });
  }
  setupFrancisAnimations() {
    const floatHeight = 0.7;
    // Francis 1 Animation
    var posVec1 = {
      y: floatHeight,
    };
    var endVec1 = {
      y: 0,
    };
    var franc1AnimUp = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      3000
    );
    franc1AnimUp.onUpdate(() => {
      this.francis1.position.y = posVec1.y;
    });
    franc1AnimUp.onComplete(() => {
      posVec1.y = 0;
      endVec1.y = floatHeight;
      franc1AnimDown.start();
    });
    var franc1AnimDown = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      3000
    );
    franc1AnimDown.onUpdate(() => {
      this.francis1.position.y = posVec1.y;
    });
    franc1AnimDown.onComplete(() => {
      posVec1.y = floatHeight;
      endVec1.y = 0;
      franc1AnimUp.start();
    });
    franc1AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc1AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 2 Animation
    var posVec2 = {
      y: 0,
    };
    var endVec2 = {
      y: floatHeight,
    };
    var franc2AnimUp = new TWEEN.Tween(posVec2, this.animation).to(
      endVec2,
      4000
    );
    franc2AnimUp.onUpdate(() => {
      this.francis2.position.y = posVec2.y;
    });
    franc2AnimUp.onComplete(() => {
      posVec2.y = floatHeight;
      endVec2.y = 0;
      franc2AnimDown.start();
    });
    var franc2AnimDown = new TWEEN.Tween(posVec2, this.animation).to(
      endVec2,
      4000
    );
    franc2AnimDown.onUpdate(() => {
      this.francis2.position.y = posVec2.y;
    });
    franc2AnimDown.onComplete(() => {
      posVec2.y = 0;
      endVec2.y = floatHeight;
      franc2AnimUp.start();
    });
    franc2AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc2AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 3 Animation
    var posVec3 = {
      y: 0,
    };
    var endVec3 = {
      y: floatHeight,
    };
    var franc3AnimUp = new TWEEN.Tween(posVec3, this.animation).to(
      endVec3,
      5000
    );
    franc3AnimUp.onUpdate(() => {
      this.francis3.position.y = posVec3.y;
    });
    franc3AnimUp.onComplete(() => {
      posVec3.y = floatHeight;
      endVec3.y = 0;
      franc3AnimDown.start();
    });
    var franc3AnimDown = new TWEEN.Tween(posVec3, this.animation).to(
      endVec3,
      5000
    );
    franc3AnimDown.onUpdate(() => {
      this.francis3.position.y = posVec3.y;
    });
    franc3AnimDown.onComplete(() => {
      posVec3.y = 0;
      endVec3.y = floatHeight;
      franc3AnimUp.start();
    });
    franc3AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc3AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 4 Animation
    const franc4Offset = -20;
    var posVec4 = {
      y: 0,
    };
    var endVec4 = {
      y: floatHeight,
    };
    var franc4AnimUp = new TWEEN.Tween(posVec4, this.animation).to(
      endVec4,
      5000
    );
    franc4AnimUp.onUpdate(() => {
      this.francisUs.position.y = posVec4.y + franc4Offset;
    });
    franc4AnimUp.onComplete(() => {
      posVec4.y = floatHeight;
      endVec4.y = 0;
      franc4AnimDown.start();
    });
    var franc4AnimDown = new TWEEN.Tween(posVec4, this.animation).to(
      endVec4,
      5000
    );
    franc4AnimDown.onUpdate(() => {
      this.francisUs.position.y = posVec4.y + franc4Offset;
    });
    franc4AnimDown.onComplete(() => {
      posVec4.y = 0;
      endVec4.y = floatHeight;
      franc4AnimUp.start();
    });
    franc4AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc4AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    franc1AnimUp.start();
    franc2AnimUp.start();
    franc3AnimUp.start();
    franc4AnimUp.start();

    const maxLight = 3;
    const lightTime = 1000;
    // Light hover animations
    // Francis 1 Animation
    var lightStartVec1 = {
      y: 0, // Doesn't have to be 'y', just put it for now
    };
    var lightEndVec1 = {
      y: maxLight,
    };
    var franc1AnimLightUp = new TWEEN.Tween(lightStartVec1, this.animation).to(
      lightEndVec1,
      lightTime
    );
    franc1AnimLightUp.onUpdate(() => {
      this.franc1LightState = "lightup";
      this.francis1SpotLight.intensity = lightStartVec1.y;
    });
    franc1AnimLightUp.onStop(() => {
      lightEndVec1.y = 0;
      franc1AnimLightDown.start();
    });
    franc1AnimLightUp.onComplete(() => {
      lightStartVec1.y = maxLight;
      lightEndVec1.y = 0;
      this.franc1LightState = "lit";
    });
    var franc1AnimLightDown = new TWEEN.Tween(
      lightStartVec1,
      this.animation
    ).to(lightEndVec1, lightTime);
    franc1AnimLightDown.onUpdate(() => {
      this.franc1LightState = "lightdown";
      this.francis1SpotLight.intensity = lightStartVec1.y;
    });
    franc1AnimLightDown.onStop(() => {
      lightEndVec1.y = maxLight;
      franc1AnimLightUp.start();
    });
    franc1AnimLightDown.onComplete(() => {
      lightStartVec1.y = 0;
      lightEndVec1.y = maxLight;
      this.franc1LightState = "dead";
    });
    franc1AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc1AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 2 Animation
    var lightStartVec2 = {
      y: 0,
    };
    var lightEndVec2 = {
      y: maxLight * 1.6,
    };
    var franc2AnimLightUp = new TWEEN.Tween(lightStartVec2, this.animation).to(
      lightEndVec2,
      lightTime
    );
    franc2AnimLightUp.onUpdate(() => {
      this.franc2LightState = "lightup";
      this.francis2SpotLight.intensity = lightStartVec2.y;
    });
    franc2AnimLightUp.onStop(() => {
      lightEndVec2.y = 0;
      franc2AnimLightDown.start();
    });
    franc2AnimLightUp.onComplete(() => {
      lightStartVec2.y = maxLight * 1.6;
      lightEndVec2.y = 0;
      this.franc2LightState = "lit";
    });
    var franc2AnimLightDown = new TWEEN.Tween(
      lightStartVec2,
      this.animation
    ).to(lightEndVec2, lightTime);
    franc2AnimLightDown.onUpdate(() => {
      this.franc2LightState = "lightdown";
      this.francis2SpotLight.intensity = lightStartVec2.y;
    });
    franc2AnimLightDown.onStop(() => {
      lightEndVec2.y = maxLight * 1.6;
      franc2AnimLightUp.start();
    });
    franc2AnimLightDown.onComplete(() => {
      lightStartVec2.y = 0;
      lightEndVec2.y = maxLight * 1.6;
      this.franc2LightState = "dead";
    });
    franc2AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc2AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 3 Animation
    var lightStartVec3 = {
      y: 0,
    };
    var lightEndVec3 = {
      y: maxLight,
    };
    var franc3AnimLightUp = new TWEEN.Tween(lightStartVec3, this.animation).to(
      lightEndVec3,
      lightTime
    );
    franc3AnimLightUp.onUpdate(() => {
      this.franc3LightState = "lightup";
      this.francis3SpotLight.intensity = lightStartVec3.y;
    });
    franc3AnimLightUp.onStop(() => {
      lightEndVec3.y = 0;
      franc3AnimLightDown.start();
    });
    franc3AnimLightUp.onComplete(() => {
      lightStartVec3.y = maxLight;
      lightEndVec3.y = 0;
      this.franc3LightState = "lit";
    });
    var franc3AnimLightDown = new TWEEN.Tween(
      lightStartVec3,
      this.animation
    ).to(lightEndVec3, lightTime);
    franc3AnimLightDown.onUpdate(() => {
      this.franc3LightState = "lightdown";
      this.francis3SpotLight.intensity = lightStartVec3.y;
    });
    franc3AnimLightDown.onStop(() => {
      lightEndVec3.y = maxLight;
      franc3AnimLightUp.start();
    });
    franc3AnimLightDown.onComplete(() => {
      lightStartVec3.y = 0;
      lightEndVec3.y = maxLight;
      this.franc3LightState = "dead";
    });
    franc3AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc3AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    this.franc1AnimLightUp = franc1AnimLightUp;
    this.franc1AnimLightDown = franc1AnimLightDown;
    this.franc2AnimLightUp = franc2AnimLightUp;
    this.franc2AnimLightDown = franc2AnimLightDown;
    this.franc3AnimLightUp = franc3AnimLightUp;
    this.franc3AnimLightDown = franc3AnimLightDown;
    this.franc1LightState = "dead";
    this.franc2LightState = "dead";
    this.franc3LightState = "dead";
  }
  setupBloomAnimations(switcher, perf) {
    var posVec1 = {
      x: this.camera.rotation.x,
      y: this.camera.rotation.y,
      z: this.camera.rotation.z,
    };
    var endVec1 = {
      x: 0.3,
      y: 0,
      z: 0,
    };
    var lookAtBloom = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      3000
    );
    lookAtBloom.onUpdate(() => {
      this.camera.rotation.set(posVec1.x, posVec1.y, posVec1.z);
    });
    var posVec2 = {
      s: 0,
    };
    var endVec2 = {
      s: 30,
    };
    var growBloom = new TWEEN.Tween(posVec2, this.animation).to(endVec2, 5000);
    growBloom.onUpdate(() => {
      this.bloom.scale.setScalar(posVec2.s);
    });
    growBloom.onComplete(() => {
      // set bloom to default
      this.bloom.scale.setScalar(0);
      // this.blooming = false; // Stop rendering bloom
      switcher(perf); //switch to next perf
    });
    lookAtBloom.easing(TWEEN.Easing.Quadratic.InOut);
    growBloom.easing(TWEEN.Easing.Quadratic.In);

    this.interactive = false; // Prevent interactions with franci
    lookAtBloom.start();
    growBloom.start();
  }
  playEnding() {
    // Move all the franci to 0,0,0
    var posVec1 = {
      x1: this.francis1.position.x,
      z1: this.francis1.position.z,
      x2: this.francis2.position.x,
      z2: this.francis2.position.z,
      x3: this.francis3.position.x,
      z3: this.francis3.position.z,
      a: 1,
      l: 0.4, // Make spotlight wider
    };
    var endVec1 = {
      x1: 0,
      z1: 10,
      x2: 0,
      z2: 10,
      x3: 0,
      z3: 10,
      a: 0,
      l: 0.7,
    };
    var francMerge = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      20000
    );
    francMerge.onUpdate(() => {
      this.francis1.position.x = posVec1.x1;
      this.francis1.position.z = posVec1.z1;
      this.francis2.position.x = posVec1.x2;
      this.francis2.position.z = posVec1.z2;
      this.francis3.position.x = posVec1.x3;
      this.francis3.position.z = posVec1.z3;
      this.setFranciOpacity(this.francis1, posVec1.a);
      this.setFranciOpacity(this.francis2, posVec1.a);
      this.setFranciOpacity(this.francis3, posVec1.a);
      this.setFranciOpacity(this.francisUs, posVec1.a);
      this.arcs.a1.material.opacity = posVec1.a;
      this.arcs.a3.material.opacity = posVec1.a;
      this.arcs.a4.material.opacity = posVec1.a;
      // Spotlights
      this.francis1SpotLight.target.position.x = posVec1.x1;
      this.francis1SpotLight.target.position.z = posVec1.z1;
      this.francis2SpotLight.target.position.x = posVec1.x2;
      this.francis2SpotLight.target.position.z = posVec1.z2;
      this.francis3SpotLight.target.position.x = posVec1.x3;
      this.francis3SpotLight.target.position.z = posVec1.z3;
      this.francis1SpotLight.angle = posVec1.l;
      this.francis2SpotLight.angle = posVec1.l;
      this.francis3SpotLight.angle = posVec1.l;
    });
    francMerge.onComplete(() => {
      this.francis1.position.x = 20000; // Throw these dudes away
      this.francis2.position.x = 20000;
      this.francis3.position.x = 20000;
      this.francisUs.position.x = 20000;
      this.arcs.a1.position.x = 20000;
      this.arcs.a3.position.x = 20000;
      this.arcs.a4.position.x = 20000;
      portalGlow.start();
    });
    // Make blue portal appear
    var posVec2 = {
      a: 0,
    };
    var endVec2 = {
      a: 1,
    };
    var portalGlow = new TWEEN.Tween(posVec2, this.animation).to(endVec2, 5000);
    portalGlow.onUpdate(() => {
      this.arcs.ap.material.opacity = posVec2.a;
    });
    portalGlow.onComplete(() => {
      this.arcs.a2.position.x = 20000;
      moveIntoPortal.start();
    });
    // Move towards it
    var posVec3 = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };
    var endVec3 = {
      x: this.arcs.ap.position.x,
      y: this.arcs.ap.position.y,
      z: this.arcs.ap.position.z,
    };
    var moveIntoPortal = new TWEEN.Tween(posVec3, this.animation).to(
      endVec3,
      20000
    );
    moveIntoPortal.onUpdate(() => {
      this.camera.position.set(posVec3.x, posVec3.y, posVec3.z);
      if (posVec3.z - endVec3.z < 0.1) {
        this.updateSkybox("blue");
      }
    });
    moveIntoPortal.onComplete(() => {
      setTimeout(() => {
        credHandler.playCredits();
      }, 23000); // Need to add a delay till ending audio finishes
    });
    const fIO = new FadeInOutEffect("transition-overlay", "white", 3500);
    setTimeout(() => {
      fIO.playEffect();
    }, 43000); // Everything ends @ 45000
    // Credits ending fadeout animation
    const creditsEndFunc = () => {
      const fIO = new FadeInOutEffect("transition-overlay", "white", 4000, () => {
        location.reload();
      });
      fIO.playEffect();
    };
    const credHandler = new CreditsHandler(
      "credits-overlay",
      "credits-title",
      "credits-name",
      creditsEndFunc
    );
    credHandler.load(`${this.dataPath}credits.csv`);

    francMerge.start();
  }
  setupBloom() {
    this.BLOOM_SCENE = 1; // SEPERATE SCENE FOR BLOOM
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(this.BLOOM_SCENE);
    this.bloomDarkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    this.bloomMaterials = {};
    // this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0
    );
    // this.renderer.toneMappingExposure = -1;
    // this.bloomPass.threshold = 0; // These are the setting to change to achieve effect
    this.bloomPass.strength = Number(1);
    this.bloomPass.radius = Number(1);
    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(this.renderScene);
    this.bloomComposer.addPass(this.bloomPass);
    this.finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader: `varying vec2 vUv;
					void main(){vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`,
        fragmentShader: `uniform sampler2D baseTexture;uniform sampler2D bloomTexture;varying vec2 vUv;
					void main(){gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );}`,
        defines: {},
      }),
      "baseTexture"
    );
    this.finalPass.needsSwap = true;
    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.addPass(this.renderScene);
    this.finalComposer.addPass(this.finalPass);

    // FXAA - to solve this jagged problem
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms["resolution"].value.x = 1 / window.innerWidth;
    fxaaPass.material.uniforms["resolution"].value.y = 1 / window.innerHeight;
    this.finalComposer.addPass(fxaaPass);
  }
  enterPerformance(switcher, perf) {
    this.interactive = false;
    this.controls.enabled = false;
    this.setupBloomAnimations(switcher, perf);
  }
  play() {
    this.cameraPanDown(false);
    setTimeout(() => {
      this.subHandler.playSubtitles();
    }, 8000);
  }
  cameraPanDown(interactiveToggle = false) {
    // Pan Down Animation
    this.controls.enabled = false;
    var posVec1 = {
      x: Math.PI / 2,
    };
    var endVec1 = {
      x: -Math.PI / 21,
    };
    var panDown = new TWEEN.Tween(posVec1, this.animation).to(endVec1, 18000);
    panDown.onUpdate(() => {
      this.camera.rotation.x = posVec1.x;
    });
    panDown.onComplete(() => {
      this.controls.enabled = true;
      this.controls.lookAt(0, 5, -35); // Look at francis 2 mid point sorta
      if (interactiveToggle) {
        this.interactive = true;
      }
    });
    panDown.easing(TWEEN.Easing.Quadratic.InOut);
    panDown.start();
  }
  updateSkybox(skyboxName) {
    // Call from outside to change
    this.currentSkybox = skyboxName;
    this.scene.background = this.skyboxTextures[this.currentSkybox];
  }
  render(state = true) {
    if (state) {
      this.renderLoop();
      this.renderState = true;
    } else {
      cancelAnimationFrame(this.renderID);
      this.controls.enabled = false;
      this.renderState = false;
    }
  }
  renderLoop() {
    this.renderID = requestAnimationFrame(this.renderLoop.bind(this));
    const delta = this.clock.getDelta();
    this.animation.update();
    if (this.controls.enabled) {
      this.controls.update(delta);
      // Move franci-us
      let vector = new THREE.Vector3();
      this.camera.getWorldDirection(vector);
      const theta = Math.atan2(vector.x, vector.z);
      const camRot = Math.PI + theta;
      this.francisUs.rotation.y = theta;
      this.francisUs.position.x = this.camera.position.x + Math.sin(camRot) * 3;
      this.francisUs.position.z = this.camera.position.z + Math.cos(camRot) * 3;
    }
    this.renderBloom();
    this.finalComposer.render();
    // this.stats.update();

    const franciControls = () => {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const francis1Intersects = this.raycaster.intersectObjects(
        [this.francis1],
        true
      );
      const francis2Intersects = this.raycaster.intersectObjects(
        [this.francis2],
        true
      );
      const francis3Intersects = this.raycaster.intersectObjects(
        [this.francis3],
        true
      );

      if (this.francis1.userData.perfPending) {
        if (francis1Intersects.length) {
          this.francis1Hover = true;
          if (this.franc1LightState == "lightdown") {
            this.franc1AnimLightDown.stop();
          }
          if (this.franc1LightState == "dead") {
            this.franc1AnimLightUp.start();
          }
        } else {
          this.francis1Hover = false;
          if (this.franc1LightState == "lightup") {
            this.franc1AnimLightUp.stop();
          }
          if (this.franc1LightState == "lit") {
            this.franc1AnimLightDown.start();
          }
        }
      }
      if (this.francis2.userData.perfPending) {
        if (francis2Intersects.length) {
          this.francis2Hover = true;
          if (this.franc2LightState == "lightdown") {
            this.franc2AnimLightDown.stop();
          }
          if (this.franc2LightState == "dead") {
            this.franc2AnimLightUp.start();
          }
        } else {
          this.francis2Hover = false;
          if (this.franc2LightState == "lightup") {
            this.franc2AnimLightUp.stop();
          }
          if (this.franc2LightState == "lit") {
            this.franc2AnimLightDown.start();
          }
        }
      }
      if (this.francis3.userData.perfPending) {
        if (francis3Intersects.length) {
          this.francis3Hover = true;
          if (this.franc3LightState == "lightdown") {
            this.franc3AnimLightDown.stop();
          }
          if (this.franc3LightState == "dead") {
            this.franc3AnimLightUp.start();
          }
        } else {
          this.francis3Hover = false;
          if (this.franc3LightState == "lightup") {
            this.franc3AnimLightUp.stop();
          }
          if (this.franc3LightState == "lit") {
            this.franc3AnimLightDown.start();
          }
        }
      }
      // Set cursor
      if (
        (this.francis1Hover && this.francis1.userData.perfPending) ||
        (this.francis2Hover && this.francis2.userData.perfPending) ||
        (this.francis3Hover && this.francis3.userData.perfPending)
      ) {
        document.body.style.cursor =
          "url('./data/txt/cursor_white.png') 16 16, auto";
      } else {
        document.body.style.cursor =
          "url('./data/txt/cursor_grey.png') 16 16, auto";
      }
    };
    if (this.interactive) franciControls();
  }
  renderBloom() {
    this.scene.traverse(darkenNonBloomed.bind(this));
    this.scene.background = new THREE.Color(0x000000); // Make background black
    this.bloomComposer.render();
    this.scene.traverse(restoreMaterial.bind(this));
    this.scene.background = this.skyboxTextures[this.currentSkybox]; // Restore background
    function darkenNonBloomed(obj) {
      if (obj.isMesh && this.bloomLayer.test(obj.layers) === false) {
        this.bloomMaterials[obj.uuid] = obj.material;
        obj.material = this.bloomDarkMaterial;
      }
    }
    function restoreMaterial(obj) {
      if (this.bloomMaterials[obj.uuid]) {
        obj.material = this.bloomMaterials[obj.uuid];
        delete this.bloomMaterials[obj.uuid];
      }
    }
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
    this.finalComposer.setSize(window.innerWidth, window.innerHeight);
  }
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  cleanUp() {
    // Remove the event listener we setup
    window.removeEventListener("resize", this.onWindowResize.bind(this));
    // Remove stuff in the scene as here well
  }
}

export { SceneLobby };
