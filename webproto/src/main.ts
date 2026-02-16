import Map from 'https://esm.sh/ol@10.7.0/Map.js';
import View from 'https://esm.sh/ol@10.7.0/View.js';

import OSM from 'https://esm.sh/ol@10.7.0/source/OSM.js';
import TileLayer from 'https://esm.sh/ol@10.7.0/layer/Tile.js';
import VectorLayer from 'https://esm.sh/ol@10.7.0/layer/Vector.js';
import VectorSource from 'https://esm.sh/ol@10.7.0/source/Vector.js';

import Feature from 'https://esm.sh/ol@10.7.0/Feature.js';
import Point from 'https://esm.sh/ol@10.7.0/geom/Point.js';
import { fromLonLat } from 'https://esm.sh/ol@10.7.0/proj.js';

import Style from 'https://esm.sh/ol@10.7.0/style/Style.js';
import Text from 'https://esm.sh/ol@10.7.0/style/Text.js';
import Icon from 'https://esm.sh/ol@10.7.0/style/Icon.js';
import CircleStyle from 'https://esm.sh/ol@10.7.0/style/Circle.js';
import Stroke from 'https://esm.sh/ol@10.7.0/style/Stroke.js';
import Fill from 'https://esm.sh/ol@10.7.0/style/Fill.js';

import Overlay from 'https://esm.sh/ol@10.7.0/Overlay.js';


// --- DEMO - bundled map features
import data from './features.json' with { type: 'json' };

type FeatType = "bar" | "cin" | "cpx" | "cas" | "leg";

const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');



const ICON_SIZE = 64;

const ICONS: {[ftype in FeatType]: string} = {
  bar: 'fish',
  cin: 'evil-eye',
  cpx: 'armor',
  cas: 'magic-star',
  leg: 'unicorn'
};

// --- style cache
// @ts-ignore: i just couldn't give a shit
const styleCache: {[ftype in FeatType]: Style | Style[]} = {};


type ServerFeature = {
  coord: number[],
  name: string,
  type: FeatType,
}


function featureStyle(feature: Feature) {
  const type: FeatType = feature.get("map_type") ?? "bar";
  const name: string = feature.get("name") ?? "????";
  const iconLoc = `./img/zodiac/${ICONS[type]}.png`;

  // Cache only static parts: circular border + icon
  if (!styleCache[type]) {
    const maskedIcon = createCircularIcon(iconLoc, ICON_SIZE);

    styleCache[type] = [
      new Style({
        image: new CircleStyle({
          radius: ICON_SIZE / 2,
          fill: new Fill({ color: "rgba(255,255,255,0.9)" }),
          stroke: new Stroke({ color: "#333", width: 4 }),
        }),
      }),
      new Style({
        image: new Icon({
          img: maskedIcon,
          anchor: [0.5, 0.5],
          width: ICON_SIZE,
          height: ICON_SIZE,
        }),
      }),
    ];
  }

  // Text label must be unique per feature — do not cache
  const textStyle = new Style({
    text: new Text({
      text: name,
      offsetY: ICON_SIZE / 2 + 14,
      font: "32px sans-serif",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000000", width: 3 }),
      textAlign: "center",
    }),
  });

  // Return combined array: cached icon + per-feature text
  return [...styleCache[type], textStyle];
}


function createCircularIcon(src: string, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.src = src;

  img.onload = () => {
    ctx.clearRect(0, 0, size, size);

    // clip to circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // draw image inside clipped circle
    ctx.drawImage(img, 0, 0, size, size);
  };

  return canvas;
}


// --- create features from JSON
const features = data.features.map((f: ServerFeature) => {
  let coord = f.coord;

  // if server didn't catch it, correct (lat,lon) input (e.g. gmaps)
  if (coord[0] > coord[1])
    coord = [f.coord[1], f.coord[0]]

  const feature = new Feature({
    geometry: new Point(fromLonLat(coord)),
  });
  feature.setId(f.name);
  feature.setProperties({
    name: f.name,
    map_type: f.type,
  });

  return feature;
});

// --- vector layer
const vectorLayer = new VectorLayer({
  source: new VectorSource({
    features,
  }),
  style: featureStyle,
});

// --- map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  view: new View({
    center: fromLonLat([19.0553, 47.497372]),
    zoom: 15,
  }),
});

// debug
globalThis.map = map;


const overlay = new Overlay({
  element: container,
  stopEvent: false,
  autoPan: false,
});
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};
map.addOverlay(overlay)


map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  if (feature) {
    overlay.setPosition(evt.coordinate);
    content.innerHTML = `
    <h2>${feature.get("name")}</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    `;
    overlay.panIntoView({
      animation: {
        duration: 200,
      },
    });
  } else {
    // @TODO: idk how to hide
    overlay.setPosition([0,0]);
  }
});
