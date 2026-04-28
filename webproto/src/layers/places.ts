import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';

import { imgStyle, textStyle } from "./layerstyles.ts";
import { fromLonLat } from "ol/proj";
import { DEBUG } from "./scenes/core.ts";
import Style from "ol/style/Style.d.ts";

import {eventsStyle, eventsLoad, parseEvent} from "./events.ts";


export function placeStyle(place: Place): Style[] {
  return [
    imgStyle(place.type, 0.1),
    textStyle(place.name, {x: 0, y: 24})
  ];
}

export const placesLayer = new VectorLayer({
  source: new VectorSource(),
  // @ts-ignore asd
  style: (feature: Feature) => {
    const place = feature.getProperties() as Place;

    const events: PlaceEvent[] = feature.get("events") ?? [];
    if (events.length > 0)
      return eventsStyle(events, place);
    return placeStyle(place);
  },
  visible: !DEBUG.hide.has("places"),
});


export const placesLoad: Promise<Record<string, string>> = fetch('/data/places.json').then(response => {
  if (!response.ok) {
    throw new Error('places.json: network response was nok');
  }
  return response.json();
}).then((places: Place[]) => {
  const src = placesLayer.getSource();
  const placesMap: Record<string, string> = {}

  for (const place of places) {
    let coord = place.coord;
    // if server didn't catch it, correct (lat,lon) input (e.g. gmaps)
    if (coord[0] > coord[1]) coord = [place.coord[1], place.coord[0]]
    // @ts-ignore asd
    delete place.coord;

    const feature = new Feature({geometry: new Point(fromLonLat(coord))});
    feature.setId(uniqueId(place.name));
    feature.setProperties({
      ...place,
      events: []
    });

    src?.addFeature(feature);
    placesMap[place.name] = feature.getId() as string;
    console.log(feature.getProperties())
  };

  // console.info("Loaded places")
  return placesMap;
});


Promise.all([placesLoad, eventsLoad]).then(([featureIds, events])=>{
  const src = placesLayer.getSource();

  for (const event of events) {
    const id = featureIds[event.loc1] || featureIds[event.loc2];
    if (!id) {
      console.warn("No found place for event: ", event.title, event.loc1, event.loc2, "--");
      return;
    }
    const feature = src?.getFeatureById(id);
    if (!feature) {
      console.warn("No found place for event: ", event.title, id, "--", event);
      return;
    }

    parseEvent(event);
    feature.get("events").push(event);
  }
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
