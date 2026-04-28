import TileLayer from "ol/layer/Tile.js";
import TileImageSource from "ol/source/TileImage.js";
import OSM from "ol/source/OSM.js";

import View from "ol/View.js";

import Layer from "ol/layer/Layer.d.ts";

import { fromLonLat } from "ol/proj.js";
import { DEBUG } from "./core.ts";


export const baseLayers: { [key: string]: Layer } = {
  bud_base: new TileLayer({
    source: new OSM(),
  })
}


const viewParams: any = {
  center: fromLonLat([19.0553, 47.497372]),
  extent: [
    ...fromLonLat([18.880463, 47.351850]),
    ...fromLonLat([19.324493, 47.694666])
  ],

  minZoom: 13,
  zoom: 15,
  maxZoom: 18,
}
if (DEBUG.debug.has("view")) {
  delete viewParams.extent;
  delete viewParams.minZoom;
  delete viewParams.maxZoom;
}

export const view = new View(viewParams);
