import { createStoryFrames, type StoryFrame } from "./story-series";

export const PLAN_IMPORT_FIELDS = [
  "date",
  "type",
  "title",
  "platform",
  "format_label",
  "external_id",
  "goal",
  "campaign",
  "cta",
  "caption",
  "graphic_text",
  "hashtags",
  "status",
  "notes",
  "story_slide_count",
  "visual_direction",
  "source_url",
] as const;

export type PlanImportField = (typeof PLAN_IMPORT_FIELDS)[number];
export type PlanImportMapping = Partial<Record<PlanImportField, string>>;

export type PlanImportItem = {
  rowNumber: number;
  date: string;
  type: "STORY" | "REEL" | "POST" | "ÚKOL";
  title: string;
  platform?: string;
  formatLabel?: string;
  externalId?: string;
  goal?: string;
  campaign?: string;
  cta?: string;
  caption?: string;
  graphicText?: string;
  hashtags?: string;
  notes?: string;
  storySlideCount?: number;
  storyFrames?: StoryFrame[];
  visualDirection?: string;
  sourceUrl?: string;
  warnings: string[];
  duplicateOf?: string;
};

export type PlanImportError = {
  rowNumber: number;
  message: string;
};

export type ExistingPlanItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  externalId?: string;
};

export type PlanImportPreview = {
  headers: string[];
  mapping: PlanImportMapping;
  items: PlanImportItem[];
  errors: PlanImportError[];
  duplicateCount: number;
};

export type StoryScenarioMap = Record<string, StoryFrame[]>;

const headerAliases: Record<PlanImportField, string[]> = {
  date: ["date", "datum", "den", "datum publikace", "termin"],
  type: ["type", "typ", "format", "formát", "druh"],
  title: ["title", "nazev", "název", "tema", "téma", "nazev tema"],
  platform: ["platform", "platforma", "kanal", "kanál", "socialni sit"],
  format_label: ["format detail", "puvodni format", "původní formát"],
  external_id: ["external id", "external_id", "externi id", "id"],
  goal: ["goal", "cil", "cíl", "marketingovy cil"],
  campaign: ["campaign", "kampan", "kampaň"],
  cta: ["cta", "vyzva k akci"],
  caption: [
    "caption",
    "popisek",
    "text prispevku",
    "text k prispevku / story",
    "text k příspěvku / story",
  ],
  graphic_text: ["graphic text", "text do grafiky", "text v grafice"],
  hashtags: ["hashtags", "hashtagy", "hashtag"],
  status: ["status", "stav"],
  notes: ["notes", "poznamka", "poznámka", "poznamky"],
  story_slide_count: [
    "story slide count",
    "story_slide_count",
    "pocet slidu",
    "počet slidů",
  ],
  visual_direction: [
    "visual direction",
    "visual_direction",
    "vizualni zadani",
    "vizuální zadání",
    "koncept grafiky / videa",
    "koncept grafiky",
  ],
  source_url: ["source url", "source_url", "zdroj", "odkaz"],
};

function normalizedText(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function rowValue(row: Record<string, unknown>, aliases: string[]) {
  const aliasSet = new Set(aliases.map(normalizedText));
  const entry = Object.entries(row).find(([header]) =>
    aliasSet.has(normalizedText(header)),
  );
  return entry?.[1];
}

export function buildStoryScenarioMap(rows: Record<string, unknown>[]) {
  const scenarios: StoryScenarioMap = {};
  rows.forEach((row) => {
    const scenario = String(
      rowValue(row, ["Scénář", "Scenario", "Název"]),
    ).trim();
    const position = Number(rowValue(row, ["Slide", "Pořadí"]));
    const text = String(
      rowValue(row, ["Text do grafiky", "Text", "Headline"]),
    ).trim();
    if (!scenario || !Number.isInteger(position) || position < 1 || !text)
      return;
    const direction = [
      rowValue(row, ["Účel", "Cíl"]),
      rowValue(row, ["Vizuál", "Vizuální zadání"]),
      rowValue(row, ["Interaktivní prvek / odkaz", "Interaktivní prvek"]),
      rowValue(row, ["Poznámka", "Poznámky"]),
    ]
      .map((value) => String(value ?? "").trim())
      .filter((value) => value && value !== "—")
      .join(" · ");
    const key = normalizedText(scenario);
    scenarios[key] = [
      ...(scenarios[key] ?? []),
      { position, text, direction },
    ].sort((first, second) => first.position - second.position);
  });
  return scenarios;
}

function storyScenarioForItem(
  item: Pick<PlanImportItem, "title">,
  scenarios: StoryScenarioMap,
) {
  const title = normalizedText(item.title);
  const exact = scenarios[title];
  if (exact) return exact;
  const semanticKey = Object.keys(scenarios).find((scenario) => {
    if (title.includes(scenario) || scenario.includes(title)) return true;
    if (scenario.includes("volne terminy"))
      return title.includes("volne") && title.includes("termin");
    if (scenario === "faq") return /faq|otaz|vstup/.test(title);
    if (scenario.includes("extrifit")) return title.includes("extrifit");
    if (scenario.includes("recenze")) return title.includes("recenze");
    if (scenario.includes("vikend") && scenario.includes("sleva"))
      return title.includes("vikend") && title.includes("sleva");
    return false;
  });
  return semanticKey ? scenarios[semanticKey] : undefined;
}

export function autoMapImportHeaders(headers: string[]): PlanImportMapping {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizedText(header),
  }));
  const mapping: PlanImportMapping = {};
  PLAN_IMPORT_FIELDS.forEach((field) => {
    const aliases = headerAliases[field].map(normalizedText);
    const match = normalizedHeaders.find((header) =>
      aliases.includes(header.normalized),
    );
    if (match) mapping[field] = match.original;
  });
  if (!mapping.format_label && mapping.type)
    mapping.format_label = mapping.type;
  return mapping;
}

