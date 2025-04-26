# @elexis.js/focus

## Usage
```ts
import 'elexis';
import '@elexis.js/focus';
// create focus controller
const $focus = $.focus();
// add element to focus layer 1
$(document.body).content([
    $('button').use($focus.layer(1).add)
])
```