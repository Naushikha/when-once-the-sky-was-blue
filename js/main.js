import * as THREE from "./lib/three.module.js";
import Stats from "./lib/stats.module.js";
import { SceneLobby } from "./sceneLobby.js";
import { ScenePerf1 } from "./scenePerf1.js";
import { ScenePerf2 } from "./scenePerf2.js";
import { ScenePerf3 } from "./scenePerf3.js";

const dataPath = "./data/";

// First check if the show is open
fetch(`${dataPath}showtimes.json`)
  .then((response) => response.json())
  .then((data) => {
    const showState = data.showState;
    const showtimeOverlay = document.getElementById("showtime-overlay");
    const warning = document.getElementById("showtime-warn");

    switch (showState) {
      case "closed":
        warning.innerHTML =
          "Looks like you missed the showtime. <br> Check back again later.";
        throw new Error("Show's closed bruh.");
        break;
      case "scheduled":
        const timeNowUTC = Math.floor(new Date().getTime() / 1000);
        // Is daily time okay?
        const minsUTC =
          new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
        const dailyStartUTC =
          parseInt(data.dailyTimeStart.split(":")[0]) * 60 +
          parseInt(data.dailyTimeStart.split(":")[1]);
        const dailyEndUTC =
          parseInt(data.dailyTimeStop.split(":")[0]) * 60 +
          parseInt(data.dailyTimeStop.split(":")[1]);
        if (dailyStartUTC <= minsUTC && minsUTC <= dailyEndUTC) {
          showtimeOverlay.style.visibility = "hidden";
          runShow();
          break;
        }
        // If not a daily time then check for dates
        for (let day of data.specificDays) {
          const dateStartUTC = Math.floor(new Date(day[0]).getTime() / 1000);
          const dateEndUTC = Math.floor(new Date(day[1]).getTime() / 1000);
          if (dateStartUTC <= timeNowUTC && timeNowUTC <= dateEndUTC) {
            showtimeOverlay.style.visibility = "hidden";
            runShow();
            break;
          }
        }
        warning.innerHTML = `Looks like you missed the showtime. <br> Check back again later.`;
        throw new Error("Show's closed bruh.");
        break;
      case "open":
        showtimeOverlay.style.visibility = "hidden";
        runShow();
      default:
        break;
    }
  });

