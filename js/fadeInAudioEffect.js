class FadeInAudioEffect {
  constructor(time = 4000, onFadeIn = null, sfxList = null) {
    this.time = time;
    this.onFadeIn = onFadeIn;
    this.sfxList = sfxList; // We need to fade in the volumes of these guys
    this.animation = new TWEEN.Group(); // Animation
  }
  showEffect() {
    var posVec1 = {
      o: 0,
    };
    var endVec1 = {
      o: 1,
    };
    var fadeIn = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      this.time
    );
    fadeIn.onUpdate(
      function () {
        if (this.sfxList !== null) {
          for (let sfx of this.sfxList) {
            sfx.volume(posVec1.o);
          }
        }
      }.bind(this)
    );
    fadeIn.onComplete(
      function () {
        cancelAnimationFrame(this.renderID);
        this.renderState = false;
        // Do fadeIn function
        if (this.onFadeIn !== null) {
          this.onFadeIn();
        }
      }.bind(this)
    );
    fadeIn.easing(TWEEN.Easing.Quadratic.InOut);
    fadeIn.start();
  }
  playEffect() {
    this.showEffect();
    this.render();
  }
  render() {
    this.renderID = requestAnimationFrame(this.render.bind(this));
    this.animation.update();
  }
}

export { FadeInAudioEffect };