export function normalizeImportDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.round(value) * 86_400_000);
    return date.toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== text
      ? null
      : text;
  }
  const czechMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!czechMatch) return null;
  const [, dayText, monthText, yearText] = czechMatch;
  const normalized = `${yearText}-${String(Number(monthText)).padStart(2, "0")}-${String(Number(dayText)).padStart(2, "0")}`;
  const date = new Date(`${normalized}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
    ? null
    : normalized;
}

export function normalizeImportType(value: unknown, platformValue?: unknown) {
  const type = normalizedText(value);
  const platform = normalizedText(platformValue);
  if (type === "task" || type === "ukol" || type === "ukoly")
    return "ÚKOL" as const;
  if (/\b(reel|reels|video)\b/.test(type)) return "REEL" as const;
  if (/\b(post|prispevek|carousel)\b/.test(type)) return "POST" as const;
  if (
    /\b(story|stories)\b/.test(type) ||
    /\bstories\b/.test(platform) ||
    ["anketa", "quiz", "faq", "q&a sticker", "qa sticker"].includes(type)
  )
    return "STORY" as const;
  return null;
}

function inferStorySlideCount(value: unknown) {
  const match = normalizedText(value).match(
    /(\d+)\s*(?:[-–]\s*(\d+)\s*)?(?:story|stories|slidu)/,
  );
  if (!match) return undefined;
  return Number(match[2] ?? match[1]);
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function duplicateKey(item: { date: string; type: string; title: string }) {
  return `${item.date}|${item.type}|${normalizedText(item.title)}`;
}

export function buildPlanImportPreview(
  rows: Record<string, unknown>[],
  headers: string[],
  existingItems: ExistingPlanItem[],
  suppliedMapping?: PlanImportMapping,
  storyScenarios: StoryScenarioMap = {},
): PlanImportPreview {
  const mapping = suppliedMapping ?? autoMapImportHeaders(headers);
  const errors: PlanImportError[] = [];
  const items: PlanImportItem[] = [];
  const existingByExternalId = new Map(
    existingItems
      .filter((item) => item.externalId)
      .map((item) => [item.externalId!, item.id]),
  );
  const existingByKey = new Map(
    existingItems.map((item) => [duplicateKey(item), item.id]),
  );

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const read = (field: PlanImportField) => {
      const header = mapping[field];
      return header ? row[header] : undefined;
    };
    const date = normalizeImportDate(read("date"));
    const type = normalizeImportType(read("type"), read("platform"));
    const title = String(read("title") ?? "").trim();
    const rowErrors: string[] = [];
    if (!date) rowErrors.push("Chybí nebo není platné datum.");
    if (!type) rowErrors.push("Formát musí být Story, Reel, Post nebo Úkol.");
    if (!title) rowErrors.push("Chybí název nebo téma.");
    const sourceUrl = String(read("source_url") ?? "").trim();
    if (sourceUrl && !validUrl(sourceUrl))
      rowErrors.push("Zdroj musí být platný odkaz http:// nebo https://.");
    if (rowErrors.length) {
      errors.push({ rowNumber, message: rowErrors.join(" ") });
      return;
    }

    const externalId = String(read("external_id") ?? "").trim() || undefined;
    const status = normalizedText(read("status"));
    const warnings: string[] = [];
    if (status === "published" || status === "publikovano")
      warnings.push("Publikovaný stav byl bezpečně změněn na návrh.");
    const slideValue = Number(read("story_slide_count"));
    const inferredSlideCount = inferStorySlideCount(read("format_label"));
    const item: PlanImportItem = {
      rowNumber,
      date: date!,
      type: type!,
      title,
      platform: String(read("platform") ?? "").trim() || undefined,
      formatLabel: String(read("format_label") ?? "").trim() || undefined,
      externalId,
      goal: String(read("goal") ?? "").trim() || undefined,
      campaign: String(read("campaign") ?? "").trim() || undefined,
      cta: String(read("cta") ?? "").trim() || undefined,
      caption: String(read("caption") ?? "").trim() || undefined,
      graphicText: String(read("graphic_text") ?? "").trim() || undefined,
      hashtags: String(read("hashtags") ?? "").trim() || undefined,
      notes: String(read("notes") ?? "").trim() || undefined,
      storySlideCount:
        Number.isInteger(slideValue) && slideValue > 0
          ? slideValue
          : inferredSlideCount,
      visualDirection:
        String(read("visual_direction") ?? "").trim() || undefined,
      sourceUrl: sourceUrl || undefined,
      warnings,
    };
    if (item.type === "STORY") {
      item.storyFrames =
        storyScenarioForItem(item, storyScenarios) ??
        createStoryFrames({
          title: item.title,
          graphicText: item.graphicText,
          visualDirection: item.visualDirection,
          cta: item.cta,
          count: item.storySlideCount,
        });
      item.storySlideCount = item.storyFrames.length;
    }
    item.duplicateOf = externalId
      ? existingByExternalId.get(externalId)
      : existingByKey.get(duplicateKey(item));
    if (item.duplicateOf) warnings.push("Možná duplicita stávající položky.");
    items.push(item);
  });

  return {
    headers,
    mapping,
    items,
    errors,
    duplicateCount: items.filter((item) => item.duplicateOf).length,
  };
}
