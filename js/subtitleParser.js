// Passes SRT Subtitles
// https://stackoverflow.com/questions/33145762/parse-a-srt-file-with-jquery-javascript/33147421

async function loadSubtitle(url) {
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
      return parser.parse(srt);
    });
}

export { loadSubtitle };
