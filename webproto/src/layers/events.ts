import Overlay from 'ol/Overlay.js';

import { imgStyle, textStyle } from "./layerstyles.ts";
import Style from "ol/style/Style.d.ts";
import Feature from "ol/Feature.d.ts";
import { Point } from "ol/geom.d.ts";


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


// @TODO: refactor -- global control/overlay?
// @TODO: use preact

// Control
const container = document.getElementById('popup') as HTMLElement;
const content = document.getElementById('popup-content') as HTMLElement;
const closer = document.getElementById('popup-closer') as HTMLElement;

export const overlay = new Overlay({
  element: container,
  stopEvent: false,
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

  // @TODO: list all events, render w/ react
  const event = place.events[0] as PlaceEvent;

  const date = new Date(parseInt(event.dates[0]));
  let description: string = event.about2;

  if (description.length > 250) {
    description = description.substring(0, 250) + "<b>...</b>";
  }

  content.innerHTML = `
  <h2>${event.title}</h2>
  <p><b>Place:</b> ${event.loc1 || event.loc2}</p>
  <p><b>At:</b> ${date.toLocaleString()}</p>
  <p><b>Tickets:</b> ${event.tix_url}</p>

  <p>${description}</p>


  <p>${place.open}</p>

  `;
  overlay.panIntoView({ animation: { duration: 200 } });
};
