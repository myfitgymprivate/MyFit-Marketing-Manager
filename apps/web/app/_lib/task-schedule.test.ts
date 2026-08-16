import { describe, expect, it } from "vitest";

import {
  createDailyCompletion,
  isDailyTaskCompleted,
  parseDailyCompletion,
} from "./task-schedule";

describe("Daily tasks in Europe/Prague", () => {
  it("resets after Prague midnight", () => {
    const completion = createDailyCompletion(
      new Date("2026-08-13T21:30:00.000Z"),
    );

    expect(
      isDailyTaskCompleted(completion, new Date("2026-08-13T21:59:00.000Z")),
    ).toBe(true);
    expect(
      isDailyTaskCompleted(completion, new Date("2026-08-13T22:01:00.000Z")),
    ).toBe(false);
    expect(completion.nextDueDate).toBe("2026-08-14");
  });

  it("ignores old and damaged storage values", () => {
    expect(parseDailyCompletion("completed")).toBeNull();
    expect(parseDailyCompletion("{broken")).toBeNull();
  });
});
