import { describe, expect, it } from "vitest";

import { parseReservationCalendar } from "./reservation-monitor";

describe("parseReservationCalendar", () => {
  it("reads only future daytime slots with explicit occupancy", () => {
    const html = `
      <div class="lekce-wrapper-2026-08-16">
        <div class="jedna-lekce-vypis" id="lekce_telo_10">
          <span class="cas-od">08:45</span><span class="cas-do"> - 10:00</span>
          <div class="lekce-telo-obsazenost"><span>Volno</span></div>
        </div>
        <div class="jedna-lekce-vypis" id="lekce_telo_11">
          <span class="cas-od">10:00</span><span class="cas-do"> - 11:15</span>
          <div class="lekce-telo-obsazenost"><span>Obsazeno</span></div>
        </div>
        <div class="jedna-lekce-vypis" id="lekce_telo_12">
          <span class="cas-od">02:30</span><span class="cas-do"> - 03:45</span>
          <div class="lekce-telo-obsazenost"><span>Volno</span></div>
        </div>
      </div>`;

    const slots = parseReservationCalendar(html, ["2026-08-16"]);
    expect(slots).toHaveLength(2);
    expect(slots.map((slot) => slot.isAvailable)).toEqual([true, false]);
    expect(slots[0]?.sourceSlotId).toBe("10");
  });
});
