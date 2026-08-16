export function isValidTrendSource(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function trendFreshnessLabel(capturedAt: string, now = new Date()) {
  const captured = new Date(capturedAt);
  const ageDays = Math.floor(
    (now.getTime() - captured.getTime()) / (24 * 60 * 60 * 1_000),
  );
  if (!Number.isFinite(ageDays) || ageDays < 0)
    return "Datum je potřeba ověřit";
  if (ageDays <= 7) return "Aktuální zdroj";
  if (ageDays <= 30) return "Zdroj stárne · zkontrolovat";
  return "Neaktuální · nepoužívat bez ověření";
}
