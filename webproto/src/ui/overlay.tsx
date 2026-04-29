import { render } from "preact";


function Header({ name, open }: { name: string; open: boolean }) {
  return (
    <h2>
      {name}{" "}
      <span class={open?"state state-open":"state state-closed"} >
        {open ? "OPEN" : "CLOSED"}
      </span>
    </h2>
  );
}

function EventSection({ event }: { event: PlaceEvent }) {
  let description: string = event.about2 || "";

  if (description.length > 250) {
    description = description.substring(0, 250) + "<b>...</b>";
  }

  const date = new Date(parseInt(event.dates[0]));

  // @TODO: omit fields if they're missing!

  return (
    <div>
      <h3>{event.title}</h3>
      <p>
        <b>Place:</b> {event.loc1 || event.loc2}
      </p>
      <p>
        <b>At:</b> {date.toLocaleString()}
      </p>
      <p>
        <b>Tickets:</b>{" "}
        <a href={event.tix_url} target="_blank">
          {event.tix_url}
        </a>
      </p>
      <p dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  );
}

export function OpeningHoursList({ hours }: { hours: OpenHours }) {

  // @TODO: translate days to HU?

  return (
    <ul>
      {DAY_ORDER.map((day) => {
        const value = hours[day] ?? hours.default;
        return (
          <li key={day}>
            <strong>{day}:</strong> {value}
          </li>
        );
      })}
    </ul>
  );
}

function PlaceDetails({ place }: {place: Place}) {
  // @TODO: url

  return (
    <div>
      <p>{place.description}</p>

      <b><u>Nyitvatartás:</u></b><br/>
      { (place.open!==null) && (<OpeningHoursList hours={place.open} />) }
    </div>
  );
}
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function OverlayView({ place }: {place: Place}) {
  console.log("@@@ bassar assad", place)
  const hasEvents = place.events != null && place.events.length > 0;
  const event = place.is_open && hasEvents ? place.events[0] : null;

  // @TODO: event name instead of place name?
  // or EventName @PlaceName? & dont render it twice?

  return (
    <div>
      <Header name={place.name} open={place.is_open} />
      {event && <EventSection event={event} />}
      <hr/>
      <PlaceDetails place={place} />
    </div>
  );
}

export function renderPlaceOverlay(place: Place) {
  render(<OverlayView place={place} />, document.getElementById("popup-content") as HTMLElement);
}
