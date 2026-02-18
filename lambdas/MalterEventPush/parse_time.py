import re
from datetime import datetime, timedelta
from typing import Generator

WEEKDAYS = {
	"monday": 0,
	"tuesday": 1,
	"wednesday": 2,
	"thursday": 3,
	"friday": 4,
	"saturday": 5,
	"sunday": 6,
}

MONTHS = {
	"jan": 1, "january": 1,
	"feb": 2, "february": 2,
	"mar": 3, "march": 3,
	"apr": 4, "april": 4,
	"may": 5,
	"jun": 6, "june": 6,
	"jul": 7, "july": 7,
	"aug": 8, "august": 8,
	"sep": 9, "september": 9,
	"oct": 10, "october": 10,
	"nov": 11, "november": 11,
	"dec": 12, "december": 12,
}


def _next_weekday(base: datetime, target_weekday: int) -> datetime:
	days_ahead = (target_weekday - base.weekday()) % 7
	if days_ahead == 0:
		days_ahead = 7
	return base + timedelta(days=days_ahead)


def _extract_time(part: str) -> tuple[int, int]:
	m = re.search(r"(\d{1,2}):(\d{2})", part)
	if not m:
		raise ValueError(f"No time found in: {part}")
	return int(m.group(1)), int(m.group(2))


def _parse_single_datetime(part: str, reference: datetime) -> datetime:
	part_lower = part.lower()
	hour, minute = _extract_time(part)

	now = reference
	current_year = now.year

	# Today / Tomorrow
	if "today" in part_lower:
		return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
	if "tomorrow" in part_lower:
		dt = now + timedelta(days=1)
		return dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

	# Weekday with optional full date
	for name, wd in WEEKDAYS.items():
		if name in part_lower:
			full_date_match = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", part)
			if full_date_match:
				day = int(full_date_match.group(1))
				month = MONTHS[full_date_match.group(2).lower()]
				year = int(full_date_match.group(3))
				return datetime(year, month, day, hour, minute)
			dt = _next_weekday(now, wd)
			return dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

	# Explicit date without weekday
	m = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?", part)
	if m:
		day = int(m.group(1))
		month = MONTHS[m.group(2).lower()]
		year = int(m.group(3)) if m.group(3) else current_year
		return datetime(year, month, day, hour, minute)

	raise ValueError(f"Unrecognized format: {part}")


def parse_time_en(timestr: str) -> Generator[datetime, None, None]:
	"""
    Generator that yields datetime objects.
    For intervals:
      - Time ranges on a single day: yield one datetime (start time)
      - Date ranges: yield each day between start and end (inclusive), using start time
    """
	now = datetime.now()

	# Check for interval separators
	for sep in ["–", "-", "—"]:
		if sep in timestr:
			start_str, end_str = timestr.split(sep, 1)
			end_str = end_str.strip()

			# Determine if this is a multi-day interval
			is_multi_day = bool(re.search(
				r"\b(\d{1,2})\s+([A-Za-z]+)|\b(today|tomorrow)|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
				end_str.lower()))

			start_dt = _parse_single_datetime(start_str.strip(), now)

			if is_multi_day:
				end_dt = _parse_single_datetime(end_str, now)
				current = start_dt
				while current.date() <= end_dt.date():
					yield current.replace(hour=start_dt.hour, minute=start_dt.minute)
					current += timedelta(days=1)
			else:
				# Single day time range, yield only start
				yield start_dt
			return

	# Single datetime
	yield _parse_single_datetime(timestr.strip(), now)


if __name__ == "__main__":
	# TODO: bug: 	ha egy több napos event nem minden nap ugyanakkor kezdődik,
	#  				akkor cumó van, mert az első event idejét veszi figyelembe mindig.
	from timezonefix import fix_tz

	tests_en = [
		"Tomorrow at 20:00",
		"Thursday from 18:00-20:00",
		"20 Feb at 19:00 – 21 Feb at 08:00",
		"Today at 20:00",
		"Today from 18:00-21:00",
		"Today at 18:00",
		"Friday at 20:00",
		"Saturday at 19:00",
		"Thursday at 19:00",
		"Thursday from 20:00-23:00",
		"Thursday at 19:00",
		"Friday at 23:00",
		"Saturday from 20:00-23:59",
		"18 Feb at 19:00 – 22 Feb at 22:00",
		"27 Feb at 20:00 – 28 Feb at 23:00",
		"Thursday 26 February 2026 from 20:00-23:00",
		"Monday 23 February 2026 from 17:00-21:00",
		"Saturday 28 February 2026 at 19:30",
		"18 Feb at 19:00 – 22 Feb at 22:00",
		"Wednesday 25 February 2026 at 19:00",
		"25 February 2026 at 19:00",
		"Friday 13 March 2026 at 18:00",
	]

	for test_en in tests_en:
		print(test_en, ":")
		for dt in parse_time_en(test_en):
			print("   ", dt, "       ", dt.timestamp())
