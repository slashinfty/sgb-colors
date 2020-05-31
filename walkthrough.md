# Walkthrough

## The Idea

I play a lot of Game Boy games, and I have several friends who stream Game Boy games using the Super Game Boy (2, but the color functionality is identical). I had always been curious about how the color palettes work, and what was possible. Thanks to a [GameFAQs guide](https://gamefaqs.gamespot.com/snes/588731-super-game-boy/faqs/58647) by Alice Kojiro, all of the information I needed was there.

## Getting the Data

There was a lot of information in the guide, but it had to be put into a usable format. This was a lot of copying and pasting into a spreadsheet, then using formulas (sometimes over 1000 characters long) to get it in object strings. The results were put into [color.const.js](js/color.const.js), in an array called `colorLookup`. The first 500 code values were the same for each of the layers (of which the GB supports 4), but beyond that, they differed by layer.

```js
const colorLookup = [
  {value: 0, color: 0xFFC0C0},
  {value: 1, color: 0xFFD0FF},
  {value: 2, color: 0xF0C8F0},
  {value: 3, color: 0xFFD8E0},
// lots more
  {value: 704, colors: [0xFFE8CF, 0xDF904F, 0xAF2820, 0x301850]},
  {value: 640, colors: [0xFFF8E0, 0xE0B080, 0xCF686F, 0x6F5080]},
  {value: 768, colors: [0xAFA890, 0x906030, 0x7F181F, 0x1F0030]},
// and lots more
```

Having different names for the properties meant we could use `hasOwnProperty` to know if it was the same for each layer or not.

## Libraries

Looking over the data, it is clear that not every color is possible. One option was to have users pick one of the possible colors, but this was quickly disregarded (side note: layers 1 through 4 support 445, 512, 521, and 452 different colors, repectively). The second option would be for users to submit colors and have it find the color closest to it that the SGB could support. My thought on how to do this would be taking the RGB values and comparing them, finding the one that was the closest for all values. It felt complicated, but doable. Thankfully, I was not the only one to have this idea, as I found the [nearest-color library](https://github.com/dtao/nearest-color). In order to use this, there needed to be an array of colors to compare to and pull from, which means `colorLookup` was not good enough. Rather than create these arrays manually, I opted to have them created upon page load.

```js
document.addEventListener("DOMContentLoaded", () => {
  colorLookup.forEach(code => { // go through all codes
    for (let i = 0; i < 4; i++) {
      if (code.hasOwnProperty('color')) { // some codes are a single color
        if (!window["color" + (i + 1).toString()].includes('#' + ("00000" + code.color.toString(16)).substr(-6))) window["color" + (i + 1).toString()].push('#' + ("00000" + code.color.toString(16)).substr(-6));
      } else { // some codes vary by layer
        if (!window["color" + (i + 1).toString()].includes('#' + ("00000" + code.colors[i].toString(16)).substr(-6))) window["color" + (i + 1).toString()].push('#' + ("00000" + code.colors[i].toString(16)).substr(-6));
      }
    }
  });
  // more functions
});
```

Utilizing `window[string]` to call a variable is extremely helpful for the loops here, since the variables are `color1`, `color2`, etc. I also needed to set up the `nearestColor` class instances for each color, which I also did in `document.addEventListener("DOMContentLoaded", () => {`.

```js
for (let i = 1; i <= 4; i++) window["nearestColor" + i.toString()] = nearestColor.from(window["color" + i.toString()]);
```

Giving users the ability to pick a color easily was desired, and [jscolor](http://jscolor.com/) was an easy to implement library that had the benefit of being able to get and set color values, in multiple formats, very easily.

Last, it would be ideal if users could see their color palette "in action," or, at the very least, a preview still with the colors. Through some research, it seemed like SVGs would be perfect for this, but that proved difficult as there were no SVG images available, and creating them was beyond my skill set. I did stumble across [an answer on StackOverflow](https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991) where someone created classes and a function to find an approximate depiction of the color using CSS filters (as long as the original image was black). I took a still image from an emulator and separated it into four images (based on layer), filled in the content with black, then placed them atop one another in the HTML. Thus, using the classes in [js/color.filter.js](color.filter.js), we can take colors and make the image look like those colors. I modified the function call slightly, as I did not need a lot of the information it displayed, and I set up a do-while loop to ensure we get a result within a certain tolerance.

```js
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
```

## Setup

I wanted to have a preview image for when the site loaded. I went for the grayscale high contrast color palette from the emulator bgb, and set them as the default values in the HTML. I also needed to color the preview image when the site loaded.

```js
let imageEls = document.getElementsByClassName("preview");
let colorEls = document.getElementsByClassName("jscolor");
for (let i = 0; i < imageEls.length; i++) imageEls[i].style.filter = filterColor(colorEls[i].jscolor.rgb);
```

We get all of the HTML elements with the class "preview" as they are the four layers of the image, and the class "jscolor" as they are the colors set. This function illustrates how the filter is set and the filter function called, plus how to get colors from a jscolor element.

## Colors to Code

The big feature here is inputting colors and getting a code to use. This means doing the following:

* Get the colors
* Get the nearest colors for SGB
* Find the corresponding code for the color
* Put the codes together into one code
* Set the code
* Set the preview image

We need a few things set up first. One is an empty string to put the individual codes into (an array would have also been suitable), and the other is an array for the colors that'll be used (so we can set preview image at the end).

```js
let colorEls = document.getElementsByClassName("jscolor");
let sgbCode = '';
let nearColors = [];
```

Looping through the color elements is next, so we can do what we need to with each individual color.

```js
for (let i = 0; i < colorEls.length; i++) {
  // get color from input
  let inputColor = colorEls[i].jscolor.toHEXString().toLowerCase();
  // get nearest color
  let nearColor = window["nearestColor" + (i + 1).toString()](inputColor);
  colorEls[i].jscolor.fromString(nearColor); // this sets the color in the color picker box
  nearColors.push(nearColor);
  // find code for color
  let codeObj = colorLookup.find(clr => clr.hasOwnProperty("color") ? nearColor === '#' + ("00000" + clr.color.toString(16)).substr(-6) : clr.colors.indexOf(parseInt(nearColor.substr(1),16)) > -1); // this ternary operator allows searching the colorLookup array in either color or colors
  let code = ("00" + codeObj.value.toString()).substr(-3);
  sgbCode += code;
  }
```

One trick that is done a few times is `("00" + codeObj.value.toString()).substr(-3)`. This is adding leading zeros, then cutting down to the three digits at the end we care about (or 6 in terms of hexadecimal colors).

Next is formatting the code and setting it.

```js
let postCode = sgbCode.substr(0, 4) + "-" + sgbCode.substr(4, 4) + "-" + sgbCode.substr(8, 4);
document.getElementById("sgb-code").value = postCode;
```

Then coloring the preview image (which could have been done in the previous loop, but I did not feel the need to change it, as this is small enough to not be impacted by another small loop).

```js
let imageEls = document.getElementsByClassName("preview");
let hexToRGB = hex => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}
for (let i = 0; i < imageEls.length; i++) imageEls[i].style.filter = filterColor(hexToRGB(nearColors[i]));
```

The `hexToRGB` function is a quick regex split of a hex color into it's RGB components, which is needed for the `filterColor` function.

## Code to Colors

While this function wasn't as crucial, it was necessary if people were to share codes with one another, and perhaps make small changes. It was relatively easier to implement. Here are the steps:

* Break the code into the four layer codes
* Find the code and get the color
* Set the colors
* Set the preview image

As before, we need a few pieces of information to start.

```js
let sgbComponents = [parseInt(sgb.substr(0, 3)), parseInt(sgb.substr(3, 1) + sgb.substr(5, 2)), parseInt(sgb.substr(7, 2) + sgb.substr(10, 1)), parseInt(sgb.substr(11, 3))];
let colorEls = document.getElementsByClassName("jscolor");
let imageEls = document.getElementsByClassName("preview");
```

This is breaking up the code and getting both the color and image elements from the HTML. The same `hexToRGB` function is defined after this, and probably could have been it's own function considering it was reused.

```js
sgbComponents.forEach((component, i) => {
  // find the code and get the color
  let codeObj = colorLookup.find(o => o.value === duplicateCodes(deadZone(component)));
  // set the colors
  let clr = codeObj.hasOwnProperty("color") ? '#' + ("00000" + codeObj.color.toString(16)).substr(-6) : '#' + ("00000" + codeObj.colors[i].toString(16)).substr(-6);
  colorEls[i].jscolor.fromString(clr);
  // color preview image
  imageEls[i].style.filter = filterColor(hexToRGB(clr));
  });
```

There are two new functions here, `duplicateCodes` and `deadZone`. There are many codes with the same colors as other codes. Rather than add more to the data collection for `color.const.js`, some small functions took care of this, either returning the original code or the code it was a duplicate of.

Getting the color is again done with a ternary operator, and setting colors and images is the same as before.

## Sharing

Being able to share codes easily would increase ease of use. This involved two things: using `URLSearchParams` to automatically load a SGB code stored in the URL, and displaying a link that contained those very parameters.

Back in the `document.addEventListener("DOMContentLoaded", () => {` the following was added at the end:

```js
let url = new URL(window.location.href);
if (url.searchParams.has('sgb')) {
  let sgbCode = url.searchParams.get('sgb');
  document.getElementById("sgb-code").value = sgbCode;
  if (!/^\d{4}-\d{4}-\d{4}$/.test(sgbCode)) { //check if code is in valid format
    alert(sgbCode + " is not a valid code");
    return;
  } else codeToColor(sgbCode);
}
```

If the parameter `?sgb` is found at the end of the URL, then the code is grabbed. If it is invalid, the user is alerted and it doesn't happen.

At the end there is `codeToColor(sgbCode)`. We now have two different ways to generate colors when we have a code: pressing a button and URL parameters. Thus, the code from the previous section is in the `codeToColor` function, and the button only checks the validity of the code before passing it to the `codeToColor` function.

As for providing a URL, there is a `<p>` element with `style="display: none;`. We create a new function that puts text there and displays it to the user (and we have any function that creates a code or breaks it down do it).

```js
function shareLink() {
  // show link to share
  let p = document.getElementById("share-link");
  p.innerText = "Share your color palette: https://mattbraddock.com/sgb-colors/?sgb=" + document.getElementById("sgb-code").value;
  p.style.display = "block";
}
```

## Presets

One thing I really wanted to have was presets for users to pick from, if they wanted some inspiration (I even put a Google Form link at the bottom to get more options from users). This was very simple to implement given everything created thus far. A `<select>` element with a corresponding button is added to the page, and all presets are stored in an array in `color.const.js`. Here's the code involved in applying a preset:

```js
function applyPreset() {
  let presetObj = presetColors.find(preset => preset.value === document.getElementById("presets").value);
  let sgbCode = presetObj.code;
  document.getElementById("sgb-code").value = sgbCode;
  codeToColor(sgbCode);
}
```

Search for the preset, grab the code, run `codeToColor`. Pretty straightforward.