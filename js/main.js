import * as THREE from "./lib/three.module.js";
import Stats from "./lib/stats.module.js";
import { SceneLobby } from "./sceneLobby.js";
import { ScenePerf1 } from "./scenePerf1.js";
import { ScenePerf2 } from "./scenePerf2.js";
import { ScenePerf3 } from "./scenePerf3.js";

import { FadeInOutEffect } from "./fadeInOutEffect.js";
import { FadeOutEffect } from "./fadeOutEffect.js";

import { FadeInAudioEffect } from "./fadeInAudioEffect.js";
import { FadeOutAudioEffect } from "./fadeOutAudioEffect.js";

const dataPath = "./data/";

// First check if the show is open
fetch(`./data/showtimes.json`, { cache: "no-store" })
  // fetch(`https://harshinijk.github.io/showtimes.json`, { cache: "no-store" })
  .then((response) => response.json())
  .then((data) => {
    const showState = data.showState;
    const showtimeOverlay = document.getElementById("showtime-overlay");
    const warning = document.getElementById("showtime-warn");
    const countdown = document.getElementById("showtime-countdown");

    switch (showState) {
      case "closed":
        showtimeOverlay.style.visibility = "visible";
        warning.innerHTML =
          "The performance is currently closed. <br> Check back again later.";
        throw new Error("Show's closed bruh.");
        return;
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
          return;
        }
        // If not a daily time then check for dates
        let tmpNextTime = [];
        for (let day of data.specificDays) {
          const dateStartUTC = Math.floor(new Date(day[0]).getTime() / 1000);
          const dateEndUTC = Math.floor(new Date(day[1]).getTime() / 1000);
          if (dateStartUTC <= timeNowUTC && timeNowUTC <= dateEndUTC) {
            showtimeOverlay.style.visibility = "hidden";
            runShow();
            return;
          }
          tmpNextTime.push(dateStartUTC);
        }
        tmpNextTime = tmpNextTime.filter((x) => {
          return timeNowUTC < x;
        });
        tmpNextTime.sort();
        if (tmpNextTime.length === 0) {
          showtimeOverlay.style.visibility = "visible";
          warning.innerHTML = `The performance is currently closed. <br> Check back again later.`;
          throw new Error("Show's closed bruh.");
          return;
        }
        let tmpNextDay = new Date(tmpNextTime[0] * 1000);
        tmpNextTime = tmpNextTime[0] - timeNowUTC;
        var timerx = setInterval(() => {
          let days = Math.floor(tmpNextTime / (60 * 60 * 24));
          let hours = Math.floor((tmpNextTime % (60 * 60 * 24)) / (60 * 60));
          let minutes = Math.floor((tmpNextTime % (60 * 60)) / 60);
          let seconds = Math.floor(tmpNextTime % 60);

          countdown.innerHTML =
            days +
            " d &nbsp;" +
            hours +
            " h &nbsp;" +
            minutes +
            " m &nbsp;" +
            seconds +
            " s ";

          tmpNextTime -= 1;
          // If the count down is finished, write some text
          if (tmpNextTime < 0) {
            clearInterval(timerx);
            countdown.innerHTML = "Please refresh this page to watch the show.";
          }
        }, 1000);
        showtimeOverlay.style.visibility = "visible";
        warning.innerHTML = `Next showtime is on ${tmpNextDay}`;
        throw new Error("Wait till the show opens bruh.");
        return;
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
    setTimeout(() => {
      startButton.style.visibility = "visible";
      startButton.style.animation = "fadein 5s";
    }, 5000); // This delay is to wait for phrases to disappear

    // Skip play for now
    // currentScene = "perf3";
    // perf3.render();
    // perf3.play();
    // sfxPerf3.play();

    // lobby.render();
    // lobby.play();
    // lobby.interactive = true;
    // sfxLobbyBase.play();
    // sfxLobbyVO.play(8);
    // sfxLobbyBase.play();
    // sfxPerf1Add.play();
    // sfxPerf2Add.play();
    // sfxPerf3Add.play();
    // sfxPerf3AddB.play();
    // setTimeout(() => {
    //   lobby.playEnding([
    //     sfxLobbyBase,
    //     sfxPerf1Add,
    //     sfxPerf2Add,
    //     sfxPerf3Add,
    //     sfxPerf3AddB,
    //   ]);
    // }, 8000);

    // lobby.setFranciTexture(lobby.francis1);
    // lobby.setFranciTexture(lobby.francis2);
    // lobby.setFranciTexture(lobby.francis3);
    // lobby.interactive = true;

    // startButton.style.visibility = "hidden";
    // loadingOverlay.style.visibility = "hidden";

    startButton.addEventListener("click", () => {
      lobby.render();
      setTimeout(() => {
        lobby.play();
        sfxLobbyBase.play();
        sfxLobbyVO.play(8);
        setTimeout(() => {
          // Enable interaction in lobby after narration
          lobby.interactive = true;
        }, sfxLobbyVO.userData.duration + 8000);
        loadingOverlay.style.visibility = "hidden";
      }, 6000);

      loadingOverlay.style.animation = "fadeout 4s forwards";
      startButton.style.visibility = "hidden";
      sfxAmbience.setVolume(0);
      sfxAmbience.play();
      const fI = new FadeInAudioEffect(4000, null, [sfxAmbience]);
      fI.playEffect();
    });
  };

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
  const sfxAmbience = new THREE.Audio(audioListener);
  const sfxLobbyBase = new THREE.Audio(audioListener);
  const sfxLobbyVO = new THREE.Audio(audioListener);
  const sfxPerf1 = new THREE.Audio(audioListener);
  const sfxPerf2 = new THREE.Audio(audioListener);
  const sfxPerf3 = new THREE.Audio(audioListener);
  const sfxPerf1Add = new THREE.Audio(audioListener);
  const sfxPerf2Add = new THREE.Audio(audioListener);
  const sfxPerf3Add = new THREE.Audio(audioListener);
  const sfxPerf3AddB = new THREE.Audio(audioListener);
  const sfxEndingBase = new THREE.Audio(audioListener);
  const sfxEndingVO = new THREE.Audio(audioListener);
  const loadAllAudio = () => {
    audioLoader.load(`${dataPath}sfx/ambience.ogg`, (audioBuffer) => {
      sfxAmbience.setBuffer(audioBuffer);
      sfxAmbience.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/lobby_base.ogg`, (audioBuffer) => {
      sfxLobbyBase.setBuffer(audioBuffer);
      sfxLobbyBase.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/lobby_vo.ogg`, (audioBuffer) => {
      sfxLobbyVO.setBuffer(audioBuffer);
      sfxLobbyVO.userData.duration = 80000; // 1:20
    });
    audioLoader.load(`${dataPath}sfx/perf1.ogg`, (audioBuffer) => {
      sfxPerf1.setBuffer(audioBuffer);
    });
    audioLoader.load(`${dataPath}sfx/perf2.ogg`, (audioBuffer) => {
      sfxPerf2.setBuffer(audioBuffer);
    });
    audioLoader.load(`${dataPath}sfx/perf3.ogg`, (audioBuffer) => {
      sfxPerf3.setBuffer(audioBuffer);
    });
    audioLoader.load(`${dataPath}sfx/perf1_add.ogg`, (audioBuffer) => {
      sfxPerf1Add.setBuffer(audioBuffer);
      sfxPerf1Add.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/perf2_add.ogg`, (audioBuffer) => {
      sfxPerf2Add.setBuffer(audioBuffer);
      sfxPerf2Add.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/perf3_add.ogg`, (audioBuffer) => {
      sfxPerf3Add.setBuffer(audioBuffer);
      sfxPerf3Add.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/perf3_add_birds.ogg`, (audioBuffer) => {
      sfxPerf3AddB.setBuffer(audioBuffer);
      sfxPerf3AddB.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/ending_base.ogg`, (audioBuffer) => {
      sfxEndingBase.setBuffer(audioBuffer);
      sfxEndingBase.setLoop(true);
    });
    audioLoader.load(`${dataPath}sfx/ending_vo.ogg`, (audioBuffer) => {
      sfxEndingVO.setBuffer(audioBuffer);
    });
  };
  loadAllAudio();

  // Handle lobby and performance sound pausing/playing
  let perf1Done = false,
    perf2Done = false,
    perf3Done = false;
  function pauseAllLobbySFX() {
    // Just pause everything
    sfxLobbyBase.pause();
    sfxPerf1Add.pause();
    sfxPerf2Add.pause();
    sfxPerf3Add.pause();
    sfxPerf3AddB.pause();
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
  // document.body.appendChild(stats.domElement);

  // Setup scenes
  const lobby = new SceneLobby(renderer, manager, stats);
  var perf1 = new ScenePerf1(renderer, manager, stats);
  var perf2 = new ScenePerf2(renderer, manager, stats);
  var perf3 = new ScenePerf3(renderer, manager, stats);

  // Set cameras to listen to audio
  lobby.camera.add(audioListener);
  perf1.camera.add(audioListener);
  perf2.camera.add(audioListener);
  perf3.camera.add(audioListener);

  // Set scene callbacks to return to lobby
  perf1.lobbyCallback = switchCallback;
  perf2.lobbyCallback = switchCallback;
  perf3.lobbyCallback = switchCallback;

  function switchCallback(perf) {
    const sfxList = [
      sfxLobbyBase,
      sfxPerf1Add,
      sfxPerf2Add,
      sfxPerf3Add,
      sfxPerf3AddB,
    ];
    const onFadeOut = () => {
      currentScene = "lobby";
    };
    var fIO; // FadeInOut
    var fO; // FadeOut
    switch (perf) {
      case "lobby":
        // When coming back to lobby the skybox should change based on the perf we were in + add sound
        switch (currentScene) {
          case "perf1":
            perf1.render(false);
            perf1 = null; // Clear up memory
            perf1Done = true;
            playAllLobbySFX();
            fIO = new FadeInOutEffect(
              "transition-overlay",
              "white",
              8000,
              () => {
                lobby.updateSkybox("purple");
                lobby.setFranciTexture(lobby.francis1);
                lobby.render();
                lobby.cameraPanDown(true); // Make camera cool
              },
              onFadeOut,
              sfxList // To vary audio with fading
            );
            fIO.playEffect();
            break;
          case "perf2":
            perf2.render(false);
            perf2 = null; // Clear up memory
            perf2Done = true;
            playAllLobbySFX();
            fIO = new FadeInOutEffect(
              "transition-overlay",
              "white",
              8000,
              () => {
                lobby.updateSkybox("red");
                lobby.setFranciTexture(lobby.francis2);
                lobby.render();
                lobby.cameraPanDown(true); // Make camera cool
              },
              onFadeOut,
              sfxList // To vary audio with fading
            );
            fIO.playEffect();
            break;
          case "perf3":
            perf3.render(false);
            perf3 = null; // Clear up memory
            perf3Done = true;
            playAllLobbySFX();
            fIO = new FadeInOutEffect(
              "transition-overlay",
              "white",
              8000,
              () => {
                lobby.updateSkybox("yellow");
                lobby.setFranciTexture(lobby.francis3);
                lobby.render();
                lobby.cameraPanDown(true); // Make camera cool
              },
              onFadeOut,
              sfxList // To vary audio with fading
            );
            fIO.playEffect();
            break;
          default:
            break;
        }
        // Play end scene if all perfs are done
        if (perf1Done && perf2Done && perf3Done) {
          // Fade out ambience first
          const fO = new FadeOutAudioEffect(8000, null, [sfxAmbience]);
          fO.playEffect();
          setTimeout(() => {
            sfxEndingBase.play();
            sfxEndingVO.play();
            lobby.endingSubHandler.playSubtitles();
            setTimeout(() => {
              lobby.playEnding(sfxList); // Pass in the sfx to fade them out after credits
            }, 2000);
          }, 32000);
        }
        break;
      case "perf1":
        lobby.render(false);
        perf1.render();
        fO = new FadeOutEffect(
          "transition-overlay",
          "white",
          5000,
          () => {
            pauseAllLobbySFX();
            sfxPerf1.play();
            perf1.play(); // Play the effects
            currentScene = "perf1";
          },
          sfxList // To vary audio with fading
        );
        fO.playEffect();
        break;
      case "perf2":
        lobby.render(false);
        perf2.render();
        fO = new FadeOutEffect(
          "transition-overlay",
          "white",
          5000,
          () => {
            pauseAllLobbySFX();
            sfxPerf2.play();
            perf2.play(); // Play the effects
            currentScene = "perf2";
          },
          sfxList // To vary audio with fading
        );
        fO.playEffect();
        break;
      case "perf3":
        lobby.render(false);
        perf3.render();
        fO = new FadeOutEffect(
          "transition-overlay",
          "white",
          5000,
          () => {
            pauseAllLobbySFX();
            sfxPerf3.play();
            perf3.play(); // Play the effects
            currentScene = "perf3";
          },
          sfxList // To vary audio with fading
        );
        fO.playEffect();
        break;
      default:
        break;
    }
  }

  // Handle all the click functions (only franci so far)
  function sceneSwitchMouse() {
    switch (currentScene) {
      case "lobby":
        if (lobby.francis1Hover && lobby.francis1.userData.perfPending) {
          lobby.francis1Hover = false; // Quick fix for multiple clicks bug
          lobby.enterPerformance(switchCallback, "perf1");
        } else if (lobby.francis2Hover && lobby.francis2.userData.perfPending) {
          lobby.francis2Hover = false; // Quick fix for multiple clicks bug
          lobby.enterPerformance(switchCallback, "perf2");
        } else if (lobby.francis3Hover && lobby.francis3.userData.perfPending) {
          lobby.francis3Hover = false; // Quick fix for multiple clicks bug
          lobby.enterPerformance(switchCallback, "perf3");
        }
        break;
      default:
        break;
    }
    // Quick fix for multiple clicks bug
    document.body.style.cursor =
      "url('./data/txt/cursor_grey.png') 16 16, auto";
  }
  document.addEventListener("click", sceneSwitchMouse);

  // Temporary switch to lobby
  function sceneSwitchKey() {
    switch (currentScene) {
      case "perf1":
        perf1.subHandler.stopSubtitles();
        clearTimeout(perf1.ending);
        switchCallback("lobby");
        break;
      case "perf2":
        perf2.subHandler.stopSubtitles();
        clearTimeout(perf2.ending);
        switchCallback("lobby");
        break;
      case "perf3":
        perf3.subHandler.stopSubtitles();
        clearTimeout(perf3.ending);
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
