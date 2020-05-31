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