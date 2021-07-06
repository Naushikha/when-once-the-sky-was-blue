class FadeInOutEffect {
  constructor(
    overlayElemID,
    color = "white",
    time = 4000,
    onFadeIn = null,
    onFadeOut = null,
    sfxList = null
  ) {
    this.overlay = document.getElementById(overlayElemID);
    this.color = color;
    this.time = time;
    this.onFadeIn = onFadeIn;
    this.onFadeOut = onFadeOut;
    this.sfxList = sfxList; // We need to fade in the volumes of these guys
    this.animation = new TWEEN.Group(); // Animation
  }
  showEffect() {
    const halfTime = this.time / 2;
    var posVec1 = {
      o: 0,
    };
    var endVec1 = {
      o: 1,
    };
    var fadeIn = new TWEEN.Tween(posVec1, this.animation).to(endVec1, halfTime);
    fadeIn.onUpdate(
      function () {
        this.overlay.style.opacity = posVec1.o;
        if (this.sfxList !== null) {
          for (let sfx of this.sfxList) {
            sfx.setVolume(posVec1.o / 2);
          }
        }
      }.bind(this)
    );
    fadeIn.onComplete(
      function () {
        posVec1.o = 1;
        endVec1.o = 0;
        // Do fadeIn function
        if (this.onFadeIn !== null) {
          this.onFadeIn();
        }
        fadeOut.start();
      }.bind(this)
    );
    var fadeOut = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      halfTime
    );
    fadeOut.onUpdate(
      function () {
        this.overlay.style.opacity = posVec1.o;
        if (this.sfxList !== null) {
          for (let sfx of this.sfxList) {
            sfx.setVolume(1 - posVec1.o / 2);
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
    fadeIn.easing(TWEEN.Easing.Quadratic.InOut);
    fadeOut.easing(TWEEN.Easing.Quadratic.InOut);
    fadeIn.start();
  }
  playEffect() {
    this.overlay.style.backgroundColor = this.color;
    this.overlay.style.opacity = 0; // Just in case
    this.showEffect();
    this.render();
  }
  render() {
    this.renderID = requestAnimationFrame(this.render.bind(this));
    this.animation.update();
  }
}

export { FadeInOutEffect };
