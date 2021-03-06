import * as THREE from "./lib/three.module.js";
// import { OrbitControls } from "./lib/OrbitControls.js";
import { FirstPersonControls } from "./lib/FirstPersonControls.js";
// Bloom (Transition light effect) imports
import { EffectComposer } from "./lib/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/postprocessing/RenderPass.js";
import { ShaderPass } from "./lib/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "./lib/postprocessing/UnrealBloomPass.js";
// FXAA
import { FXAAShader } from "./lib/postprocessing/shaders/FXAAShader.js";
// Loading earth
import { MTLLoader } from "./lib/MTLLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";
// Subtitles
import { SubtitleHandler } from "./subtitleHandler.js";

class ScenePerf1 {
  dataPath = "./data/";
  lobbyCallback;

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
    window.addEventListener("resize", this.onWindowResize, false);

    // Load everything on to the screen -----------------------------------------

    // Skybox
    const loader = new THREE.CubeTextureLoader(this.manager);
    loader.setPath(this.dataPath);

    const skyboxTextures = loader.load([
      "txt/black_sb_front.png",
      "txt/black_sb_back.png",
      "txt/black_sb_top.png",
      "txt/black_sb_bottom.png",
      "txt/black_sb_left.png",
      "txt/black_sb_right.png",
    ]);
    this.scene.background = skyboxTextures;

    const mtlLoader = new MTLLoader(manager);

