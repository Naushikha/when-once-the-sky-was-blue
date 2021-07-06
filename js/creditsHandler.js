// Simple credits loader
class CreditsHandler {
  constructor(overlayElemID, titleElemID, nameElemID) {
    this.overlay = document.getElementById(overlayElemID);
    this.title = document.getElementById(titleElemID);
    this.name = document.getElementById(nameElemID);
    this.animation = new TWEEN.Group(); // Animation
  }
  async load(url) {
    function parseCredits(csv) {
      const lines = csv.slice(0, -1).split("\n");
      let credits = [];
      for (let line of lines) {
        const parts = line.split(",");
        credits.push({
          title: parts[0],
          name: parts[1].replace(/\|/g, "<br/>"), // Replace | to go to newline
        });
      }
      return credits;
    }
    return fetch(url)
      .then((response) => response.text())
      .then((csv) => {
        let credits = parseCredits(csv);
        this.credits = credits;
        return credits;
      });
  }
  showCredit() {
    const quarterTime = 5000 / 4; // Duration of a credit display
    var posVec1 = {
      o: 0,
    };
    var endVec1 = {
      o: 1,
    };
    var fadeIn = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      quarterTime
    );
    fadeIn.onUpdate(
      function () {
        this.title.style.opacity = posVec1.o;
        this.name.style.opacity = posVec1.o;
      }.bind(this)
    );
    fadeIn.onComplete(function () {
      posVec1.o = 1;
      endVec1.o = 0;
      fadeOut.start();
    });
    var fadeOut = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      quarterTime
    );
    fadeOut.delay(quarterTime * 2); // Show the subthis.title for this long
    fadeOut.onUpdate(
      function () {
        this.title.style.opacity = posVec1.o;
        this.name.style.opacity = posVec1.o;
      }.bind(this)
    );
    fadeOut.onComplete(
      function () {
        if (this.currentCredit < this.credits.length) {
          this.currentCredit += 1;
          this.title.innerHTML = this.credits[this.currentCredit].title;
          this.name.innerHTML = this.credits[this.currentCredit].name;
          setTimeout(this.showCredit.bind(this), quarterTime);
        } else {
          cancelAnimationFrame(this.renderID);
          this.currentCredit = 0;
          this.overlay.style.visibility = "hidden";
          this.renderState = false;
        }
      }.bind(this)
    );
    fadeIn.easing(TWEEN.Easing.Quadratic.InOut);
    fadeOut.easing(TWEEN.Easing.Quadratic.InOut);
    fadeIn.start();
  }
  playCredits() {
    // console.log(this.credits);
    this.currentCredit = 0; // Start from this subtitle
    this.overlay.style.visibility = "visible";
    this.title.innerHTML = this.credits[0].title;
    this.name.innerHTML = this.credits[0].name;
    this.render();
    this.showCredit();
  }
  render() {
    this.renderID = requestAnimationFrame(this.render.bind(this));
    this.animation.update();
  }
}

export { CreditsHandler };