// Main entry point to the show
function runShow() {
  const progress = document.getElementById("progress");
  const progressBar = document.getElementById("progress-bar");
  const loadingOverlay = document.getElementById("loading-overlay");
  const startButton = document.getElementById("start-button");
  const fullscrButton = document.getElementById("fullscr-button");

  loadingOverlay.style.visibility = "visible";

  let currentScene = "lobby";

  // Loading manager
  let loadingState = true;
  const manager = new THREE.LoadingManager();
  manager.onProgress = function (item, loaded, total) {
    progressBar.style.width = (loaded / total) * 100 + "%";
    startButton.style.visibility = "hidden";
  };
  manager.onLoad = function () {
    loadingState = false;
    progress.style.display = "none";
    startButton.style.visibility = "visible";
    startButton.style.animation = "fadein 5s";
    // fullscrButton.style.animation = "fadein 5s";

    // Skip play for now
    // currentScene = "perf2";
    // perf2.render();
    // sfxPerf2.play();

    // lobby.render();
    // lobby.play();
    // sfxLobbyBase.play();
    // sfxLobbyVO.play(10);

    // startButton.style.visibility = "hidden";
    // loadingOverlay.style.visibility = "hidden";

    startButton.addEventListener("click", () => {
      lobby.render();
      lobby.play();
      sfxLobbyBase.play();
      sfxLobbyVO.play();
      setTimeout(() => {
        // Enable interaction in lobby after narration
        lobby.interactive = true;
      }, sfxLobbyVO.userData.duration);
      // lobby.interactive = true;

      // currentScene = "perf2";
      // perf2.render();
      // sfxPerf2.play();

      startButton.style.visibility = "hidden";
      loadingOverlay.style.visibility = "hidden";
    });
  };

  // Some nice random loading phrases
  let phrases = [
    "The experience is loading...",
    "Get comfortable.",
    "No distractions.",
    "Don’t forget to breathe",
    "We are getting things ready...",
    "Props are being setup...",
    "Actors are getting ready...",
    "Adjusting placements...",
    "Stage area is ready.",
    "Testing lighting...",
    "Performing sound checks...",
    "Testing the mics...",
    "Turning down the house lights",
    "Narrator is warming up...",
    "Anytime now...",
    "The performance is about to begin",
    "Patience is a virtue.",
  ];
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
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true, // https://discourse.threejs.org/t/using-post-processing-through-effectcomposer-causes-jagged-artifacts-on-model-browser-safari/22918/5
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Setup the audio
  const audioLoader = new THREE.AudioLoader(manager);
  const audioListener = new THREE.AudioListener();
  const sfxLobbyBase = new THREE.Audio(audioListener);
  const sfxLobbyVO = new THREE.Audio(audioListener);
  const sfxPerf1 = new THREE.Audio(audioListener);
  const sfxPerf2 = new THREE.Audio(audioListener);
  const sfxPerf3 = new THREE.Audio(audioListener);
  const sfxPerf1Add = new THREE.Audio(audioListener);
  const sfxPerf2Add = new THREE.Audio(audioListener);
  const sfxPerf3Add = new THREE.Audio(audioListener);
  const sfxPerf3AddB = new THREE.Audio(audioListener);
  audioLoader.load(`${dataPath}sfx/lobby_base.ogg`, function (audioBuffer) {
    sfxLobbyBase.setBuffer(audioBuffer);
    sfxLobbyBase.setLoop(true);
  });
  audioLoader.load(`${dataPath}sfx/lobby_vo.ogg`, function (audioBuffer) {
    sfxLobbyVO.setBuffer(audioBuffer);
    sfxLobbyVO.userData.duration = 80000; // 1:20
  });
  audioLoader.load(`${dataPath}sfx/perf1.ogg`, function (audioBuffer) {
    sfxPerf1.setBuffer(audioBuffer);
  });
  audioLoader.load(`${dataPath}sfx/perf2.ogg`, function (audioBuffer) {
    sfxPerf2.setBuffer(audioBuffer);
  });
  audioLoader.load(`${dataPath}sfx/perf3.ogg`, function (audioBuffer) {
    sfxPerf3.setBuffer(audioBuffer);
  });
  audioLoader.load(`${dataPath}sfx/perf1_add.ogg`, function (audioBuffer) {
    sfxPerf1Add.setBuffer(audioBuffer);
    sfxPerf1Add.setLoop(true);
  });
  audioLoader.load(`${dataPath}sfx/perf2_add.ogg`, function (audioBuffer) {
    sfxPerf2Add.setBuffer(audioBuffer);
    sfxPerf2Add.setLoop(true);
  });
  audioLoader.load(`${dataPath}sfx/perf3_add.ogg`, function (audioBuffer) {
    sfxPerf3Add.setBuffer(audioBuffer);
    sfxPerf3Add.setLoop(true);
  });
  audioLoader.load(
    `${dataPath}sfx/perf3_add_birds.ogg`,
    function (audioBuffer) {
      sfxPerf3AddB.setBuffer(audioBuffer);
      sfxPerf3AddB.setLoop(true);
    }
  );

  // Handle lobby and performance sound pausing/playing
  let perf1Done = false,
    perf2Done = false,
    perf3Done = false;
  function pauseAllLobbySFX() {
    sfxLobbyBase.pause();
    if (perf1Done) sfxPerf1Add.pause();
    if (perf2Done) sfxPerf2Add.pause();
    if (perf3Done) {
      sfxPerf3Add.pause();
      sfxPerf3AddB.pause();
    }
  }
  function playAllLobbySFX() {
    sfxLobbyBase.play();
    if (perf1Done) {
      sfxPerf1.stop();
      sfxPerf1Add.play();
    }
    if (perf2Done) {
      sfxPerf2.stop();
      sfxPerf2Add.play();
    }
    if (perf3Done) {
      sfxPerf3.stop();
      sfxPerf3Add.play();
      sfxPerf3AddB.play();
    }
  }

  // Show FPS stats
  const stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Setup scenes
  const lobby = new SceneLobby(renderer, manager, stats);
  const perf1 = new ScenePerf1(renderer, manager, stats);
  const perf2 = new ScenePerf2(renderer, manager, stats);
  const perf3 = new ScenePerf3(renderer, manager, stats);

  // Set cameras to listen to audio
  lobby.camera.add(audioListener);
  perf1.camera.add(audioListener);
  perf2.camera.add(audioListener);
  perf3.camera.add(audioListener);

  // Set scene callbacks to return to lobby
  perf1.lobbyCallback = switchCallback;
  perf2.lobbyCallback = switchCallback;
  perf3.lobbyCallback = switchCallback;

  // Set cursor for body
  document.body.style.cursor = "url('./data/txt/cursor_grey.png') 16 16, auto";
  startButton.style.cursor = "url('./data/txt/cursor_white.png') 16 16, auto";
  fullscrButton.style.cursor = "url('./data/txt/cursor_white.png') 16 16, auto";
  fullscrButton.addEventListener("click", () => {
    document.documentElement.requestFullscreen();
  });
  document.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      fullscrButton.style.visibility = "hidden";
    } else {
      fullscrButton.style.visibility = "visible";
    }
  });

  function switchCallback(perf) {
    switch (perf) {
      case "lobby":
        perf1.render(false);
        perf2.render(false);
        perf3.render(false);
        // When coming back to lobby the skybox should change based on the perf we were in + add sound
        switch (currentScene) {
          case "perf1":
            lobby.updateSkybox("purple");
            lobby.setFranciTexture(lobby.francis1);
            perf1Done = true;
            break;
          case "perf2":
            lobby.updateSkybox("red");
            lobby.setFranciTexture(lobby.francis2);
            perf2Done = true;
            break;
          case "perf3":
            lobby.updateSkybox("yellow");
            lobby.setFranciTexture(lobby.francis3);
            perf3Done = true;
            break;
          default:
            break;
        }
        playAllLobbySFX();
        lobby.render();
        lobby.cameraPanDown(); // Make camera cool
        lobby.interactive = true; // Make interactive from beginning
        currentScene = "lobby";
        break;
      case "perf1":
        pauseAllLobbySFX();
        sfxPerf1.play();
        lobby.render(false);
        perf1.render();
        currentScene = "perf1";
        break;
      case "perf2":
        pauseAllLobbySFX();
        sfxPerf2.play();
        lobby.render(false);
        perf2.render();
        currentScene = "perf2";
        break;
      case "perf3":
        pauseAllLobbySFX();
        sfxPerf3.play();
        lobby.render(false);
        perf3.render();
        currentScene = "perf3";
        break;
      default:
        break;
    }
  }

  // Handle all the click functions (only franci so far)
  function sceneSwitchMouse() {
    switch (currentScene) {
      case "lobby":
        if (lobby.francis1Hover) {
          lobby.enterPerformance(switchCallback, "perf1");
        } else if (lobby.francis2Hover) {
          lobby.enterPerformance(switchCallback, "perf2");
        } else if (lobby.francis3Hover) {
          lobby.enterPerformance(switchCallback, "perf3");
        }
        break;
      default:
        break;
    }
  }
  document.addEventListener("click", sceneSwitchMouse);

  // Temporary switch to lobby
  function sceneSwitchKey() {
    switch (currentScene) {
      case "perf1":
        switchCallback("lobby");
        break;
      case "perf2":
        switchCallback("lobby");
        break;
      case "perf3":
        switchCallback("lobby");
        break;
      default:
        break;
    }
  }
  function escape(e) {
    if (e.key === "Escape") {
      sceneSwitchKey();
    }
  }
  window.addEventListener("keydown", escape);
}
