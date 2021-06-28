import * as THREE from "./lib/three.module.js";
import { FlyControls } from "./lib/FlyControls.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { MTLLoader } from "./lib/MTLLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";

class SceneLobby {
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
    // const listener = new THREE.AudioListener();
    // this.camera.add(listener);
    // // const audioLoader = new THREE.AudioLoader(manager);
    // this.ambienceSFX = new THREE.Audio(listener);
    // this.ambienceSFX.load(`${this.dataPath}sfx/lobby.mp3`);

    const mtlLoader = new MTLLoader(manager);

    // Francis 1 - Left
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis1 = root;
        this.scene.add(this.francis1);
        this.francis1.position.x = -13;
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
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
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
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francis3 = root;
        this.scene.add(this.francis3);
        this.francis3.position.x = 13;
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
    mtlLoader.load(`${this.dataPath}mdl/francis.mtl`, (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(mtl);
      objLoader.load(`${this.dataPath}mdl/francis.obj`, (root) => {
        this.francisUs = root;
        this.scene.add(this.francisUs);
        this.francisUs.position.z = 19;
        this.francisUs.rotation.x += Math.PI / 6;
        this.francisUs.scale.set(0.1, 0.1, 0.1);
        this.francisUs.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
      });
    });

    // Load the arcs for francis
    const arcTexture = new THREE.TextureLoader(this.manager).load(
      `${this.dataPath}txt/arch.png`
    );
    const arcGeometry = new THREE.PlaneGeometry(13, 23);
    const arcMaterial = new THREE.MeshBasicMaterial({
      map: arcTexture,
      color: 0xcccccc,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const arc1 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc1.position.set(15, 10, -2);
    arc1.rotation.y -= Math.PI / 6;
    this.scene.add(arc1);
    const arc2 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc2.position.set(0, 10, -16);
    this.scene.add(arc2);
    const arc3 = new THREE.Mesh(arcGeometry, arcMaterial);
    arc3.position.set(-15, 10, -2);
    arc3.rotation.y += Math.PI / 6;
    this.scene.add(arc3);

    // Lighting

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);
    directionalLight1.position.set(50, 35, 0);

    const spotLight = new THREE.SpotLight(0xffffff, 4, 30, 0.8);
    spotLight.position.set(15, 5, 5);
    const spPos = new THREE.Object3D();
    spPos.position.set(15, 20, 0);
    spotLight.target = spPos;
    // spotLight.castShadow = true;
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    this.setupFrancisAnimations();

    // Define the controls ------------------------------------------------------
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 1;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 10; // 30
    this.controls.autoForward = false;
    this.controls.dragToLook = false;
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.position.set(0, 16.1, 24);
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
    var franc1AnimUp = new TWEEN.Tween(posVec1).to(endVec1, 3000);
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
    var franc1AnimDown = new TWEEN.Tween(posVec1).to(endVec1, 3000);
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
    var franc2AnimUp = new TWEEN.Tween(posVec2).to(endVec2, 4000);
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
    var franc2AnimDown = new TWEEN.Tween(posVec2).to(endVec2, 4000);
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
    var franc3AnimUp = new TWEEN.Tween(posVec3).to(endVec3, 5000);
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
    var franc3AnimDown = new TWEEN.Tween(posVec3).to(endVec3, 5000);
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
  }
  play() {
    // this.ambienceSFX.setLoop(true);
    // this.ambienceSFX.play();
    // this.franc3AnimUp.start();
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
    TWEEN.update();
    this.controls.update(delta);
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
}

export { SceneLobby };
