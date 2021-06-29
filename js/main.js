import * as THREE from "./lib/three.module.js";
import Stats from "./lib/stats.module.js";
import { SceneLobby } from "./sceneLobby.js";

const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const loadingOverlay = document.getElementById("loading-overlay");
const startButton = document.getElementById("start-button");

let loadingState = true;
let phrases = [
  "The experience is loading...",
  "Get comfortable.",
  "No distractions.",
  "We are getting things ready...",
  "Props are being setup...",
  "Adjusting placements...",
  "Stage area is ready.",
  "Testing lighting...",
  "Performing sound checks...",
  "Narrator is warming up...",
  "Anytime now...",
  "Patience is a virtue.",
];
// Loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = function (item, loaded, total) {
  progressBar.style.width = (loaded / total) * 100 + "%";
  // progressBar.innerHTML = `Loading ${loaded}/${total}`;
  startButton.style.visibility = "hidden";
};

manager.onLoad = function () {
  loadingState = false;
  progress.style.display = "none";
  loadingOverlay.style.visibility = "visible";
  startButton.style.visibility = "visible";
  startButton.style.animation = "fadein 5s";

  // Skip play for now
  // lobby.render();
  // lobby.play();
  // startButton.style.visibility = "hidden";
  // loadingOverlay.style.visibility = "hidden";

  startButton.addEventListener("click", () => {
    lobby.render();
    lobby.play();
    startButton.style.visibility = "hidden";
    loadingOverlay.style.visibility = "hidden";
  });
};

let phraseCount = 0;
function showPhrases() {
  const phrase = document.getElementById("phrase");
  if (!loadingState) {
    phrase.visibility = false;
    return;
  }
  if (phraseCount == phrases.length) {
    phraseCount = 0;
  }
  phrase.innerHTML = phrases[phraseCount];
  phrase.classList.remove("run-animation");
  void phrase.offsetWidth;
  phrase.classList.add("run-animation");
  phraseCount++;
  setTimeout(showPhrases, 5000);
}

setTimeout(showPhrases, 18000);

// Setup the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Show FPS stats
const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.top = "0px";
document.body.appendChild(stats.domElement);

// Setup a scene
const lobby = new SceneLobby(renderer, manager, stats);

document.body.style.cursor = "url('../data/txt/cursor_grey.png') 16 16, auto";
startButton.style.cursor = "url('../data/txt/cursor_white.png') 16 16, auto";

// startButton.classList.add("cursor-grey");
