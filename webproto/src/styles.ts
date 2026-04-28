import Feature from "https://esm.sh/ol@10.7.0/Feature.d.ts";

import Style from 'https://esm.sh/ol@10.7.0/style/Style.js';
import Text from 'https://esm.sh/ol@10.7.0/style/Text.js';
import Icon from 'https://esm.sh/ol@10.7.0/style/Icon.js';
import CircleStyle from 'https://esm.sh/ol@10.7.0/style/Circle.js';
import Stroke from 'https://esm.sh/ol@10.7.0/style/Stroke.js';
import Fill from 'https://esm.sh/ol@10.7.0/style/Fill.js';

import { FeatType } from "./layers/scenes/core.ts";
import { FLAGS } from "./layers/scenes/core.ts";



const ICON_SIZE = 40;

// --- style cache
// @ts-ignore: i just couldn't give a shit
const styleCache: {[ftype in FeatType]: Style | Style[]} = {};

export function textStyle(text: string, pos: {x: number, y: number}) {
  return new Style({
    text: new Text({
      text: text,
      offsetX: pos.x || undefined,
      offsetY: pos.y || undefined,
      font: "32px sans-serif",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000000", width: 3 }),
      textAlign: "center",
    }),
  })
}


export function placeStyle(feature: Feature) {
  const type: FeatType = feature.get("map_type") ?? "bar";
  const name: string = feature.get("name") ?? "????";
  const iconLoc = `./img/${type}.png`;

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

  // Return combined array: cached icon + per-feature text
  // @ts-ignore idc, array does have iterator
  return [...styleCache[type], textStyle(name, {x: 0, y: ICON_SIZE / 2 + 14})];
}


export function eventStyle(feature: Feature) {
  return [
    new Style({
      image: new CircleStyle({
        radius: 14,
        fill: new Fill({ color: "rgba(255,255,255,0.9)" }),
        stroke: new Stroke({ color: "#333", width: 4 }),
      })
    })
  ];
}

export const debugStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: "rgba(255,255,255,0.9)" }),
    stroke: new Stroke({ color: "#333", width: 3 }),
  })
});

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
