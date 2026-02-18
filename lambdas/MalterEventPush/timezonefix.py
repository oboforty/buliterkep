from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

TZ_ALTS = [
    "Europe/Budapest",
    "Europe/Berlin",
    "Europe/Amsterdam",
    "Europe/Stockholm",
    "Europe/Paris",
    "Etc/GMT-1", #living on a prayer
]
# FIXME: if this doesn't work on AWS Lambda, just use tzdata layer


def fix_tz(dt_naive: datetime) -> datetime:
	for tz in TZ_ALTS:
		try:
			dt_local = dt_naive.replace(tzinfo=ZoneInfo(tz))
			return dt_local.astimezone(ZoneInfo("UTC"))
		except ZoneInfoNotFoundError:
			pass
		print("ERROR: no TZ found for UTC+1!")
	return dt_naive

