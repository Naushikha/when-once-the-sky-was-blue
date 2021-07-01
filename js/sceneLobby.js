import * as THREE from "./lib/three.module.js";
import { FlyControls } from "./lib/FlyControls.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { MTLLoader } from "./lib/MTLLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";
// For bloom
import { EffectComposer } from "./lib/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/postprocessing/RenderPass.js";
import { ShaderPass } from "./lib/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "./lib/postprocessing/UnrealBloomPass.js";

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
    // http://wwwtyro.github.io/space-3d

    const loader = new THREE.CubeTextureLoader(this.manager);
    loader.setPath(this.dataPath);

    this.currentSkybox = "black";
    const skyboxTextures = {
      black: loader.load([
        "txt/black_sb_front.png",
        "txt/black_sb_back.png",
        "txt/black_sb_top.png",
        "txt/black_sb_bottom.png",
        "txt/black_sb_left.png",
        "txt/black_sb_right.png",
      ]),
      purple: loader.load([
        "txt/purple_sb_front.png",
        "txt/purple_sb_back.png",
        "txt/purple_sb_top.png",
        "txt/purple_sb_bottom.png",
        "txt/purple_sb_left.png",
        "txt/purple_sb_right.png",
      ]),
      red: loader.load([
        "txt/red_sb_front.png",
        "txt/red_sb_back.png",
        "txt/red_sb_top.png",
        "txt/red_sb_bottom.png",
        "txt/red_sb_left.png",
        "txt/red_sb_right.png",
      ]),
      yellow: loader.load([
        "txt/yellow_sb_front.png",
        "txt/yellow_sb_back.png",
        "txt/yellow_sb_top.png",
        "txt/yellow_sb_bottom.png",
        "txt/yellow_sb_left.png",
        "txt/yellow_sb_right.png",
      ]),
    };
    this.scene.background = skyboxTextures[this.currentSkybox];
    this.skyboxTextures = skyboxTextures; // Export this for bloom

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Setup audio
    // const listener = new THREE.AudioListener();
    // this.camera.add(listener);
    // // const audioLoader = new THREE.AudioLoader(manager);
    // this.ambienceSFX = new THREE.Audio(listener);
    // this.ambienceSFX.load(`${this.dataPath}sfx/lobby.mp3`);

    const mtlLoader = new MTLLoader(manager);

    // Francis 1 - Left
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis1 = root;
        this.scene.add(this.francis1);
        this.francis1.position.x = -20;
        this.francis1.rotation.y += Math.PI / 6;
        this.francis1.scale.set(0.1, 0.1, 0.1);
        this.francis1.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Francis 2 - Middle
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis2 = root;
        this.scene.add(this.francis2);
        this.francis2.position.z = -10;
        this.francis2.scale.set(0.1, 0.1, 0.1);
        this.francis2.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Francis 3 - Right
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis3 = root;
        this.scene.add(this.francis3);
        this.francis3.position.x = 20;
        this.francis3.rotation.y -= Math.PI / 6;
        this.francis3.scale.set(0.1, 0.1, 0.1);
        this.francis3.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Francis US
    mtlLoader.load(`${this.dataPath}mdl/francis_white.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francisUs = root;
        this.scene.add(this.francisUs);
        this.francisUs.position.z = 35;
        this.francisUs.rotation.x += Math.PI / 6;
        this.francisUs.scale.set(0.1, 0.1, 0.1);
        this.francisUs.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Arcs for Francis
    const arcTexture = new THREE.TextureLoader(this.manager).load(
      `${this.dataPath}txt/arch.png`
    );
    const arcGeometry = new THREE.PlaneGeometry(20, 40);
    const arcMaterial = new THREE.MeshBasicMaterial({
      map: arcTexture,
      color: 0xcccccc,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const arc1 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc1.position.set(30, 10, -20);
    arc1.rotation.y -= Math.PI / 6;
    this.scene.add(arc1);
    const arc2 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc2.position.set(0, 10, -25);
    this.scene.add(arc2);
    const arc3 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc3.position.set(-30, 10, -20);
    arc3.rotation.y += Math.PI / 6;
    this.scene.add(arc3);

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

    // Lighting

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);
    directionalLight1.position.set(0, 35, 40);

    const francis1SpotLight = new THREE.SpotLight(0xffffff, 0, 40, 0.4);
    francis1SpotLight.position.set(0, 16, 24); // Camera position
    const sp1Target = new THREE.Object3D();
    sp1Target.position.set(-20, 10, 0);
    francis1SpotLight.target = sp1Target;
    this.scene.add(francis1SpotLight);
    this.scene.add(francis1SpotLight.target);
    this.francis1SpotLight = francis1SpotLight;

    const francis2SpotLight = new THREE.SpotLight(0xffffff, 0, 40, 0.33);
    francis2SpotLight.position.set(0, 16, 24); // Camera position
    const sp2Target = new THREE.Object3D();
    sp2Target.position.set(0, 10, 0);
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

    this.setupFrancisAnimations();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener("mousemove", this.onMouseMove.bind(this), false);

    this.statusText = document.getElementById("copy");

    // Define the controls ------------------------------------------------------
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 1;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 30; // 30
    this.controls.autoForward = false;
    this.controls.dragToLook = false;
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.position.set(0, 16, 40);
    this.camera.rotation.x = 3; // To prevent pointing at francis at start
    this.renderState = false; // We won't be rendering straight away
  }
  setupFrancisAnimations() {
    // Francis 1 Animation
    var posVec1 = {
      y: 0.5,
    };
    var endVec1 = {
      y: 0,
    };
    var franc1AnimUp = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      3000
    );
    franc1AnimUp.onUpdate(
      function () {
        this.francis1.position.y = posVec1.y;
      }.bind(this)
    );
    franc1AnimUp.onComplete(function () {
      posVec1.y = 0;
      endVec1.y = 0.5;
      franc1AnimDown.start();
    });
    var franc1AnimDown = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      3000
    );
    franc1AnimDown.onUpdate(
      function () {
        this.francis1.position.y = posVec1.y;
      }.bind(this)
    );
    franc1AnimDown.onComplete(function () {
      posVec1.y = 0.5;
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
      y: 0.5,
    };
    var franc2AnimUp = new TWEEN.Tween(posVec2, this.animation).to(
      endVec2,
      4000
    );
    franc2AnimUp.onUpdate(
      function () {
        this.francis2.position.y = posVec2.y;
      }.bind(this)
    );
    franc2AnimUp.onComplete(function () {
      posVec2.y = 0.5;
      endVec2.y = 0;
      franc2AnimDown.start();
    });
    var franc2AnimDown = new TWEEN.Tween(posVec2, this.animation).to(
      endVec2,
      4000
    );
    franc2AnimDown.onUpdate(
      function () {
        this.francis2.position.y = posVec2.y;
      }.bind(this)
    );
    franc2AnimDown.onComplete(function () {
      posVec2.y = 0;
      endVec2.y = 0.5;
      franc2AnimUp.start();
    });
    franc2AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc2AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 3 Animation
    var posVec3 = {
      y: 0,
    };
    var endVec3 = {
      y: 0.5,
    };
    var franc3AnimUp = new TWEEN.Tween(posVec3, this.animation).to(
      endVec3,
      5000
    );
    franc3AnimUp.onUpdate(
      function () {
        this.francis3.position.y = posVec3.y;
      }.bind(this)
    );
    franc3AnimUp.onComplete(function () {
      posVec3.y = 0.5;
      endVec3.y = 0;
      franc3AnimDown.start();
    });
    var franc3AnimDown = new TWEEN.Tween(posVec3, this.animation).to(
      endVec3,
      5000
    );
    franc3AnimDown.onUpdate(
      function () {
        this.francis3.position.y = posVec3.y;
      }.bind(this)
    );
    franc3AnimDown.onComplete(function () {
      posVec3.y = 0;
      endVec3.y = 0.5;
      franc3AnimUp.start();
    });
    franc3AnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc3AnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    franc1AnimUp.start();
    franc2AnimUp.start();
    franc3AnimUp.start();

    const maxLight = 3;
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
      1000
    );
    franc1AnimLightUp.onUpdate(
      function () {
        if (this.francis1Hover) {
          this.francis1SpotLight.intensity = lightStartVec1.y;
        } else {
          this.franc1AnimLightUp.stop();
          lightEndVec1.y = 0;
          this.franc1AnimLightDown.start();
        }
      }.bind(this)
    );
    franc1AnimLightUp.onComplete(
      function () {
        lightStartVec1.y = maxLight;
        lightEndVec1.y = 0;
        this.francis1Lit = true;
      }.bind(this)
    );
    var franc1AnimLightDown = new TWEEN.Tween(
      lightStartVec1,
      this.animation
    ).to(lightEndVec1, 1000);
    franc1AnimLightDown.onUpdate(
      function () {
        if (this.francis1Hover) {
          this.franc1AnimLightDown.stop();
          lightEndVec1.y = maxLight;
          this.franc1AnimLightUp.start();
        } else {
          this.francis1SpotLight.intensity = lightStartVec1.y;
        }
      }.bind(this)
    );
    franc1AnimLightDown.onComplete(
      function () {
        lightStartVec1.y = 0;
        lightEndVec1.y = maxLight;
        this.francis1Lit = false;
      }.bind(this)
    );
    franc1AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc1AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 2 Animation
    var lightStartVec2 = {
      y: 0, // Doesn't have to be 'y', just put it for now
    };
    var lightEndVec2 = {
      y: maxLight * 1.2,
    };
    var franc2AnimLightUp = new TWEEN.Tween(lightStartVec2, this.animation).to(
      lightEndVec2,
      1000
    );
    franc2AnimLightUp.onUpdate(
      function () {
        if (this.francis2Hover) {
          this.francis2SpotLight.intensity = lightStartVec2.y;
        } else {
          this.franc2AnimLightUp.stop();
          lightEndVec2.y = 0;
          this.franc2AnimLightDown.start();
        }
      }.bind(this)
    );
    franc2AnimLightUp.onComplete(
      function () {
        lightStartVec2.y = maxLight * 1.2;
        lightEndVec2.y = 0;
        this.francis2Lit = true;
      }.bind(this)
    );
    var franc2AnimLightDown = new TWEEN.Tween(
      lightStartVec2,
      this.animation
    ).to(lightEndVec2, 1000);
    franc2AnimLightDown.onUpdate(
      function () {
        if (this.francis2Hover) {
          this.franc2AnimLightDown.stop();
          lightEndVec2.y = maxLight * 1.2;
          this.franc2AnimLightUp.start();
        } else {
          this.francis2SpotLight.intensity = lightStartVec2.y;
        }
      }.bind(this)
    );
    franc2AnimLightDown.onComplete(
      function () {
        lightStartVec2.y = 0;
        lightEndVec2.y = maxLight * 1.2;
        this.francis2Lit = false;
      }.bind(this)
    );
    franc2AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc2AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Francis 3 Animation
    var lightStartVec3 = {
      y: 0, // Doesn't have to be 'y', just put it for now
    };
    var lightEndVec3 = {
      y: maxLight,
    };
    var franc3AnimLightUp = new TWEEN.Tween(lightStartVec3, this.animation).to(
      lightEndVec3,
      1000
    );
    franc3AnimLightUp.onUpdate(
      function () {
        if (this.francis3Hover) {
          this.francis3SpotLight.intensity = lightStartVec3.y;
        } else {
          this.franc3AnimLightUp.stop();
          lightEndVec3.y = 0;
          this.franc3AnimLightDown.start();
        }
      }.bind(this)
    );
    franc3AnimLightUp.onComplete(
      function () {
        lightStartVec3.y = maxLight;
        lightEndVec3.y = 0;
        this.francis3Lit = true;
      }.bind(this)
    );
    var franc3AnimLightDown = new TWEEN.Tween(
      lightStartVec3,
      this.animation
    ).to(lightEndVec3, 1000);
    franc3AnimLightDown.onUpdate(
      function () {
        if (this.francis3Hover) {
          this.franc3AnimLightDown.stop();
          lightEndVec3.y = maxLight;
          this.franc3AnimLightUp.start();
        } else {
          this.francis3SpotLight.intensity = lightStartVec3.y;
        }
      }.bind(this)
    );
    franc3AnimLightDown.onComplete(
      function () {
        lightStartVec3.y = 0;
        lightEndVec3.y = maxLight;
        this.francis3Lit = false;
      }.bind(this)
    );
    franc3AnimLightUp.easing(TWEEN.Easing.Quadratic.InOut);
    franc3AnimLightDown.easing(TWEEN.Easing.Quadratic.InOut);

    this.franc1AnimLightUp = franc1AnimLightUp;
    this.franc1AnimLightDown = franc1AnimLightDown;
    this.franc2AnimLightUp = franc2AnimLightUp;
    this.franc2AnimLightDown = franc2AnimLightDown;
    this.franc3AnimLightUp = franc3AnimLightUp;
    this.franc3AnimLightDown = franc3AnimLightDown;
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
    lookAtBloom.onUpdate(
      function () {
        this.camera.rotation.set(posVec1.x, posVec1.y, posVec1.z);
      }.bind(this)
    );
    // lookAtBloom.onComplete(
    //   function () {
    //     growBloom.start();
    //   }.bind(this)
    // );
    var posVec2 = {
      s: 0,
    };
    var endVec2 = {
      s: 30,
    };
    var growBloom = new TWEEN.Tween(posVec2, this.animation).to(endVec2, 5000);
    growBloom.onUpdate(
      function () {
        this.bloom.scale.setScalar(posVec2.s);
      }.bind(this)
    );
    growBloom.onComplete(
      function () {
        // set bloom to default
        this.bloom.scale.setScalar(0);
        this.blooming = false; // Stop rendering bloom
        switcher(perf); //switch to next perf
      }.bind(this)
    );
    lookAtBloom.easing(TWEEN.Easing.Quadratic.InOut);
    growBloom.easing(TWEEN.Easing.Quadratic.In);

    this.lookAtBloom = lookAtBloom;
    this.lookAtBloom.start();
    growBloom.start();
    this.blooming = true; // Set the render state to blooming
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
  }
  enterPerformance(switcher, perf) {
    this.controls.enabled = false;
    this.setupBloomAnimations(switcher, perf);
    // switcher(perf);
  }
  play() {
    // this.ambienceSFX.setLoop(true);
    // this.ambienceSFX.play();
    // this.franc3AnimUp.start();

    // Pan Down Animation
    this.controls.enabled = false;
    var posVec1 = {
      x: Math.PI / 2,
    };
    var endVec1 = {
      x: -Math.PI / 21,
    };
    var panDown = new TWEEN.Tween(posVec1, this.animation).to(endVec1, 10000);
    panDown.onUpdate(
      function () {
        this.camera.rotation.x = posVec1.x;
      }.bind(this)
    );
    panDown.onComplete(
      function () {
        this.controls.enabled = true;
      }.bind(this)
    );
    panDown.easing(TWEEN.Easing.Cubic.InOut);
    // panDown.start();
    this.controls.enabled = true;
  }
  updateSkybox(skyboxName) {
    // Call from outside to change
    this.currentSkybox = skyboxName;
    this.scene.background = this.skyboxTextures[this.currentSkybox];
  }
  render(state = true) {
    if (state) {
      this.renderLoop();
      this.controls.enabled = true;
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
    }
    this.renderer.render(this.scene, this.camera);
    this.stats.update();

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

    if (francis1Intersects.length && !this.blooming) {
      if (this.francis1Hover == false) this.franc1AnimLightUp.start();
      this.francis1Hover = true;
    } else {
      if (this.francis1Lit == true) this.franc1AnimLightDown.start();
      this.francis1Hover = false;
    }
    if (francis2Intersects.length && !this.blooming) {
      if (this.francis2Hover == false) this.franc2AnimLightUp.start();
      this.francis2Hover = true;
    } else {
      if (this.francis2Lit == true) this.franc2AnimLightDown.start();
      this.francis2Hover = false;
    }
    if (francis3Intersects.length && !this.blooming) {
      if (this.francis3Hover == false) this.franc3AnimLightUp.start();
      this.francis3Hover = true;
    } else {
      if (this.francis3Lit == true) this.franc3AnimLightDown.start();
      this.francis3Hover = false;
    }
    // Set cursor
    if (this.francis1Hover || this.francis2Hover || this.francis3Hover) {
      document.body.style.cursor =
        "url('./data/txt/cursor_white.png') 16 16, auto";
    } else {
      document.body.style.cursor =
        "url('./data/txt/cursor_grey.png') 16 16, auto";
    }
    // this.statusText.innerHTML = JSON.stringify(francis2Intersects);
    this.renderer.render(this.scene, this.camera);

    if (this.blooming) {
      this.renderBloom();
      this.finalComposer.render();
    }
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

    if (this.blooming) {
      this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
      this.finalComposer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  onMouseMove(event) {
    // this.statusText.innerHTML = JSON.stringify(this.mouse);
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