    mtlLoader.load(`${this.dataPath}mdl/earth_compressed.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/earth_compressed.obj`, (root) => {
        root.scale.set(4, 4, 4);
        this.scene.add(root);
        root.position.y = 0.1;
        const eTxt = new THREE.MeshStandardMaterial({
          color: "rgb(255,255,255)",
        });
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = eTxt;
            child.material.wireframe = true;
            child.material.needsUpdate = true;
          }
        });
        this.earth = root;
      });
    });

    mtlLoader.load(`${this.dataPath}mdl/earth_compressed.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/earth_compressed.obj`, (root) => {
        root.scale.set(4, 4, 4);
        this.scene.add(root);
        const eTxt = new THREE.MeshStandardMaterial({
          color: "rgb(50,50,50)", // color: "rgb(50,50,50)",
        });
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = eTxt;
            child.material.transparent = true;
            child.material.needsUpdate = true;
          }
        });
        this.earth2 = root;
      });
    });

    this.setupBloom();

    const lifeRingGeometry = new THREE.TorusGeometry(20, 1, 16, 100);
    const lifeRingMaterial = new THREE.MeshBasicMaterial({
      color: "rgb(200,200,200)",
      transparent: true,
    });
    const lifeRing = new THREE.Mesh(lifeRingGeometry, lifeRingMaterial);
    lifeRing.layers.toggle(this.BLOOM_SCENE);
    lifeRing.layers.enable(this.BLOOM_SCENE);
    lifeRing.rotation.x += Math.PI / 2;
    lifeRing.position.set(-100, 315, 134);
    this.scene.add(lifeRing);
    const pointLight1 = new THREE.PointLight(0xffffff, 8, 100);
    this.scene.add(pointLight1);
    pointLight1.position.set(-100, 315, 134);
    this.lifeRing = lifeRing;
    this.lifeRingLight = pointLight1;

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    this.scene.add(directionalLight1);
    directionalLight1.position.set(-61, 665, 1075);

    this.setupAnimations();

    // Load subtitles
    const subHandler = new SubtitleHandler(
      "captions-overlay",
      "instruc",
      "caption"
    );
    subHandler.load(`${this.dataPath}srt/perf1.srt`);
    this.subHandler = subHandler;

    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    // Define the controls ------------------------------------------------------
    this.clock = new THREE.Clock(); // FPSControls need a CLOCK!
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new FirstPersonControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.movementSpeed = 0;
    this.controls.lookSpeed = 0.017;
    this.controls.domElement = this.renderer.domElement;
    this.controls.enabled = false;

    this.camera.position.set(650, 82, -132);
    this.controls.lookAt(192, 170, -285);
    this.renderState = false; // We won't be rendering straight away
  }
  play() {
    this.controls.enabled = false;
    this.anim.camMove1.start();
    this.anim.breatheIn.start();
    this.subHandler.playSubtitles();
    // Enable controls after 6 secs
    setTimeout(() => {
      this.controls.enabled = true;
      this.controls.lookAt(192, 170, -285);
    }, 6000);
    // Wireframe, white to red
    setTimeout(() => {
      this.anim.wfWhite.start();
    }, 155000); // Start @ 2:35 -> 4:08 = 93
    //Increase bloom
    setTimeout(() => {
      this.anim.bloomUp.start();
    }, 275000); // Start @ 4:35 -> 5:05 = 30
    // Decrease bloom
    setTimeout(() => {
      this.anim.bloomDown.start();
    }, 310000); // Start @ 5:10 -> 5:26 = 16
    // Stop light ring breathing
    setTimeout(() => {
      this.lifeRingDone = true;
    }, 248000); // End @ 4:08

    // End callback
    this.ending = setTimeout(() => {
      this.lobbyCallback("lobby");
    }, 364000); // End @ 6:04
  }
  setupAnimations() {
    const timeMove1 = 180000;
    const timeMove2 = 182000;
    const timeWF = 6000;
    var posVec1 = {
      x: 650,
      y: 82,
      z: -132,
    };
    var posVec2 = {
      x: 192,
      y: 170,
      z: -285,
    };
    var posVec3 = {
      x: -100,
      y: 315,
      z: 134,
    };
    var camMove1 = new TWEEN.Tween(posVec1, this.animation).to(
      posVec2,
      timeMove1
    );
    camMove1.onUpdate(() => {
      this.camera.position.set(posVec1.x, posVec1.y, posVec1.z);
    });
    camMove1.onComplete(() => {
      camMove2.start();
    });
    var camMove2 = new TWEEN.Tween(posVec2, this.animation).to(
      posVec3,
      timeMove2
    );
    camMove2.onUpdate(() => {
      this.camera.position.set(posVec2.x, posVec2.y, posVec2.z);
    });
    // Transition the Earth
    var trans1 = {
      r: 255,
      g: 255,
      b: 255,
    };
    var trans2 = {
      r: 255,
      g: 0,
      b: 0,
    };
    var wfWhite = new TWEEN.Tween(trans1, this.animation).to(trans2, timeWF);
    wfWhite.onUpdate(() => {
      this.earth.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.color.set(
            `rgb(${Math.floor(trans1.r)},${Math.floor(trans1.g)},${Math.floor(
              trans1.b
            )})`
          );
          child.material.needsUpdate = true;
        }
      });
    });
    // Life ring breathe
    const breatheTime = 2000; // milliseconds
    const startVal1 = 1,
      endVal1 = 0.2;
    const startVal2 = 8,
      endVal2 = 1;
    var breatheVec1 = {
      i: startVal1,
      l: startVal2,
    };
    var breatheVec2 = {
      i: endVal1,
      l: endVal2,
    };
    var breatheIn = new TWEEN.Tween(breatheVec1, this.animation).to(
      breatheVec2,
      breatheTime
    );
    breatheIn.onUpdate(() => {
      if (this.lifeRingDone) {
        this.lifeRing.material.opacity = startVal1;
        this.lifeRingLight.intensity = startVal2;
        breatheIn.stop();
        breatheOut.stop();
      }
      this.lifeRing.material.opacity = breatheVec1.i;
      this.lifeRingLight.intensity = breatheVec1.l;
    });
    breatheIn.onComplete(() => {
      breatheVec1.i = endVal1;
      breatheVec2.i = startVal1;
      breatheVec1.l = endVal2;
      breatheVec2.l = startVal2;
      breatheOut.start();
    });
    var breatheOut = new TWEEN.Tween(breatheVec1, this.animation).to(
      breatheVec2,
      breatheTime
    );
    breatheOut.onUpdate(() => {
      this.lifeRing.material.opacity = breatheVec1.i;
      this.lifeRingLight.intensity = breatheVec1.l;
    });
    breatheOut.onComplete(() => {
      breatheVec1.i = startVal1;
      breatheVec2.i = endVal1;
      breatheVec1.l = startVal2;
      breatheVec2.l = endVal2;
      breatheIn.start();
    });
    var bloom1 = {
      n: 1,
    };
    var bloom2 = {
      n: 5,
    };
    var bloom3 = {
      n: 1,
    };
    var bloomUp = new TWEEN.Tween(bloom1, this.animation).to(bloom2, 30000);
    bloomUp.onUpdate(() => {
      this.bloomPass.strength = Number(bloom1.n);
    });
    var bloomDown = new TWEEN.Tween(bloom2, this.animation).to(bloom3, 16000);
    bloomDown.onUpdate(() => {
      this.bloomPass.strength = Number(bloom2.n);
    });

    this.anim = {
      camMove1: camMove1,
      wfWhite: wfWhite,
      breatheIn: breatheIn,
      bloomUp: bloomUp,
      bloomDown: bloomDown,
    };
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
  renderBloom() {
    this.scene.traverse(darkenNonBloomed.bind(this));
    this.bloomComposer.render();
    this.scene.traverse(restoreMaterial.bind(this));
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
  render(state = true) {
    if (state) {
      this.renderLoop();
      this.renderState = true;
    } else {
      cancelAnimationFrame(this.renderID);
      this.controls.enabled = false;
      this.renderState = false;
      this.cleanUp();
    }
  }
  renderLoop() {
    this.renderID = requestAnimationFrame(this.renderLoop.bind(this));
    const delta = this.clock.getDelta();
    this.animation.update();
    if (this.controls.enabled) {
      this.controls.update(delta);
    }
    this.renderBloom();
    this.finalComposer.render();
    // this.stats.update();
  }
  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  cleanUp() {
    // Remove the event listener we setup
    window.removeEventListener("resize", this.onWindowResize, false);
    // Remove stuff in the scene as here well
    function clearThree(obj) {
      while (obj.children.length > 0) {
        clearThree(obj.children[0]);
        obj.remove(obj.children[0]);
      }
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        //in case of map, bumpMap, normalMap, envMap ...
        Object.keys(obj.material).forEach((prop) => {
          if (!obj.material[prop]) return;
          if (
            obj.material[prop] !== null &&
            typeof obj.material[prop].dispose === "function"
          )
            obj.material[prop].dispose();
        });
        obj.material.dispose();
      }
    }
    clearThree(this.scene);
    this.scene = null;
    this.camera = null;
    this.controls = null;
  }
}

export { ScenePerf1 };
