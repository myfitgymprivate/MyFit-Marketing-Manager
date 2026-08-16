export type DailyTaskCompletion = {
  completedAt: string;
  completedDate: string;
  nextDueDate: string;
  timezone: "Europe/Prague";
};

export function pragueDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function nextDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Neplatné datum úkolu.");
  return pragueDateKey(new Date(Date.UTC(year, month - 1, day + 1, 12)));
}

export function createDailyCompletion(now = new Date()): DailyTaskCompletion {
  const completedDate = pragueDateKey(now);
  return {
    completedAt: now.toISOString(),
    completedDate,
    nextDueDate: nextDateKey(completedDate),
    timezone: "Europe/Prague",
  };
}

export function parseDailyCompletion(rawValue: string | null) {
  if (!rawValue) return null;
  try {
    const value = JSON.parse(rawValue) as Partial<DailyTaskCompletion>;
    if (
      typeof value.completedAt !== "string" ||
      typeof value.completedDate !== "string" ||
      typeof value.nextDueDate !== "string" ||
      value.timezone !== "Europe/Prague"
    )
      return null;
    return value as DailyTaskCompletion;
  } catch {
    return null;
  }
}

export function isDailyTaskCompleted(
  completion: DailyTaskCompletion | null,
  now = new Date(),
) {
  return completion?.completedDate === pragueDateKey(now);
}
