import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";

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

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Define the controls ------------------------------------------------------
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.camera.position.set(10, 20, 30);
    this.renderState = false; // We won't be rendering straight away
  }
  render(state = true) {
    if (state) {
      this.transition(255, 255, 255, 1, 0, 0, 0, 0); // Do transition animation
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
    this.animation.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
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
  transition(sR, sG, sB, sA, eR, eG, eB, eA) {
    const transitionOverlay = document.getElementById("transition-overlay");
    var posVec1 = {
      r: sR,
      g: sG,
      b: sB,
      a: sA,
    };
    var endVec1 = {
      r: eR,
      g: eG,
      b: eB,
      a: eA,
    };
    var transitionAni = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      4000
    );
    transitionAni.onUpdate(function () {
      transitionOverlay.style.background = `rgba(${posVec1.r}, ${posVec1.g}, ${posVec1.b}, ${posVec1.a})`;
    });
    transitionAni.easing(TWEEN.Easing.Cubic.InOut);
    transitionAni.start();
  }
}

export { ScenePerf1 };
