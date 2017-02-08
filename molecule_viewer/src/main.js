const THREE = require('three');

window.THREE = THREE;

require('webvr-polyfill');

const WGS = require('./vendor/wgs');

window.WGS = WGS;

require('./vendor/firefly');
const nanocore = require('./vendor/nanocore');

window.saveAs = nanocore.saveAs;
window.LZString144 = nanocore.LZString144;
window.md5 = nanocore.md5;
window.noUiSlider = nanocore.noUiSlider;
window.RLE = nanocore.RLE;
window.Sortable = nanocore.Sortable;

require('./vendor/molview');

export default window.Autodesk.$ADSKMOLVIEW;
