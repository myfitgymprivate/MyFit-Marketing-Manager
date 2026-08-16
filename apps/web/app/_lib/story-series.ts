import type {
  MyfitStoryComposition,
  MyfitVisualTemplate,
} from "./myfit-visual-system";

export type StoryFrame = {
  position: number;
  text: string;
  direction: string;
};

export type StoredSlideVisual = {
  framePosition: number;
  dataUrl: string;
  mode: "live" | "demo";
  styleVersion: string;
  template: MyfitVisualTemplate;
  composition: MyfitStoryComposition;
  version: number;
  generatedAt: string;
};

export type StoryVisualSeries = Record<number, StoredSlideVisual>;

export type StoryFrameInput = {
  title: string;
  graphicText?: string;
  visualDirection?: string;
  cta?: string;
  count?: number;
};

export function createStoryFrames(input: StoryFrameInput): StoryFrame[] {
  const numberedParts = (input.graphicText ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.match(/^\d+\s*[:.)-]\s*(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));
  const plainParts = (input.graphicText ?? "")
    .split(/\n{2,}|\s+[|•]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const texts = numberedParts.length ? numberedParts : plainParts;
  const count = Math.max(1, input.count ?? (texts.length || 1));

  return Array.from({ length: count }, (_, index) => ({
    position: index + 1,
    text:
      texts[index] ??
      (index === count - 1 && input.cta ? input.cta : input.title),
    direction: [
      input.visualDirection,
      index === count - 1 && input.cta ? `CTA: ${input.cta}` : undefined,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

function isStoryFrame(value: unknown): value is StoryFrame {
  if (!value || typeof value !== "object") return false;
  const frame = value as Partial<StoryFrame>;
  return (
    Number.isInteger(frame.position) &&
    (frame.position ?? 0) > 0 &&
    typeof frame.text === "string" &&
    typeof frame.direction === "string"
  );
}

function isStoredSlideVisual(
  value: unknown,
  styleVersion: string,
): value is StoredSlideVisual {
  if (!value || typeof value !== "object") return false;
  const visual = value as Partial<StoredSlideVisual>;
  return (
    Number.isInteger(visual.framePosition) &&
    (visual.framePosition ?? 0) > 0 &&
    typeof visual.dataUrl === "string" &&
    visual.dataUrl.startsWith("data:image/png") &&
    (visual.mode === "live" || visual.mode === "demo") &&
    visual.styleVersion === styleVersion &&
    (visual.composition === "editorial_split" ||
      visual.composition === "photo_forward") &&
    typeof visual.template === "string" &&
    Number.isInteger(visual.version) &&
    (visual.version ?? 0) > 0 &&
    typeof visual.generatedAt === "string"
  );
}

export function parseStoryFrames(
  rawValue: string | null,
  fallback: StoryFrame[],
) {
  if (!rawValue) return fallback;
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isStoryFrame)) return fallback;
    return [...parsed].sort(
      (first, second) => first.position - second.position,
    );
  } catch {
    return fallback;
  }
}

export function parseStoryVisualSeries(
  rawValue: string | null,
  styleVersion: string,
): StoryVisualSeries {
  if (!rawValue) return {};
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        isStoredSlideVisual(value, styleVersion),
      ),
    );
  } catch {
    return {};
  }
}

export function orderedStoryVisuals(
  frames: StoryFrame[],
  visuals: StoryVisualSeries,
) {
  return [...frames]
    .sort((first, second) => first.position - second.position)
    .map((frame) => visuals[frame.position])
    .filter((visual): visual is StoredSlideVisual => Boolean(visual));
}
