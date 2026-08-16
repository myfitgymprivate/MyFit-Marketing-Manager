export const contentTypes = ["STORY", "REEL", "POST"] as const;
export type ContentType = (typeof contentTypes)[number];

export const contentStatuses = [
  "DRAFT",
  "PLANNED",
  "PREPARING",
  "READY",
  "PUBLISHED",
  "SKIPPED",
  "ARCHIVED",
] as const;
export type ContentStatus = (typeof contentStatuses)[number];

const transitions: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  DRAFT: ["PLANNED", "PUBLISHED", "ARCHIVED"],
  PLANNED: ["PREPARING", "SKIPPED"],
  PREPARING: ["READY", "SKIPPED"],
  READY: ["PUBLISHED", "SKIPPED"],
  PUBLISHED: ["ARCHIVED"],
  SKIPPED: ["PLANNED"],
  ARCHIVED: [],
};

export function canTransitionContent(
  from: ContentStatus,
  to: ContentStatus,
  options: { isBackfill?: boolean } = {},
) {
  if (from === "DRAFT" && to === "PUBLISHED") {
    return options.isBackfill === true;
  }

  return transitions[from].includes(to);
}

export function assertContentTransition(
  from: ContentStatus,
  to: ContentStatus,
  options: { isBackfill?: boolean } = {},
) {
  if (!canTransitionContent(from, to, options)) {
    throw new Error(`CONTENT_TRANSITION_NOT_ALLOWED:${from}:${to}`);
  }
}
