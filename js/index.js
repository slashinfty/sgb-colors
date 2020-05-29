document.addEventListener("DOMContentLoaded", () => {
  // create arrays of unique colors for each layer
  // the codes are hex numbers, but we need strings of #dddddd
  colorLookup.forEach(code => {
    for (let i = 0; i < 4; i++) {
      if (code.hasOwnProperty('color')) { // some codes are a single color
        if (!window["color" + (i + 1).toString()].includes('#' + ("00000" + code.color.toString(16)).substr(-6))) window["color" + (i + 1).toString()].push('#' + ("00000" + code.color.toString(16)).substr(-6));
      } else { // some codes vary by layer
        if (!window["color" + (i + 1).toString()].includes('#' + ("00000" + code.colors[i].toString(16)).substr(-6))) window["color" + (i + 1).toString()].push('#' + ("00000" + code.colors[i].toString(16)).substr(-6));
      }
    }
  });
  
  // set the preview image colors to default colors
  let imageEls = document.getElementsByClassName("preview");
  let colorEls = document.getElementsByClassName("jscolor");
  for (let i = 0; i < imageEls.length; i++) imageEls[i].style.filter = filterColor(colorEls[i].jscolor.rgb);

  // set up nearest color functions
  for (let i = 1; i <= 4; i++) window["nearestColor" + i.toString()] = nearestColor.from(window["color" + i.toString()]);

  // get code from url
  // ?sgb=XXXX-XXXX-XXXX
  let url = new URL(window.location.href);
  if (url.searchParams.has('sgb')) {
    let sgbCode = url.searchParams.get('sgb');
    document.getElementById("sgb-code").value = sgbCode;
    if (!/^\d{4}-\d{4}-\d{4}$/.test(sgbCode)) { //check if code is in valid format
      alert(sgbCode + " is not a valid code");
      return;
    } else codeToColor(sgbCode);
  }

});

function deadZone(code) {
  // some codes are the same as code: 704
  let deadRanges = [53, 63, 117, 127, 181, 191, 245, 255, 309, 319, 373, 383, 437, 447, 501, 511, 545, 575, 609, 639, 673, 703, 736, 767, 801, 831, 865, 895, 929, 959, 992, 999];
  // this array is lower bound, upper bound, lower bound, upper bound, etc
  for (let i = 0; i < deadRanges.length; i += 2) {
    if (deadRanges[i] <= code && code <= deadRanges[i + 1]) return 704;
  }
  return code;
}

function duplicateCodes(code) {
  // some codes with layer-specific colors are the same as other codes
  let patternDuplicates = [544, 608, 672, 800, 864, 928];
  if (960 <= code && code <= 991) return code - 256; // the range 960-991 is the same as the range 704-735
  else if (patternDuplicates.includes(code)) return code - 32;
  else return code;
}

function filterColor(rgbArray) {
  // creates CSS filters to approximate layer colors
  let color = new Color(rgbArray[0], rgbArray[1], rgbArray[2]);
  let solver = new Solver(color);
  let result;
  // find approximate color within a certain tolerance
  do result = solver.solve();
  while (result.loss > 5);
  return result.filter;
}

function colorToCodeBtn() {
  let colorEls = document.getElementsByClassName("jscolor");
  let sgbCode = '';
  let nearColors = [];
  for (let i = 0; i < colorEls.length; i++) {
    // get color from input
    let inputColor = colorEls[i].jscolor.toHEXString().toLowerCase();
    // get nearest color
    let nearColor = window["nearestColor" + (i + 1).toString()](inputColor);
    colorEls[i].jscolor.fromString(nearColor);
    nearColors.push(nearColor);
    // find code for color
    let codeObj = colorLookup.find(clr => clr.hasOwnProperty("color") ? nearColor === '#' + ("00000" + clr.color.toString(16)).substr(-6) : clr.colors.indexOf(parseInt(nearColor.substr(1),16)) > -1);
    let code = ("00" + codeObj.value.toString()).substr(-3);
    sgbCode += code;
  }
  // format code and set
  let postCode = sgbCode.substr(0, 4) + "-" + sgbCode.substr(4, 4) + "-" + sgbCode.substr(8, 4);
  document.getElementById("sgb-code").value = postCode;
  // color preview image
  let imageEls = document.getElementsByClassName("preview");
  let hexToRGB = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
  for (let i = 0; i < imageEls.length; i++) imageEls[i].style.filter = filterColor(hexToRGB(nearColors[i]));
  shareLink();
}

function codeToColorBtn() {
  let sgbCode = document.getElementById("sgb-code").value;
  if (!/^\d{4}-\d{4}-\d{4}$/.test(sgbCode)) { //check if code is in valid format
    alert(sgbCode + " is not a valid code");
    return;
  } else codeToColor(sgbCode);
}

function codeToColor(sgb) {
  // break code into components
  let sgbComponents = [parseInt(sgb.substr(0, 3)), parseInt(sgb.substr(3, 1) + sgb.substr(5, 2)), parseInt(sgb.substr(7, 2) + sgb.substr(10, 1)), parseInt(sgb.substr(11, 3))];
  let colorEls = document.getElementsByClassName("jscolor");
  let imageEls = document.getElementsByClassName("preview");
  let hexToRGB = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
  sgbComponents.forEach((component, i) => {
    // find the code and get the color
    let codeObj = colorLookup.find(o => o.value === duplicateCodes(deadZone(component)));
    // set the colors
    let clr = codeObj.hasOwnProperty("color") ? '#' + ("00000" + codeObj.color.toString(16)).substr(-6) : '#' + ("00000" + codeObj.colors[i].toString(16)).substr(-6);
    colorEls[i].jscolor.fromString(clr);
    // color preview image
    imageEls[i].style.filter = filterColor(hexToRGB(clr));
  });
  shareLink();
}

function applyPreset() {
  let presetObj = presetColors.find(preset => preset.value === document.getElementById("presets").value);
  let sgbCode = presetObj.code;
  document.getElementById("sgb-code").value = sgbCode;
  codeToColor(sgbCode);
}

function shareLink() {
  // show link to share
  let p = document.getElementById("share-link");
  p.innerText = "Share your color palette: https://mattbraddock.com/sgb-colors/?sgb=" + document.getElementById("sgb-code").value;
  p.style.display = "block";
}