import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { LightningStrike } from "./lib/effects/LightningStrike.js";
import { LightningStorm } from "./lib/effects/LightningStorm.js";
import { EffectComposer } from "./lib/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/postprocessing/RenderPass.js";
import { OutlinePass } from "./lib/postprocessing/OutlinePass.js";

class ScenePerf2 {
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

    const geometry = new THREE.SphereGeometry(20, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xeb4034,
      roughness: 0.8,
      metalness: 0.2,
      bumpScale: 0.0005,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    // Add lightning
    this.setupLightning();

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    var startVec1 = {
      r: 255,
      g: 231,
      b: 97,
    };
    var endVec1 = {
      r: 255,
      g: 54,
      b: 54,
    };
    var tmpVec1 = startVec1;
    // var colorChange1 = new TWEEN.Tween(tmpVec1, this.animation).to(
    //   endVec1,
    //   5000
    // );
    // colorChange1.onUpdate(function () {
    //   sphere.material.color.set(
    //     `rgb(${Math.round(tmpVec1.r)},${Math.round(tmpVec1.g)},${Math.round(
    //       tmpVec1.b
    //     )})`
    //   );
    // });
    // colorChange1.onComplete(function () {
    //   let tmp = startVec1;
    //   startVec1 = endVec1;
    //   endVec1 = tmp;
    //   tmpVec1 = startVec1;
    //   colorChange1.start();
    // });
    // colorChange1.easing(TWEEN.Easing.Cubic.InOut);

    // colorChange1.start();

    const light = new THREE.PointLight(0xffffff, 10, 50, 2);
    light.position.set(0, -18, 0);
    this.scene.add(light);

    // Define the controls ------------------------------------------------------
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.camera.position.set(10, 10, 10);
    this.renderState = false; // We won't be rendering straight away
  }
  setupLightning() {
    this.outlineColor = new THREE.Color(0x00ffff);
    const lightningMaterial = new THREE.MeshBasicMaterial({
      color: 0xb0ffff,
    });
    const rayDirection = new THREE.Vector3(0, -1, 0);
    let rayLength = 0;
    const vec1 = new THREE.Vector3();
    const vec2 = new THREE.Vector3();

    this.scene.rayParams = {
      radius0: 0.02, // Change these to make rays look cool
      radius1: 0.01,
      minRadius: 0.01,
      maxIterations: 7,

      timeScale: 0.15,
      propagationTimeFactor: 0.2,
      vanishingTimeFactor: 0.9,
      subrayPeriod: 4,
      subrayDutyCycle: 0.6,

      maxSubrayRecursion: 3,
      ramification: 3,
      recursionProbability: 0.4,

      roughness: 0.85,
      straightness: 0.65,

      sourceOffset: new THREE.Vector3(0, -20, 0),
      destOffset: new THREE.Vector3(0, 20, 0),

      onSubrayCreation: function (
        segment,
        parentSubray,
        childSubray,
        lightningStrike
      ) {
        lightningStrike.subrayConePosition(
          segment,
          parentSubray,
          childSubray,
          0.6,
          0.6,
          0.5
        );

        // Plane projection

        rayLength = lightningStrike.rayParameters.sourceOffset.y;
        vec1.subVectors(
          childSubray.pos1,
          lightningStrike.rayParameters.sourceOffset
        );
        const proj = rayDirection.dot(vec1);
        vec2.copy(rayDirection).multiplyScalar(proj);
        vec1.sub(vec2);
        const scale = proj / rayLength > 0.5 ? rayLength / proj : 1;
        vec2.multiplyScalar(scale);
        vec1.add(vec2);
        childSubray.pos1.addVectors(
          vec1,
          lightningStrike.rayParameters.sourceOffset
        );
      },
    };
    const storm = new LightningStorm({
      size: 30, // Change this to increase size etcccc
      minHeight: 40,
      maxHeight: 40,
      maxSlope: 0.1,
      maxLightnings: 20,

      lightningParameters: this.scene.rayParams,

      lightningMaterial: lightningMaterial,
    });
    this.scene.add(storm);
    this.storm = storm;
    this.composer = new EffectComposer(this.renderer);
    this.composer.passes = [];
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    function createOutline(
      scene,
      objectsArray,
      visibleColor,
      camera,
      composer
    ) {
      const outlinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene,
        camera,
        objectsArray
      );
      outlinePass.edgeStrength = 2.5;
      outlinePass.edgeGlow = 0.7;
      outlinePass.edgeThickness = 2.8;
      outlinePass.visibleEdgeColor = visibleColor;
      outlinePass.hiddenEdgeColor.set(0);
      composer.addPass(outlinePass);
      return outlinePass;
    }
    createOutline(
      this.scene,
      storm.lightningsMeshes,
      this.outlineColor,
      this.camera,
      this.composer
    );
    this.lightningTime = 0;
    this.clock = new THREE.Clock();
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

    // Lightning stuff
    this.lightningTime += 0.1 * this.clock.getDelta();
    this.storm.update(this.lightningTime);
    this.composer.render();
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

export { ScenePerf2 };
