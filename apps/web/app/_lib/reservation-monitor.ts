import { load } from "cheerio";

export type ReservationSlot = {
  sourceSlotId: string;
  date: string;
  startsAt: Date;
  endsAt: Date;
  isAvailable: boolean;
};

function dateKeyInPrague(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function pragueDateTime(date: string, time: string) {
  const initial = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(initial);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return new Date(initial.getTime() - (representedAsUtc - initial.getTime()));
}

export function targetReservationDates(now = new Date(), daysAhead = 4) {
  return Array.from({ length: daysAhead }, (_, index) =>
    dateKeyInPrague(addDays(now, index + 1)),
  );
}

export function parseReservationCalendar(
  html: string,
  targetDates: string[],
  startHour = 6,
  endHour = 23,
) {
  const $ = load(html);
  const slots: ReservationSlot[] = [];

  for (const date of targetDates) {
    $(`.lekce-wrapper-${date} .jedna-lekce-vypis`).each((_, element) => {
      const root = $(element);
      const sourceSlotId = root.attr("id")?.replace("lekce_telo_", "");
      const starts = root.find(".cas-od").text().trim();
      const ends = root.find(".cas-do").text().replace("-", "").trim();
      const occupancy = root.find(".lekce-telo-obsazenost").text().trim();
      const startHourValue = Number(starts.split(":")[0]);
      if (
        !sourceSlotId ||
        !starts ||
        !ends ||
        !["Volno", "Obsazeno"].includes(occupancy) ||
        startHourValue < startHour ||
        startHourValue >= endHour
      )
        return;

      slots.push({
        sourceSlotId,
        date,
        startsAt: pragueDateTime(date, starts),
        endsAt: pragueDateTime(date, ends),
        isAvailable: occupancy === "Volno",
      });
    });
  }

  return slots;
}
