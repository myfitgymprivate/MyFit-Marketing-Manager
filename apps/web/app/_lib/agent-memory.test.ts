import { describe, expect, it } from "vitest";

import {
  agentMemorySchema,
  customAgentMemoryInstructions,
  DEFAULT_AGENT_MEMORY,
} from "./agent-memory";

describe("Editable agent memory", () => {
  it("validates separate text and image instructions", () => {
    expect(agentMemorySchema.parse(DEFAULT_AGENT_MEMORY)).toEqual(
      DEFAULT_AGENT_MEMORY,
    );
  });

  it("adds only the requested memory section", () => {
    const textInstructions = customAgentMemoryInstructions(
      {
        textInstructions: "Používej tykání.",
        imageInstructions: "Více denního světla.",
      },
      "text",
    );

    expect(textInstructions).toContain("Používej tykání.");
    expect(textInstructions).not.toContain("Více denního světla.");
  });
});
