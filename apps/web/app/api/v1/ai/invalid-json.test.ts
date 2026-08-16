import { describe, expect, it } from "vitest";

import { POST as chatPost } from "./chat/route";
import { POST as contentKitPost } from "./content-kit/route";
import { POST as visualPost } from "./visual/route";
import { POST as monthlyPlanPost } from "../monthly-plans/generate/route";
import { POST as importCommitPost } from "../plan-imports/commit/route";

describe("AI API invalid JSON", () => {
  it.each([
    ["chat", chatPost],
    ["content-kit", contentKitPost],
    ["visual", visualPost],
    ["monthly-plan", monthlyPlanPost],
    ["plan-import-commit", importCommitPost],
  ])("returns 400 from %s", async (_name, handler) => {
    const response = await handler(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    const body = (await response.json()) as {
      error: { code: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_JSON");
  });
});
