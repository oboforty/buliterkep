
type FeatType = "bar" | "mozi" | "cpx" | "fasza" | "ship" | "frog" | "dolphin" | "corvin";


type DayOfTheWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" | "default";
type OpenHours = {
	[day in DayOfTheWeek]: string;
};

type Place = {
  name: string;
  description: string;
  url: string;
  coord: number[];
  type: FeatType;
  open: {
	[day in DayOfTheWeek]: string
  };
  is_open: boolean;
  events: PlaceEvent[];
};

type PlaceEvent = {
	about1: string;
	loc1: string;
	loc2: string;
	about2: string;
	event_by: string;
	dates: string[];
	tix_url: string;
	time: string;
	id: string;
	title: string;
};