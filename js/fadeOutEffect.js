class FadeOutEffect {
  constructor(
    overlayElemID,
    color = "white",
    time = 4000,
    onFadeOut = null,
    sfxList = null,
    justAudio = false // A fix for the ending
  ) {
    this.overlay = document.getElementById(overlayElemID);
    this.color = color;
    this.time = time;
    this.onFadeOut = onFadeOut;
    this.sfxList = sfxList; // We need to fade in the volumes of these guys
    this.justAudio = justAudio;
    this.animation = new TWEEN.Group(); // Animation
  }
  showEffect() {
    var posVec1 = {
      o: 1,
    };
    var endVec1 = {
      o: 0,
    };
    var fadeOut = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      this.time
    );
    fadeOut.onUpdate(
      function () {
        if (!this.justAudio) {
          this.overlay.style.opacity = posVec1.o;
        }
        if (this.sfxList !== null) {
          for (let sfx of this.sfxList) {
            sfx.volume(posVec1.o);
          }
        }
      }.bind(this)
    );
    fadeOut.onComplete(
      function () {
        cancelAnimationFrame(this.renderID);
        this.renderState = false;
        // Do fadeOut function
        if (this.onFadeOut !== null) {
          this.onFadeOut();
        }
      }.bind(this)
    );
    fadeOut.easing(TWEEN.Easing.Quadratic.InOut);
    fadeOut.start();
  }
  playEffect() {
    this.overlay.style.backgroundColor = this.color;
    if (!this.justAudio) {
      this.overlay.style.opacity = 1; // Just in case
    }
    this.showEffect();
    this.render();
  }
  render() {
    this.renderID = requestAnimationFrame(this.render.bind(this));
    this.animation.update();
  }
}

export { FadeOutEffect };
