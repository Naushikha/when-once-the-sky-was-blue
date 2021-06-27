import * as THREE from "./lib/three.module.js";
import Stats from "./lib/stats.module.js";
import { Scene1 } from "./scene1.js";

const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");

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
    scene1.render();
    scene1.play();
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
const scene1 = new Scene1(renderer, manager, stats);
