import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';

import { fromLonLat } from "ol/proj";
import Style from "ol/style/Style.d.ts";

import { imgStyle, textStyle } from "./layerstyles.ts";
import {eventsStyle, eventsLoad, parseEvent} from "./events.ts";

import { DEBUG } from "./core.ts";


export function placeStyle(place: Place): Style[] {
  return [
    imgStyle(place.type, 0.1),
    textStyle(place.name, {x: 0, y: 24})
  ];
}


const source = new VectorSource<Feature<Point>>();


export const placesLayer = new VectorLayer({
  source,

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


if (!DEBUG.mock) {
  const placesLoad: Promise<Record<string, string>> = fetch('/data/places.json').then(response => {
    if (!response.ok) {
      throw new Error('places.json: network response was nok');
    }
    return response.json();
  }).then((places: Place[]) => {
    const placesMap: Record<string, string> = {}

    for (const place of places) {
      const id = addPlaceFeature(place);
      placesMap[place.name] = id;
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
} else {
  const place = DEBUG.getMockedPlace()
  if (place)
    addPlaceFeature(place);
}


function addPlaceFeature(place: Place): string {
  const {coord} = parsePlace(place);

  const feature = new Feature<Point>({geometry: new Point(fromLonLat(coord))});
  feature.setId(uniqueId(place.name));
  feature.setProperties({
    ...place,
    events: []
  });

  source.addFeature(feature);

  return feature.getId() as string;
}

function parsePlace(place: Place): { coord: number[] } {
  place.is_open = isOpen(place.open);

  let coord = place.coord;
  // if server didn't catch it, correct (lat,lon) input (e.g. gmaps)
  if (coord[0] > coord[1]) coord = [place.coord[1], place.coord[0]]
  // @ts-ignore asd
  delete place.coord;

  return { coord };
}


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

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m; // minutes since midnight
}

export function isOpen(open: OpenHours, now: Date = new Date()): boolean {
  const dayKey = DAY_KEYS[now.getDay()];
  const range = open[dayKey] ?? open.default;

  if (!range) return false;

  const [startStr, endStr] = range.split("-").map(s => s.trim());
  const start = parseTime(startStr);
  const end = parseTime(endStr);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (start <= end) {
    // same-day closing
    return currentMinutes >= start && currentMinutes < end;
  } else {
    // overnight (e.g. 10:00 - 05:00)
    return currentMinutes >= start || currentMinutes < end;
  }
}
