import { createHash, timingSafeEqual } from "node:crypto";

import {
  notifications,
  reservationSlots,
  reservationSnapshots,
} from "@myfit/database";

import { getDatabase } from "../../../../_lib/database";
import {
  parseReservationCalendar,
  targetReservationDates,
} from "../../../../_lib/reservation-monitor";

const sourceUrl = "https://rezervace.myfitgym.cz/rs/kalendar_vypis";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!authorized(request))
    return Response.json(
      { error: { code: "UNAUTHORIZED_JOB", requestId } },
      { status: 401 },
    );

  const workspaceId = process.env.MYFIT_WORKSPACE_ID;
  if (!workspaceId || !process.env.DATABASE_URL)
    return Response.json(
      { error: { code: "JOB_NOT_CONFIGURED", requestId } },
      { status: 503 },
    );

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { "User-Agent": "MyFit-Marketing-Monitor/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error(`Reservation source returned ${response.status}.`);
    const html = await response.text();
    const dates = targetReservationDates();
    const slots = parseReservationCalendar(
      html,
      dates,
      Number(process.env.RESERVATION_MONITOR_START_HOUR ?? 6),
      Number(process.env.RESERVATION_MONITOR_END_HOUR ?? 23),
    );
    if (!slots.length)
      throw new Error("No future reservation slots were parsed.");

    const freeSlots = slots.filter((slot) => slot.isAvailable).length;
    const occupancyBps = Math.round(
      ((slots.length - freeSlots) / slots.length) * 10_000,
    );
    const checksum = createHash("sha256").update(html).digest("hex");
    const threshold = Number(process.env.RESERVATION_FREE_RATIO_ALERT ?? 0.45);
    const perDay = dates.map((date) => {
      const daySlots = slots.filter((slot) => slot.date === date);
      const free = daySlots.filter((slot) => slot.isAvailable).length;
      return {
        date,
        total: daySlots.length,
        free,
        freeRatio: daySlots.length ? free / daySlots.length : 0,
      };
    });

    const database = getDatabase();
    await database.transaction(async (transaction) => {
      const [snapshot] = await transaction
        .insert(reservationSnapshots)
        .values({
          workspaceId,
          source: sourceUrl,
          sourceChecksum: checksum,
          periodStart: slots[0]!.startsAt,
          periodEnd: slots.at(-1)!.endsAt,
          totalSlots: slots.length,
          freeSlots,
          occupancyBps,
          rawSummary: { perDay, threshold },
        })
        .returning({ id: reservationSnapshots.id });
      if (!snapshot) throw new Error("Snapshot was not created.");

      await transaction.insert(reservationSlots).values(
        slots.map((slot) => ({
          snapshotId: snapshot.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          isAvailable: slot.isAvailable,
          sourceSlotId: slot.sourceSlotId,
        })),
      );

      for (const day of perDay.filter(
        (item) => item.total > 0 && item.freeRatio >= threshold,
      )) {
        await transaction
          .insert(notifications)
          .values({
            workspaceId,
            category: "RESERVATION_CAPACITY",
            severity: day.freeRatio >= 0.65 ? "WARNING" : "INFO",
            title: `Více volných termínů · ${day.date}`,
            message: `${day.free} z ${day.total} sledovaných termínů je volných. Doporučuji připravit podporu rezervací.`,
            actionType: "OPEN_CALENDAR",
            actionPayload: { date: day.date, freeRatio: day.freeRatio },
            deduplicationKey: `reservation-capacity:${day.date}`,
          })
          .onConflictDoUpdate({
            target: [notifications.workspaceId, notifications.deduplicationKey],
            set: {
              message: `${day.free} z ${day.total} sledovaných termínů je volných. Doporučuji připravit podporu rezervací.`,
              status: "OPEN",
              updatedAt: new Date(),
            },
          });
      }
    });

    return Response.json({
      data: {
        dates,
        totalSlots: slots.length,
        freeSlots,
        occupancyBps,
        perDay,
      },
      meta: { requestId },
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          code: "RESERVATION_MONITOR_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
          requestId,
        },
      },
      { status: 502 },
    );
  }
}
