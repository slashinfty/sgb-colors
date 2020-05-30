# sgb-colors
An online tool to generate Super Game Boy color palette codes using hex colors (and break codes into their hex color components).

## About

[This GameFAQs guide](https://gamefaqs.gamespot.com/snes/588731-super-game-boy/faqs/58647) explains how SGB codes are broken down and all RGB color values. Using this, a list of codes and their colors was [generated and stored](js/color.const.js). Converting a SGB code into the corresponding color values was trivial with a lookup function. However, converting individual colors into a SGB code required a bit more work, as the SGB can not display every RGB color combination. Thus the [nearest color library](https://github.com/dtao/nearest-color) was implemented to take an inputted color and find the closest match that the SGB could use (which varies, to some degree, per layer). Once an acceptable color for the SGB is selected, a lookup function is again used to find the corresponding code.

The image preview, taken from Super Mario Land 2: 6 Golden Coins, is updated with very similar colors to allow users to see their creations. The image itself is four .png files, broken up by layer, and filled in with black ([see here](img)). The colors are applied using a creative application of CSS filters; the foundation is found in [it's own JavaScript file](js/color.filter.js), and explained [from the source](https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991).
