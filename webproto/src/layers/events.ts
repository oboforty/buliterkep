import Feature from "ol/Feature.d.ts";
import { Point } from "ol/geom.d.ts";
import Overlay from 'ol/Overlay.js';
import Style from "ol/style/Style.d.ts";

import { imgStyle, textStyle } from "./layerstyles.ts";
import { renderPlaceOverlay } from "../ui/overlay.tsx";


export function eventsStyle(events: PlaceEvent[], place: Place): Style[] {
  // @TODO: sort -- most recently started or latest?
  const event = events[0];

  return [
    imgStyle("mozi", 0.1),
    textStyle(event.title, {x: 0, y: 24})
  ]
}


export const eventsLoad: Promise<PlaceEvent[]> = fetch('/data/events.json').then(response => {
  if (!response.ok) {
    throw new Error('events.json: network response was nok');
  }
  return response.json();
});

export function parseEvent(event: PlaceEvent) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const randomHour = 18 + Math.floor(Math.random() * 4);
  today.setHours(randomHour, 0, 0, 0);
  const timestamp = Math.floor(today.getTime() / 1000)
  
  event.dates = [timestamp.toString()]
}


// @TODO: @GEO: put all of this overlay logic into a library 

// Control
const container = document.getElementById('popup') as HTMLElement;
// const content = document.getElementById('popup-content') as HTMLElement;
const closer = document.getElementById('popup-closer') as HTMLElement;


export const overlay = new Overlay({
  element: container,
  stopEvent: true,
  autoPan: false,
});
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


export function handlePlaceOverlay(feature: Feature) {
  if (feature==null) {
    overlay.setPosition([0,0]);
    return;
  }

  overlay.setPosition((feature.getGeometry() as Point).getCoordinates());

  const place = feature.getProperties() as Place;
  renderPlaceOverlay(place);

  overlay.panIntoView({ animation: { duration: 200 } });
};
