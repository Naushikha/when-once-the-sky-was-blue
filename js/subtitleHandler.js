// Passes SRT Subtitles
// https://stackoverflow.com/questions/33145762/parse-a-srt-file-with-jquery-javascript/33147421
class SubtitleHandler {
  constructor(overlayElemID, instructElemID, captionElemID) {
    this.overlay = document.getElementById(overlayElemID);
    this.instruc = document.getElementById(instructElemID);
    this.caption = document.getElementById(captionElemID);
    this.animation = new TWEEN.Group(); // Animation
  }
  async load(url) {
    var parser = (function () {
      var pattern =
        /(\d+)\n([\d:,]+)\s+-{2}\>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/g;
      var _regExp;

      var init = function () {
        _regExp = new RegExp(pattern);
      };
      var parse = function (f) {
        if (typeof f != "string") throw "Sorry, Parser accept string only.";

        var result = [];
        if (f == null) return _subtitles;

        f = f.replace(/\r\n|\r|\n/g, "\n");
        var matches; // Needed to add this one here
        while ((matches = pattern.exec(f)) != null) {
          result.push(toLineObj(matches));
        }
        return result;
      };
      var toLineObj = function (group) {
        // Parse time again
        // Format for time > HH:MM:SS,mmm
        // https://www.regextester.com/
        let timePattern = /([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3})/;
        function giveMilli(match) {
          return (
            parseInt(match[1]) * 360000 +
            parseInt(match[2]) * 60000 +
            parseInt(match[3]) * 1000 +
            parseInt(match[4])
          );
        }
        // Start time
        let match = group[2].match(timePattern);
        let startMilli = giveMilli(match);
        // End time
        match = group[3].match(timePattern);
        let endMilli = giveMilli(match);
        return {
          line: group[1],
          startTime: startMilli,
          endTime: endMilli,
          text: group[4],
        };
      };
      init();
      return {
        parse: parse,
      };
    })();
    return fetch(url)
      .then((response) => response.text())
      .then((srt) => {
        this.subtitles = parser.parse(srt);
        return parser.parse(srt);
      });
  }
  showSubtitle() {
    const sub = this.subtitles[this.currentSub];
    const quarterTime = Math.floor((sub.endTime - sub.startTime) / 10);
    this.caption.innerHTML = sub.text.replace(/\\n/g, "<br/>");
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
        this.caption.style.opacity = posVec1.o;
      }.bind(this)
    );
    fadeIn.onComplete(
      function () {
        posVec1.o = 1;
        endVec1.o = 0;
        fadeOut.start();
      }.bind(this)
    );
    var fadeOut = new TWEEN.Tween(posVec1, this.animation).to(
      endVec1,
      quarterTime
    );
    fadeOut.delay(quarterTime * 8); // Show the subtitle for this long
    fadeOut.onUpdate(
      function () {
        this.caption.style.opacity = posVec1.o;
      }.bind(this)
    );
    fadeOut.onComplete(
      function () {
        if (this.currentSub < this.subtitles.length - 1) {
          const timeUntil =
            this.subtitles[this.currentSub + 1].startTime -
            this.subtitles[this.currentSub].endTime; // time till next sub
          this.currentSub += 1;
          setTimeout(this.showSubtitle.bind(this), timeUntil);
        } else {
          cancelAnimationFrame(this.renderID);
          this.currentSub = 0;
          this.overlay.style.visibility = "hidden";
          this.renderState = false;
        }
      }.bind(this)
    );
    fadeIn.easing(TWEEN.Easing.Quadratic.InOut);
    fadeOut.easing(TWEEN.Easing.Quadratic.InOut);
    fadeIn.start();
  }
  playSubtitles() {
    this.currentSub = 0; // Start from this subtitle
    this.overlay.style.visibility = "visible";
    this.render();
    this.showSubtitle();
  }
  render() {
    this.renderID = requestAnimationFrame(this.render.bind(this));
    this.animation.update();
  }
}

export { SubtitleHandler };
