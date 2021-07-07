import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { FlyControls } from "./lib/FlyControlsRestricted2.js";
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
    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    // Load everything on to the screen -----------------------------------------

    // Skybox
    // http://wwwtyro.github.io/space-3d

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
        const eTxt = new THREE.MeshStandardMaterial({
          color: "rgb(200,0,0)",
        });
        root.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = eTxt;
            // child.material.wireframe = true;
            child.material.needsUpdate = true;
          }
        });
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

    const pointLight1 = new THREE.PointLight(0xffffff, 2, 100);
    this.scene.add(pointLight1);
    pointLight1.position.set(-100, 315, 134);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    this.scene.add(directionalLight1);
    directionalLight1.position.set(-61, 665, 1075);

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Define the controls ------------------------------------------------------
    this.clock = new THREE.Clock(); // Flycontrols need a CLOCK!
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 1;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 25; // 30
    this.controls.enabled = true;
    this.camera.position.set(10, 350, 30);
    this.renderState = false; // We won't be rendering straight away

    this.setupAnimations();
  }
  play() {
    console.log("playing perf1");
  }
  setupAnimations() {
    const timeMove1 = 180000;
    const timeMove2 = 182000;
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
    camMove1.onUpdate(
      function () {
        this.camera.position.set(posVec1.x, posVec1.y, posVec1.z);
        // this.camera.lookAt(-100, 315, 134);
      }.bind(this)
    );
    camMove1.onComplete(function () {
      camMove2.start();
    });
    var camMove2 = new TWEEN.Tween(posVec2, this.animation).to(
      posVec3,
      timeMove2
    );
    camMove2.onUpdate(
      function () {
        this.camera.position.set(posVec2.x, posVec2.y, posVec2.z);
        // this.camera.lookAt(-100, 315, 134);
      }.bind(this)
    );

    camMove1.start();
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
    // this.scene.background = new THREE.Color(0x000000); // Make background black
    this.bloomComposer.render();
    this.scene.traverse(restoreMaterial.bind(this));
    // this.scene.background = this.skyboxTextures[this.currentSkybox]; // Restore background
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
      // this.controls.enabled = true;
      this.renderState = true;
    } else {
      cancelAnimationFrame(this.renderID);
      this.controls.enabled = false;
      this.renderState = false;
    }
  }
  renderLoop() {
    // document.getElementById("test").innerHTML = JSON.stringify(
    //   this.camera.position
    // );
    this.renderID = requestAnimationFrame(this.renderLoop.bind(this));
    const delta = this.clock.getDelta();
    this.animation.update();
    if (this.controls.enabled) {
      this.controls.update(delta);
    }
    this.renderBloom();
    this.finalComposer.render();
    this.stats.update();
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  cleanUp() {
    // Remove the event listener we setup
    window.removeEventListener("resize", this.onWindowResize.bind(this));
    // Remove stuff in the scene as here well
  }
}

export { ScenePerf1 };
