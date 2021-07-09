import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { FlyControls } from "./lib/FlyControls.js";
// Lightning imports
import { LightningStorm } from "./lib/effects/LightningStorm.js";
import { EffectComposer } from "./lib/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/postprocessing/RenderPass.js";
import { OutlinePass } from "./lib/postprocessing/OutlinePass.js";
// Bloom (Transition light effect) imports
import { ShaderPass } from "./lib/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "./lib/postprocessing/UnrealBloomPass.js";
// FXAA
import { FXAAShader } from "./lib/postprocessing/shaders/FXAAShader.js";
// For subtitles
import { SubtitleHandler } from "./subtitleHandler.js";
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
      "txt/perf2_sb_front.png",
      "txt/perf2_sb_back.png",
      "txt/perf2_sb_top.png",
      "txt/perf2_sb_bottom.png",
      "txt/perf2_sb_left.png",
      "txt/perf2_sb_right.png",
    ]);
    this.scene.background = skyboxTextures;

    const spaceGeometry = new THREE.SphereGeometry(18, 32, 32);
    const spaceMaterial = new THREE.MeshStandardMaterial({
      color: "rgb(235,127,1)", // 0xeb7f01, // 0xeb4034
      roughness: 0.8,
      metalness: 0.2,
      bumpScale: 0.0005,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(spaceGeometry, spaceMaterial);
    this.scene.add(sphere);
    this.world = sphere;

    // Add lightning
    this.setupLightning();

    this.setupBloom();

    const geometry2 = new THREE.TorusGeometry(4, 0.5, 16, 100); //new THREE.SphereGeometry(4, 32, 32);
    const material2 = new THREE.MeshBasicMaterial({
      color: "rgb(200,200,200)", // 0xeb7f01, // 0xeb4034
    });
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.position.set(0, -18, 0);
    sphere2.layers.toggle(this.BLOOM_SCENE);
    sphere2.layers.enable(this.BLOOM_SCENE);
    sphere2.rotateX(Math.PI / 2);
    this.scene.add(sphere2);
    this.lifeRing = sphere2;

    const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    this.addEmber();
    this.setupAnimations();

    // Load subtitles
    const subHandler = new SubtitleHandler(
      "captions-overlay",
      "instruc",
      "caption"
    );
    subHandler.load(`${this.dataPath}srt/perf2.srt`);
    this.subHandler = subHandler;

    const mainLight = new THREE.PointLight(0xffffff, 7, 50, 2);
    mainLight.position.set(0, -16, 0);
    this.scene.add(mainLight);
    this.mainLight = mainLight;

    this.camera.position.set(0, -10, 0);

    // Define the controls ------------------------------------------------------
    this.clock = new THREE.Clock(); // Flycontrols need a CLOCK!
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 0;
    this.controls.domElement = this.renderer.domElement;
    this.controls.rollSpeed = Math.PI / 25; // 30
    this.controls.enabled = true;
    this.renderState = false; // We won't be rendering straight away
  }
  addEmber() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    const textureLoader = new THREE.TextureLoader(this.manager);

    const sprite1 = textureLoader.load(`${this.dataPath}/txt/ember2.png`);
    const sprite3 = textureLoader.load(`${this.dataPath}/txt/ember1.png`);
    const sprite4 = textureLoader.load(`${this.dataPath}/txt/ember3.png`);
    const sprite5 = textureLoader.load(`${this.dataPath}/txt/ember4.png`);

    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 40 - 20;
      const y = Math.random() * -8000 - 20;
      const z = Math.random() * 40 - 20;

      vertices.push(x, y, z);
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const parameters = [
      [[0.95, 0.1, 0.5], sprite3, 1],
      [[0.9, 0.05, 0.5], sprite1, 1],
      [[0.85, 0, 0.5], sprite5, 1],
      [[0.8, 0, 0.5], sprite4, 1],
    ];

    let pp = [];
    const materials = [];
    for (let i = 0; i < parameters.length; i++) {
      const color = parameters[i][0];
      const sprite = parameters[i][1];
      const size = parameters[i][2];

      materials[i] = new THREE.PointsMaterial({
        size: size,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      });
      materials[i].color.setHSL(color[0], color[1], color[2]);

      const particles = new THREE.Points(geometry, materials[i]);

      particles.material.opacity = 0;
      this.scene.add(particles);
      pp.push(particles);
    }
    this.ember = pp;
  }
  setupAnimations() {
    const breatheTime = 2000; // milliseconds
    const startVal1 = -18, // 7, 8
      endVal1 = -17;
    var posVec1 = {
      i: startVal1,
    };
    var endVec1 = {
      i: endVal1,
    };
    var breatheIn = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      breatheTime
    );
    breatheIn.onUpdate(
      function () {
        this.lifeRing.position.y = posVec1.i;
        // this.mainLight.intensity = posVec1.i;
      }.bind(this)
    );
    breatheIn.onComplete(function () {
      posVec1.i = endVal1;
      endVec1.i = startVal1;
      breatheOut.start();
    });
    var breatheOut = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      breatheTime
    );
    breatheOut.onUpdate(
      function () {
        this.lifeRing.position.y = posVec1.i;
        // this.mainLight.intensity = posVec1.i;
      }.bind(this)
    );
    breatheOut.onComplete(function () {
      posVec1.i = startVal1;
      endVec1.i = endVal1;
      breatheIn.start();
    });
    var colorYellow = {
      r: 235,
      g: 127,
      b: 1,
    };
    var colorRed = {
      r: 235,
      g: 27,
      b: 0,
    };
    var colorBlack = {
      r: 0,
      g: 0,
      b: 0,
    };
    var toRed = new TWEEN.Tween(colorYellow, this.animation).to(
      colorRed,
      10000
    );
    toRed.onUpdate(
      function () {
        this.world.material.color.set(
          `rgb(${Math.floor(colorYellow.r)},${Math.floor(
            colorYellow.g
          )},${Math.floor(colorYellow.b)})`
        );
      }.bind(this)
    );
    toRed.onComplete(function () {});
    var toBlack = new TWEEN.Tween(colorRed, this.animation).to(
      colorBlack,
      10000
    );
    toBlack.onUpdate(
      function () {
        this.world.material.color.set(
          `rgb(${Math.floor(colorRed.r)},${Math.floor(colorRed.g)},${Math.floor(
            colorRed.b
          )})`
        );
      }.bind(this)
    );
    var stopL = {
      d: 0,
    };
    var softL = {
      d: 5,
    };
    var aggressiveL = {
      d: 60, // 60 is max, looks aggressive
    };
    var lGetAggressive = new TWEEN.Tween(softL, this.animation).to(
      aggressiveL,
      20000
    );
    lGetAggressive.onUpdate(
      function () {
        this.storm.dynamic = softL.d;
      }.bind(this)
    );
    var lGetLost = new TWEEN.Tween(aggressiveL, this.animation).to(stopL, 4000);
    lGetLost.onUpdate(
      function () {
        this.storm.dynamic = aggressiveL.d;
      }.bind(this)
    );
    var softE = {
      d: 0,
    };
    var sharpE = {
      d: 0.7, // 1 is max, looks sharp
    };
    var eSlowStart = new TWEEN.Tween(softE, this.animation).to(sharpE, 17000);
    eSlowStart.onUpdate(
      function () {
        this.ember[0].material.opacity = softE.d;
        this.ember[0].position.y += 0.05;
      }.bind(this)
    );
    eSlowStart.onComplete(function () {
      softE.d = 0;
      eMed.start();
    });
    var eMed = new TWEEN.Tween({ null: 0 }, this.animation).to(
      { null: 1 },
      40000
    );
    eMed.onUpdate(
      function () {
        this.ember[0].position.y += 0.07;
      }.bind(this)
    );
    var eIntense = new TWEEN.Tween(softE, this.animation).to(sharpE, 15000);
    eIntense.onUpdate(
      function () {
        this.ember[0].position.y += 0.1;
        this.ember[1].position.y += 0.15;
        this.ember[2].position.y += 0.2;
        this.ember[3].position.y += 0.3;
        this.ember[1].material.opacity = softE.d;
        this.ember[2].material.opacity = softE.d;
        this.ember[3].material.opacity = softE.d;
      }.bind(this)
    );
    eIntense.onComplete(function () {
      softE.d = 0.7;
      sharpE.d = 0; // Ugly way to do this
      eFast.start();
    });
    var eFast = new TWEEN.Tween({ null: 0 }, this.animation).to(
      { null: 1 },
      35000
    );
    eFast.onUpdate(
      function () {
        this.ember[0].position.y += 0.1;
        this.ember[1].position.y += 0.15;
        this.ember[2].position.y += 0.2;
        this.ember[3].position.y += 0.3;
      }.bind(this)
    );
    var eReduce = new TWEEN.Tween(softE, this.animation).to(sharpE, 42000);
    eReduce.onUpdate(
      function () {
        this.ember[0].position.y += 0.06;
        this.ember[1].position.y += 0.08;
        this.ember[2].position.y += 0.1;
        this.ember[3].position.y += 0.15;
        this.ember[0].material.opacity = softE.d;
        this.ember[1].material.opacity = softE.d;
        this.ember[2].material.opacity = softE.d;
        this.ember[3].material.opacity = softE.d;
      }.bind(this)
    );
    // Kill the life ring at the end
    var deadState = {
      i: 1,
    };
    var deadFinally = {
      i: 0,
    };
    var killLifeRing = new TWEEN.Tween(deadState, this.animation).to(
      deadFinally,
      24000
    );
    killLifeRing.onUpdate(
      function () {
        this.lifeRing.material.opacity = deadState.i;
      }.bind(this)
    );

    this.anim = {
      breatheIn: breatheIn,
      toRed: toRed,
      toBlack: toBlack,
      lGetAggressive: lGetAggressive,
      lGetLost: lGetLost,
      eSlowStart: eSlowStart,
      eIntense: eIntense,
      eReduce: eReduce,
      killLifeRing: killLifeRing,
    };
  }
  play() {
    // Life ring animation, start straightaway
    this.anim.breatheIn.start();
    this.subHandler.playSubtitles();
    // Background color animations
    setTimeout(() => {
      this.anim.toRed.start();
    }, 48000); // Start @ 0:48 -> 1:50 = 62
    setTimeout(() => {
      this.anim.toBlack.start();
    }, 150000); // Start @ 2:30 -> 3:03 = 33

    // Lightning animations
    setTimeout(() => {
      this.storm.dynamic = 3;
    }, 6000); // Start @ 0:06
    setTimeout(() => {
      this.anim.lGetAggressive.start();
    }, 20000); // Start @ 0:20 -> 0:40 = 20
    setTimeout(() => {
      this.anim.lGetLost.start();
    }, 40000); // Start @ 0:42 -> 0:46 = 4

    // Ember animations
    // (slowStart -> Med) -> (Intense -> Fast) -> Reduce
    setTimeout(() => {
      this.anim.eSlowStart.start();
    }, 48000); // Start @ 0:48 -> 1:05 = 17
    setTimeout(() => {
      this.anim.eIntense.start();
    }, 105000); // Start @ 1:45 -> 2:00 = 15
    setTimeout(() => {
      this.anim.eReduce.start();
    }, 155000); // Start @ 2:35 -> 3:17 = 42

    // LifeRing die
    setTimeout(() => {
      this.lifeRing.material.transparent = true; // Set transparent first
      this.anim.killLifeRing.start();
    }, 252000); // Start @ 4:12 -> 4:36 = 24

    // End callback
    setTimeout(() => {
      this.lobbyCallback("lobby");
    }, 278000); // End @ 4:38
  }
  setupLightning() {
    this.outlineColor = new THREE.Color(0xffffff);
    const lightningMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
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
      maxLightnings: 60,

      lightningParameters: this.scene.rayParams,

      lightningMaterial: lightningMaterial,
    });
    this.scene.add(storm);
    this.storm = storm;
    window.storm = storm;
    this.composer = new EffectComposer(this.renderer);
    this.composer.passes = [];
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderScene);
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
    this.lightningClock = new THREE.Clock();
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
    this.stats.update();

    // Lightning stuff
    this.renderBloom();
    this.lightningTime += 0.1 * this.lightningClock.getDelta();
    this.storm.update(this.lightningTime);
    this.composer.render();
  }
  setupBloom() {
    this.BLOOM_SCENE = 1; // SEPERATE SCENE FOR BLOOM
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(this.BLOOM_SCENE);
    this.bloomDarkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    this.bloomMaterials = {};
    // this.renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0
    );
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
    // this.finalComposer = new EffectComposer(this.renderer);
    // this.composer.addPass(this.renderScene);
    this.composer.addPass(this.finalPass);

    // FXAA - to solve this jagged problem
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms["resolution"].value.x = 1 / window.innerWidth;
    fxaaPass.material.uniforms["resolution"].value.y = 1 / window.innerHeight;
    this.composer.addPass(fxaaPass);
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

export { ScenePerf2 };
