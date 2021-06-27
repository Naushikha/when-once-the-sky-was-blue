import * as THREE from "./lib/three.module.js";
import { FlyControls } from "./lib/FlyControls.js";
import { MTLLoader } from "./lib/MTLLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";

class Scene1 {
  dataPath = "./data/";
  clock = new THREE.Clock();

  constructor(renderer, manager, stats) {
    this.renderer = renderer;
    this.manager = manager;
    this.stats = stats;
    this.renderState = false;

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
      "txt/skybox_front.png",
      "txt/skybox_back.png",
      "txt/skybox_top.png",
      "txt/skybox_bottom.png",
      "txt/skybox_left.png",
      "txt/skybox_right.png",
    ]);
    this.scene.background = skyboxTextures;

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Setup audio
    const listener = new THREE.AudioListener();
    this.camera.add(listener);
    const audioLoader = new THREE.AudioLoader(manager);
    this.ambienceSFX = new THREE.Audio(listener);
    this.ambienceSFX.load(`${this.dataPath}sfx/lobby.mp3`);

    const mtlLoader = new MTLLoader(manager);

    // var francis1;
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis1 = root;
        this.scene.add(this.francis1);
        this.francis1.position.x = -15;
        this.francis1.position.y = 0;
        this.francis1.scale.set(0.1, 0.1, 0.1);
        this.francis1.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // var francis2;
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis2 = root;
        this.scene.add(this.francis2);
        this.francis2.position.x = 0;
        this.francis2.position.y = 0;
        this.francis2.scale.set(0.1, 0.1, 0.1);
        this.francis2.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // var francis3;
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis3 = root;
        this.scene.add(this.francis3);
        this.francis3.position.x = 15;
        this.francis3.position.y = 0;
        this.francis3.scale.set(0.1, 0.1, 0.1);
        this.francis3.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // var this.francisUs;
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francisUs = root;
        this.scene.add(this.francisUs);
        this.francisUs.position.x = 0;
        this.francisUs.position.y = 0;
        this.francisUs.position.z = 23.9;
        this.francisUs.rotation.y = Math.PI;
        this.francisUs.scale.set(0.1, 0.1, 0.1);
        this.francisUs.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Lighting

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);
    directionalLight1.position.set(50, 35, 0);

    // Francis Animation at the beginning
    var posVec = {
      y: 0,
    };
    var endVec = {
      y: 1,
    };
    this.francAnimUp = new TWEEN.Tween(posVec).to(endVec, 5000);
    this.francAnimUp.onUpdate(
      function () {
        this.francis2.position.y = posVec.y;
      }.bind(this)
    );
    this.francAnimUp.onComplete(function () {
      posVec.y = 1;
      endVec.y = 0;
      francAnimDown.start();
    });
    var francAnimDown = new TWEEN.Tween(posVec).to(endVec, 5000);
    francAnimDown.onUpdate(
      function () {
        this.francis2.position.y = posVec.y;
      }.bind(this)
    );
    francAnimDown.onComplete(
      function () {
        posVec.y = 0;
        endVec.y = 1;
        this.francAnimUp.start();
      }.bind(this)
    );
    this.francAnimUp.easing(TWEEN.Easing.Quadratic.InOut);
    francAnimDown.easing(TWEEN.Easing.Quadratic.InOut);

    // Define the controls ------------------------------------------------------
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 1;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 30;
    this.controls.autoForward = false;
    this.controls.dragToLook = false;
    this.camera.position.set(0, 16.1, 24);
    this.renderState = false; // We won't be rendering straight away
  }
  play() {
    this.ambienceSFX.setLoop(true);
    this.ambienceSFX.play();
    this.francAnimUp.start();
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
    // TWEEN.update();
    this.controls.update(delta);
    this.renderer.render(this.scene, this.camera);
    // this.stats.update();
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

export { Scene1 };
