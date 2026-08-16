import { describe, expect, it } from "vitest";

import {
  orderedStoryVisuals,
  createStoryFrames,
  parseStoryFrames,
  parseStoryVisualSeries,
  type StoryVisualSeries,
} from "./story-series";

const styleVersion = "test-style";

describe("Story series persistence", () => {
  it("creates the requested number of frames from numbered imported text", () => {
    expect(
      createStoryFrames({
        title: "Volné termíny",
        graphicText: "1: TEASER\n2: TERMÍNY\n3: REZERVUJ",
        visualDirection: "Světlý MY FIT styl",
        cta: "Vyber si termín",
        count: 3,
      }),
    ).toEqual([
      {
        position: 1,
        text: "TEASER",
        direction: "Světlý MY FIT styl",
      },
      {
        position: 2,
        text: "TERMÍNY",
        direction: "Světlý MY FIT styl",
      },
      {
        position: 3,
        text: "REZERVUJ",
        direction: "Světlý MY FIT styl CTA: Vyber si termín",
      },
    ]);
  });
  it("keeps 1, 3 and 5 slides in their position order", () => {
    for (const count of [1, 3, 5]) {
      const frames = Array.from({ length: count }, (_, index) => ({
        position: count - index,
        text: `Slide ${count - index}`,
        direction: "Směr",
      }));
      const parsed = parseStoryFrames(JSON.stringify(frames), []);
      expect(parsed.map((frame) => frame.position)).toEqual(
        Array.from({ length: count }, (_, index) => index + 1),
      );
    }
  });

  it("drops damaged and outdated stored visuals", () => {
    const result = parseStoryVisualSeries(
      JSON.stringify({
        1: {
          framePosition: 1,
          dataUrl: "data:image/png;base64,abc",
          mode: "demo",
          styleVersion,
          template: "story_private_benefit",
          composition: "editorial_split",
          version: 1,
          generatedAt: "2026-08-13T10:00:00.000Z",
        },
        2: { broken: true },
        3: {
          framePosition: 3,
          dataUrl: "data:image/png;base64,abc",
          mode: "demo",
          styleVersion: "old-style",
          template: "story_private_benefit",
          composition: "editorial_split",
          version: 1,
          generatedAt: "2026-08-13T10:00:00.000Z",
        },
      }),
      styleVersion,
    );

    expect(Object.keys(result)).toEqual(["1"]);
  });

  it("returns complete visuals in frame order", () => {
    const visual = (framePosition: number) => ({
      framePosition,
      dataUrl: "data:image/png;base64,abc",
      mode: "demo" as const,
      styleVersion,
      template: "story_private_benefit" as const,
      composition: "editorial_split" as const,
      version: 1,
      generatedAt: "2026-08-13T10:00:00.000Z",
    });
    const visuals: StoryVisualSeries = {
      2: visual(2),
      1: visual(1),
      3: visual(3),
    };
    const frames = [3, 1, 2].map((position) => ({
      position,
      text: "Text",
      direction: "Směr",
    }));

    expect(
      orderedStoryVisuals(frames, visuals).map(
        (visual) => visual.framePosition,
      ),
    ).toEqual([1, 2, 3]);
  });
});
