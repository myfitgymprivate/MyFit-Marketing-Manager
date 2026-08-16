export default async () => {
  const appUrl = process.env.APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!appUrl || !secret)
    throw new Error("Scheduled monitor is not configured.");

  const response = await fetch(`${appUrl}/api/v1/jobs/reservations`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok)
    throw new Error(`Reservation monitor failed with ${response.status}.`);
};
