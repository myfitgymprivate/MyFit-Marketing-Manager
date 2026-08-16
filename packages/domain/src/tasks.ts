function localDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  if (!year || !month || !day) {
    throw new Error("LOCAL_DATE_FORMAT_FAILED");
  }

  return { year, month, day };
}

function localDayOrdinal(date: Date, timeZone: string) {
  const { year, month, day } = localDateParts(date, timeZone);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function daysSinceLocalDate(
  previous: Date,
  current: Date,
  timeZone = "Europe/Prague",
) {
  return Math.max(
    0,
    localDayOrdinal(current, timeZone) - localDayOrdinal(previous, timeZone),
  );
}

export function shouldCreateDailyOccurrence(openOccurrenceCount: number) {
  return openOccurrenceCount === 0;
}
