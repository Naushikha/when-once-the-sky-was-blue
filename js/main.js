import * as THREE from "./lib/three.module.js";
import Stats from "./lib/stats.module.js";
import { SceneLobby } from "./sceneLobby.js";

const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");

// Loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = function (item, loaded, total) {
  progressBar.style.width = (loaded / total) * 100 + "%";
  progressBar.innerHTML = `Loading ${loaded}/${total}`;
  startButton.style.visibility = "hidden";
};

manager.onLoad = function () {
  progress.style.display = "none";
  overlay.style.visibility = "visible";
  startButton.style.visibility = "visible";
  
  // Skip play for now
  lobby.render();
  lobby.play();
  startButton.style.visibility = "hidden";
  overlay.style.visibility = "hidden";

  startButton.addEventListener("click", () => {
    lobby.render();
    lobby.play();
    startButton.style.visibility = "hidden";
    overlay.style.visibility = "hidden";
  });
};

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
