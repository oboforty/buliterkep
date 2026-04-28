import Map from "ol/Map.js";

import { baseLayers, view } from "./layers/scenes/budapest.ts";
import { placesLayer } from "./layers/places.ts";


const map = new Map({
  layers: [
    ...Object.values(baseLayers),
    placesLayer,
  ],
  target: 'map',
  // controls: ol.control.defaults({
  //   attributionOptions: {
  //     collapsible: false
  //   }
  // }),
  view,
});


// debug
globalThis.map = map;
globalThis.view = map.getView();
