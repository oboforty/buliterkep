import VectorLayer from "https://esm.sh/ol@10.7.0/layer/Vector.js";
import VectorSource from "https://esm.sh/ol@10.7.0/source/Vector.js";

import Feature from 'https://esm.sh/ol@10.7.0/Feature.js';
import Point from 'https://esm.sh/ol@10.7.0/geom/Point.js';

import { imgStyle, textStyle } from "./layerstyles.ts";
import { fromLonLat } from "ol/proj";
import { DEBUG } from "./scenes/core.ts";

type DayOfTheWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type Place = {
  name: string;
  description: string;
  url: string;
  coord: number[];
  type: FeatType;
  open: {
    [day in DayOfTheWeek]: string
  };
};


export function placeStyle(feature: Feature) {
  const name: string = feature.get("name") ?? "????";
  const icon: string = feature.get("type") ?? "bar";

  return [
    imgStyle(icon, 0.1),
    textStyle(name, {x: 0, y: 24})
  ];
}

export const placesLayer = new VectorLayer({
  source: new VectorSource(),
  style: placeStyle,
  visible: !DEBUG.hide.has("places"),
});


fetch('/data/places.json')
.then(response => {
  if (!response.ok) {
    throw new Error('places.json: network response was nok');
  }
  return response.json();
})
.then(places => {
  // merge places and places
  console.log("@@ Loaded places:", places, "places:", places.features);

  // @TODO: resolve on both places & events

  const src = placesLayer.getSource();

  places.map((place: Place) => {
    let coord = place.coord;
    // if server didn't catch it, correct (lat,lon) input (e.g. gmaps)
    if (coord[0] > coord[1]) coord = [place.coord[1], place.coord[0]]
    // @ts-ignore asd
    delete place.coord;

    const feature = new Feature({geometry: new Point(fromLonLat(coord))});
    feature.setId(uniqueId(place.name));
    feature.setProperties({...place});

    src?.addFeature(feature);
    console.info("Loaded place ", place)
  });

});


// @TODO: move?
function hashStringShort(input: string): string {
  let hash = 5381;

  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }

  return (hash >>> 0).toString(36);
}

function uniqueId(input: string): string {
    return hashStringShort(input) + '.' + Math.round(Math.random()*1000).toString();
}