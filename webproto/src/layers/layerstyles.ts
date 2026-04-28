import Style from 'https://esm.sh/ol@10.7.0/style/Style.js';
import Text from 'https://esm.sh/ol@10.7.0/style/Text.js';
import Stroke from 'https://esm.sh/ol@10.7.0/style/Stroke.js';
import Fill from 'https://esm.sh/ol@10.7.0/style/Fill.js';
import Icon from 'https://esm.sh/ol@10.7.0/style/Icon.js';
import CircleStyle from 'https://esm.sh/ol@10.7.0/style/Circle.js';


/*  STYLE CACHE
*/
const styleCache: {[ftype: string]: Style | Style[]} = {};


export function cachedStyle(type: string, hash: string, createStyle: () => Style | Style[]){
  hash = type + "#" + hash;
  if (!styleCache[hash]) {
      styleCache[hash] = createStyle();
  }
  return styleCache[hash];
}


/*  TEXT STYLE
*/
export function textStyle(text: string, pos: {x: number, y: number}) {
  return new Style({
    text: new Text({
      text: text,
      offsetX: pos.x || undefined,
      offsetY: pos.y || undefined,
      font: "16px sans-serif",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000000", width: 3 }),
      textAlign: "center",
    }),
  })
}


export function imgStyle(icon: string, scale: number): Style {
  const stylo: Style = cachedStyle("icons", icon, () => new Style({
    image: new Icon({
      src: `/img/${icon}.png`,
      scale
    }),
  })) as Style;

  return stylo;
}
