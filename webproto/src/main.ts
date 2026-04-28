import Map from "ol/Map.js";
import Feature from "ol/Feature.d.ts";

import { baseLayers, view } from "./layers/scenes/budapest.ts";
import { placesLayer } from "./layers/places.ts";
import { handlePlaceOverlay, overlay } from "./layers/events.ts";


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


map.addOverlay(overlay)
map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  handlePlaceOverlay(feature as Feature);
});
