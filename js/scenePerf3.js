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
// Water & sky
import { Water } from "./lib/effects/Water.js";
import { Sky } from "./lib/effects/Sky.js";
// For subtitles
import { SubtitleHandler } from "./subtitleHandler.js";
class ScenePerf3 {
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

    this.setupBloom();

    const lifeRingGeometry = new THREE.TorusGeometry(6, 0.3, 16, 100);
    const lifeRings = [];
    const lifeRingNum = 9;
    const lifeRingSpace = 25; // Space between two life rings
    var lastLifeRingZ = 0;
    var lastLifeRing = lifeRingNum - 1;
    for (let i = 0; i < lifeRingNum; i++) {
      const lifeRingMaterial = new THREE.MeshBasicMaterial({
        color: "rgb(200,200,200)",
        transparent: true,
      });
      const lifeRing = new THREE.Mesh(lifeRingGeometry, lifeRingMaterial);
      lifeRing.layers.toggle(this.BLOOM_SCENE);
      lifeRing.layers.enable(this.BLOOM_SCENE);
      lifeRing.position.y = 10;
      lastLifeRingZ = (i + 1) * lifeRingSpace;
      lifeRing.position.z = lastLifeRingZ;
      this.scene.add(lifeRing);
      lifeRings.push(lifeRing);
    }
    this.lifeRings = lifeRings;
    this.lastLifeRing = lastLifeRing;
    this.lastLifeRingZ = lastLifeRingZ;
    this.lifeRingSpace = lifeRingSpace;
    this.currentLifeRing = 0; // The one that is right infront of us

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader(this.manager).load(
        `${this.dataPath}txt/waternormals.jpg`,
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: this.scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    this.scene.add(water);
    this.water = water;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    this.scene.add(sky);
    this.sky = sky;

    const skyUniforms = sky.material.uniforms;

    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const sunParameters = {
      elevation: 183,
      azimuth: 180,
    };
    this.sunParameters = sunParameters;

    const sun = new THREE.Vector3();
    this.sun = sun;

    this.updateSky();

    this.setupAnimations();

    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    // Load subtitles
    const subHandler = new SubtitleHandler(
      "captions-overlay",
      "instruc",
      "caption"
    );
    subHandler.load(`${this.dataPath}srt/perf3.srt`);
    this.subHandler = subHandler;

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
    this.controls.enabled = false; // Stop this!

    this.camera.position.set(0, 10, 0);
    this.camera.rotation.y = Math.PI;
    this.renderState = false; // We won't be rendering straight away
  }
  setupAnimations() {
    const timeRise = 266000;
    var posVec1 = {
      i: 183,
    };
    var endVec1 = {
      i: 180.5,
    };
    var sunRise = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      timeRise
    );
    sunRise.onUpdate(() => {
      this.sunParameters.elevation = posVec1.i;
      this.updateSky();
    });
    // Move camera till sun rise
    var posVec2 = {
      z: 0,
    };
    var endVec2 = {
      z: 1000,
    };
    var camMove = new TWEEN.Tween(posVec2, this.animation).to(
      endVec2,
      timeRise
    );
    camMove.onUpdate(() => {
      this.camera.position.z = posVec2.z;
      // Did we pass a light ring?
      if (
        this.camera.position.z > this.lifeRings[this.currentLifeRing].position.z
      ) {
        // Send the just passed life ring to the back
        this.lastLifeRingZ += this.lifeRingSpace;
        this.fadeRing(this.lifeRings[this.currentLifeRing]); // Make it fade then glow
        // Set proper count
        if (this.currentLifeRing < this.lifeRings.length - 1) {
          this.currentLifeRing += 1;
        } else {
          this.currentLifeRing = 0;
        }
      }
    });
    this.anim = {
      sunRise: sunRise,
      camMove: camMove,
    };
  }
  glowRing(lifeRing) {
    const glowTime = 5000;
    var posVec1 = {
      i: 0,
    };
    var endVec1 = {
      i: 1,
    };
    var glowy = new TWEEN.Tween(posVec1, this.animation).to(endVec1, glowTime);
    glowy.onUpdate(() => {
      lifeRing.material.opacity = posVec1.i;
    });
    glowy.start();
    lifeRing.material.opacity = 0;
    lifeRing.position.z = this.lastLifeRingZ;
  }
  fadeRing(lifeRing) {
    const fadeTime = 1000;
    var posVec1 = {
      i: 1,
    };
    var endVec1 = {
      i: 0,
    };
    var fady = new TWEEN.Tween(posVec1, this.animation).to(endVec1, fadeTime);
    fady.onUpdate(() => {
      lifeRing.material.opacity = posVec1.i;
    });
    fady.onComplete(() => {
      this.glowRing(lifeRing);
    });
    fady.start();
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
  updateSky() {
    const phi = THREE.MathUtils.degToRad(90 - this.sunParameters.elevation);
    const theta = THREE.MathUtils.degToRad(this.sunParameters.azimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);

    this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
    this.water.material.uniforms["sunDirection"].value
      .copy(this.sun)
      .normalize();
    // const pmremGenerator = new THREE.PMREMGenerator(this.renderer); // This causes memory leaks for some reason
    // this.scene.environment = pmremGenerator.fromScene(this.scene).texture;
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
  play() {
    this.anim.sunRise.start();
    this.anim.camMove.start();
    this.controls.enabled = false;
    this.camera.rotation.y = Math.PI;
    this.subHandler.playSubtitles();
    // Enable controls after 6 secs
    setTimeout(() => {
      this.controls.enabled = true;
      this.controls.lookAt(0, 0, 20000);
    }, 6000);
    // End callback
    this.ending = setTimeout(() => {
      this.lobbyCallback("lobby");
    }, 266000); // End @ 4:26
  }
  renderLoop() {
    this.renderID = requestAnimationFrame(this.renderLoop.bind(this));
    // this.stats.update();
    const delta = this.clock.getDelta();
    this.animation.update();
    if (this.controls.enabled) {
      this.controls.update(delta);
    }
    this.renderBloom();
    this.finalComposer.render();
    // animate water
    this.water.material.uniforms["time"].value += 0.3 / 60.0;
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

export { ScenePerf3 };
