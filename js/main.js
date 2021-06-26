const dataPath = "./data/";
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");

const clock = new THREE.Clock();

// Loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = function (item, loaded, total) {
  progressBar.style.width = (loaded / total) * 100 + "%";
  progressBar.innerHTML = `Loading ${loaded}/${total}`;
  2;
  startButton.style.visibility = "hidden";
};

manager.onLoad = function () {
  progress.style.display = "none";
  overlay.style.visibility = "visible";
  startButton.style.visibility = "visible";
  startButton.addEventListener("click", () => {
    renderLoop();
    playAudio();
    francAnimUp.start();
    startButton.style.visibility = "hidden";
    overlay.style.visibility = "hidden";
  });
};

// Setting up the scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMapEnabled = true;

// Handle window resizing
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Skybox
// http://wwwtyro.github.io/space-3d

const loader = new THREE.CubeTextureLoader(manager);
loader.setPath(dataPath);

const skyboxTextures = loader.load([
  "txt/skybox_front.png",
  "txt/skybox_back.png",
  "txt/skybox_top.png",
  "txt/skybox_bottom.png",
  "txt/skybox_left.png",
  "txt/skybox_right.png",
]);
scene.background = skyboxTextures;

// Setup audio
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader(manager);
const ambienceSFX = new THREE.Audio(listener);
ambienceSFX.load(`${dataPath}sfx/lobby.mp3`);

function playAudio() {
  ambienceSFX.setLoop(true);
  ambienceSFX.play();
}

const mtlLoader = new THREE.MTLLoader(manager);

var francis1;
mtlLoader.load(`${dataPath}mdl/francis.mtl`, (mtl) => {
  mtl.preload();
  const objLoader = new THREE.OBJLoader(manager);
  objLoader.setMaterials(mtl);
  objLoader.load(`${dataPath}mdl/francis.obj`, (root) => {
    francis1 = root;
    scene.add(francis1);
    francis1.position.x = -15;
    francis1.position.y = 0;
    francis1.scale.set(0.1, 0.1, 0.1);
    // https://stackoverflow.com/questions/15906248/three-js-objloader-obj-model-not-casting-shadows
    francis1.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
  });
});

var francis2;
mtlLoader.load(`${dataPath}mdl/francis.mtl`, (mtl) => {
  mtl.preload();
  const objLoader = new THREE.OBJLoader(manager);
  objLoader.setMaterials(mtl);
  objLoader.load(`${dataPath}mdl/francis.obj`, (root) => {
    francis2 = root;
    scene.add(francis2);
    francis2.position.x = 0;
    francis2.position.y = 0;
    francis2.scale.set(0.1, 0.1, 0.1);
    // https://stackoverflow.com/questions/15906248/three-js-objloader-obj-model-not-casting-shadows
    francis2.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
  });
});

var francis3;
mtlLoader.load(`${dataPath}mdl/francis.mtl`, (mtl) => {
  mtl.preload();
  const objLoader = new THREE.OBJLoader(manager);
  objLoader.setMaterials(mtl);
  objLoader.load(`${dataPath}mdl/francis.obj`, (root) => {
    francis3 = root;
    scene.add(francis3);
    francis3.position.x = 15;
    francis3.position.y = 0;
    francis3.scale.set(0.1, 0.1, 0.1);
    // https://stackoverflow.com/questions/15906248/three-js-objloader-obj-model-not-casting-shadows
    francis3.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
  });
});

var francisUs;
mtlLoader.load(`${dataPath}mdl/francis.mtl`, (mtl) => {
  mtl.preload();
  const objLoader = new THREE.OBJLoader(manager);
  objLoader.setMaterials(mtl);
  objLoader.load(`${dataPath}mdl/francis.obj`, (root) => {
    francisUs = root;
    scene.add(francisUs);
    francisUs.position.x = 0;
    francisUs.position.y = 0;
    francisUs.position.z = 23.9;
    francisUs.rotation.y = Math.PI;
    francisUs.scale.set(0.1, 0.1, 0.1);
    // https://stackoverflow.com/questions/15906248/three-js-objloader-obj-model-not-casting-shadows
    francisUs.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
  });
});

// Lighting

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight1.castShadow = true;
scene.add(directionalLight1);
directionalLight1.position.set(50, 35, 0);

// Controls
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const controls = new THREE.FlyControls(camera, renderer.domElement);
controls.movementSpeed = 300;
controls.domElement = renderer.domElement;
controls.rollSpeed = Math.PI / 30;
controls.autoForward = false;
controls.dragToLook = false;
camera.position.set(0, 16.1, 24);

// let francisAnim = 0;

const renderLoop = function () {
  requestAnimationFrame(renderLoop);
  const delta = clock.getDelta();
  // francis2.position.y += 0.5 * Math.cos(francisAnim * 0.1);

  TWEEN.update();

  controls.update(delta);
  renderer.render(scene, camera);
  // francisAnim += 0.1;
};

// Francis Animation at the beginning
var posVec = {
  y: 0,
};
var endVec = {
  y: 1,
};
var francAnimUp = new TWEEN.Tween(posVec).to(endVec, 5000);
francAnimUp.onUpdate(function () {
  francis2.position.y = posVec.y;
});
francAnimUp.onComplete(function () {
  posVec.y = 1;
  endVec.y = 0;
  francAnimDown.start();
});
var francAnimDown = new TWEEN.Tween(posVec).to(endVec, 5000);
francAnimDown.onUpdate(function () {
  francis2.position.y = posVec.y;
});
francAnimDown.onComplete(function () {
  posVec.y = 0;
  endVec.y = 1;
  francAnimUp.start();
});
francAnimUp.easing(TWEEN.Easing.Quadratic.InOut);
francAnimDown.easing(TWEEN.Easing.Quadratic.InOut);
