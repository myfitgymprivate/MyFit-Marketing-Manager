import { z } from "zod";

import { DEFAULT_AGENT_MEMORY } from "./agent-memory";
import {
  DEFAULT_PLANNING_SETTINGS,
  monthlyPlanSchema,
  planningSettingsSchema,
  type MonthlyPlan,
  type MonthlyPlanDraft,
} from "./monthly-plan";
import type { PlanImportItem } from "./plan-import";

export const MARKETING_STATE_KEY = "myfit-marketing-state-v1";
export const MARKETING_STATE_EVENT = "myfit-marketing-state-changed";

const calendarItemSchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  type: z.string().min(1),
  title: z.string().min(1),
  state: z.string().min(1),
  source: z
    .enum(["MANUAL", "AI_PLAN", "XLSX_IMPORT", "CSV_IMPORT"])
    .default("MANUAL"),
  externalId: z.string().min(1).optional(),
  platform: z.string().optional(),
  formatLabel: z.string().optional(),
  goal: z.string().optional(),
  campaign: z.string().optional(),
  cta: z.string().optional(),
  caption: z.string().optional(),
  graphicText: z.string().optional(),
  hashtags: z.string().optional(),
  notes: z.string().optional(),
  storySlideCount: z.number().int().positive().optional(),
  storyFrames: z
    .array(
      z.object({
        position: z.number().int().positive(),
        text: z.string().min(1),
        direction: z.string(),
      }),
    )
    .optional(),
  visualDirection: z.string().optional(),
  sourceUrl: z.string().optional(),
  importBatchId: z.string().optional(),
});

const ideaSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string().min(1),
  status: z.enum(["idea", "planned"]),
});

const publishedSchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  type: z.enum(["STORY", "REEL", "POST"]),
  topic: z.string().min(1),
  recordedAt: z.string().min(1),
});

const trendSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string(),
  recommendation: z.string().min(1),
  capturedAt: z.string().min(1),
});

const campaignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  offer: z.string().min(1),
  status: z.enum(["draft", "approved"]),
  createdAt: z.string().min(1),
});

const memoryFactSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});

const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string(),
  priority: z.enum(["Běžná", "Vysoká"]),
  dueDate: z.iso.date(),
  recurrence: z.enum(["Žádné", "Denně", "Týdně"]),
  completed: z.boolean(),
});

const importBatchSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  source: z.enum(["XLSX_IMPORT", "CSV_IMPORT"]),
  previewToken: z.string().min(1),
  committedAt: z.string().min(1),
  itemIds: z.array(z.string()),
  months: z.array(z.string().regex(/^\d{4}-\d{2}$/)),
  rowCount: z.number().int().nonnegative(),
});

const sharedDataShape = {
  calendarItems: z.array(calendarItemSchema),
  ideas: z.array(ideaSchema),
  published: z.array(publishedSchema),
  trends: z.array(trendSchema),
  campaigns: z.array(campaignSchema),
  memoryFacts: z.array(memoryFactSchema),
  tasks: z.array(taskSchema).default([]),
  agentMemory: z
    .object({
      textInstructions: z.string().max(4_000),
      imageInstructions: z.string().max(4_000),
    })
    .default(DEFAULT_AGENT_MEMORY),
};

const dataSchema = z.object({
  ...sharedDataShape,
  monthlyPlans: z.array(monthlyPlanSchema).default([]),
  planningSettings: planningSettingsSchema.default(DEFAULT_PLANNING_SETTINGS),
  importBatches: z.array(importBatchSchema).default([]),
});

const legacyDataSchema = z.object({
  ...sharedDataShape,
  septemberPlanApproved: z.boolean().default(false),
});

const auditSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  summary: z.string().min(1),
  createdAt: z.string().min(1),
  reversible: z.boolean(),
  before: dataSchema.optional(),
});

const legacyAuditSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  summary: z.string().min(1),
  createdAt: z.string().min(1),
  reversible: z.boolean(),
  before: legacyDataSchema.optional(),
});

const stateSchema = dataSchema.extend({
  version: z.literal(2),
  audit: z.array(auditSchema),
});

const legacyStateSchema = legacyDataSchema.extend({
  version: z.literal(1),
  audit: z.array(legacyAuditSchema),
});

export type MarketingData = z.infer<typeof dataSchema>;
export type MarketingState = z.infer<typeof stateSchema>;
export type CalendarStoreItem = z.input<typeof calendarItemSchema>;
type StoredCalendarItem = z.infer<typeof calendarItemSchema>;

export type MarketingProposal = {
  id: string;
  tool: "reschedule_content" | "record_published_content" | "create_idea";
  args: Record<string, string>;
};

export type ImportResolution = "skip" | "update" | "add";
export type PlanImportCommit = {
  fileName: string;
  previewToken: string;
  source: "XLSX_IMPORT" | "CSV_IMPORT";
  mode: "merge" | "update" | "replace";
  items: PlanImportItem[];
  resolutions: Record<number, ImportResolution>;
  allowReplaceApproved?: boolean;
};

export type PlanImportChangeSummary = {
  changed: number;
  skipped: number;
  months: string[];
};

function dataFromState(state: MarketingState): MarketingData {
  return {
    calendarItems: state.calendarItems,
    ideas: state.ideas,
    published: state.published,
    trends: state.trends,
    campaigns: state.campaigns,
    memoryFacts: state.memoryFacts,
    tasks: state.tasks,
    agentMemory: state.agentMemory,
    monthlyPlans: state.monthlyPlans,
    planningSettings: state.planningSettings,
    importBatches: state.importBatches,
  };
}

function migrateLegacyData(
  legacy: z.infer<typeof legacyDataSchema>,
  now: string,
): MarketingData {
  const hasSeptember = legacy.calendarItems.some((item) =>
    item.date.startsWith("2026-09"),
  );
  return {
    calendarItems: legacy.calendarItems,
    ideas: legacy.ideas,
    published: legacy.published,
    trends: legacy.trends,
    campaigns: legacy.campaigns,
    memoryFacts: legacy.memoryFacts,
    tasks: legacy.tasks,
    agentMemory: legacy.agentMemory,
    monthlyPlans: hasSeptember
      ? [
          {
            id: "migrated-september-2026",
            month: "2026-09",
            goal: "Navázat na pravidelnou komunikaci MyFit",
            theme: "Návrat do rytmu",
            status: legacy.septemberPlanApproved
              ? ("APPROVED" as const)
              : ("READY_FOR_REVIEW" as const),
            source: "MANUAL" as const,
            version: 1,
            createdAt: now,
            updatedAt: now,
            ...(legacy.septemberPlanApproved
              ? { approvedAt: now, approvedBy: "local-demo-user" }
              : {}),
          },
        ]
      : [],
    planningSettings: DEFAULT_PLANNING_SETTINGS,
    importBatches: [],
  };
}

function withFallbackCalendar(
  state: MarketingState,
  fallbackCalendarItems: CalendarStoreItem[],
) {
  const existingIds = new Set(state.calendarItems.map((item) => item.id));
  return {
    ...state,
    calendarItems: [
      ...state.calendarItems,
      ...fallbackCalendarItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => calendarItemSchema.parse(item)),
    ],
  };
}

export function createMarketingState(
  calendarItems: CalendarStoreItem[],
): MarketingState {
  return {
    version: 2,
    calendarItems: calendarItems.map((item) => calendarItemSchema.parse(item)),
    ideas: [],
    published: [],
    trends: [],
    campaigns: [],
    memoryFacts: [],
    tasks: [],
    agentMemory: DEFAULT_AGENT_MEMORY,
    monthlyPlans: [],
    planningSettings: DEFAULT_PLANNING_SETTINGS,
    importBatches: [],
    audit: [],
  };
}

export function parseMarketingState(
  rawValue: string | null,
  fallbackCalendarItems: CalendarStoreItem[] = [],
) {
  if (!rawValue) return createMarketingState(fallbackCalendarItems);
  try {
    const rawData = JSON.parse(rawValue) as unknown;
    const parsed = stateSchema.safeParse(rawData);
    if (parsed.success)
      return withFallbackCalendar(parsed.data, fallbackCalendarItems);
    const legacy = legacyStateSchema.safeParse(rawData);
    if (!legacy.success) return createMarketingState(fallbackCalendarItems);
    const now = new Date().toISOString();
    const migratedData = migrateLegacyData(legacy.data, now);
    const migrated: MarketingState = {
      version: 2,
      ...migratedData,
      audit: legacy.data.audit.map((entry) => ({
        ...entry,
        before: entry.before
          ? migrateLegacyData(entry.before, entry.createdAt)
          : undefined,
      })),
    };
    return withFallbackCalendar(migrated, fallbackCalendarItems);
  } catch {
    return createMarketingState(fallbackCalendarItems);
  }
}

function auditedState(
  state: MarketingState,
  data: MarketingData,
  action: string,
  summary: string,
  now = new Date().toISOString(),
): MarketingState {
  return {
    version: 2,
    ...data,
    audit: [
      {
        id: crypto.randomUUID(),
        action,
        summary,
        createdAt: now,
        reversible: true,
        before: structuredClone(dataFromState(state)),
      },
      ...state.audit,
    ],
  };
}

export function monthlyPlanForMonth(
  state: Pick<MarketingState, "monthlyPlans">,
  month: string,
) {
  return state.monthlyPlans
    .filter((plan) => plan.month === month && plan.status !== "ARCHIVED")
    .sort((first, second) => second.version - first.version)[0];
}

export function commitMonthlyPlanDraft(
  state: MarketingState,
  draft: MonthlyPlanDraft,
  now = new Date().toISOString(),
) {
  const beforePlan = monthlyPlanForMonth(state, draft.plan.month);
  const existingKeys = new Set(
    state.calendarItems
      .filter((item) => item.date.startsWith(draft.plan.month))
      .map(
        (item) =>
          `${item.date}|${item.type}|${item.title.trim().toLocaleLowerCase("cs-CZ")}`,
      ),
  );
  const safeNewItems = draft.items.filter(
    (item) =>
      !existingKeys.has(
        `${item.date}|${item.type}|${item.title.trim().toLocaleLowerCase("cs-CZ")}`,
      ),
  );
  const plan: MonthlyPlan = {
    ...draft.plan,
    id: crypto.randomUUID(),
    version: (beforePlan?.version ?? 0) + 1,
    createdAt: beforePlan?.createdAt ?? now,
    updatedAt: now,
    status: "READY_FOR_REVIEW",
  };
  const data = structuredClone(dataFromState(state));
  if (beforePlan)
    data.monthlyPlans = data.monthlyPlans.map((entry) =>
      entry.id === beforePlan.id
        ? { ...entry, status: "ARCHIVED" as const, updatedAt: now }
        : entry,
    );
  data.monthlyPlans.push(plan);
  data.calendarItems.push(...safeNewItems);
  return auditedState(
    state,
    data,
    "generate_monthly_plan",
    `Připraven návrh plánu ${draft.plan.month}, přidáno ${safeNewItems.length} položek.`,
    now,
  );
}

export function approveMonthlyPlan(
  state: MarketingState,
  month: string,
  approvedBy = "local-demo-user",
  now = new Date().toISOString(),
) {
  const plan = monthlyPlanForMonth(state, month);
  if (!plan) throw new Error("Pro zvolený měsíc neexistuje plán ke schválení.");
  const data = structuredClone(dataFromState(state));
  data.monthlyPlans = data.monthlyPlans.map((entry) =>
    entry.id === plan.id
      ? {
          ...entry,
          status: "APPROVED" as const,
          approvedAt: now,
          approvedBy,
          updatedAt: now,
        }
      : entry,
  );
  data.calendarItems = data.calendarItems.map((item) =>
    item.date.startsWith(month) && item.state === "draft"
      ? { ...item, state: "planned" }
      : item,
  );
  return auditedState(
    state,
    data,
    "approve_monthly_plan",
    `Schválen plán ${month}, verze ${plan.version}.`,
    now,
  );
}

export function updateCalendarWithAudit(
  state: MarketingState,
  nextItems: CalendarStoreItem[],
  summary: string,
  affectedMonths: string[],
  now = new Date().toISOString(),
) {
  const data = structuredClone(dataFromState(state));
  data.calendarItems = nextItems.map((item) => calendarItemSchema.parse(item));
  data.monthlyPlans = data.monthlyPlans.map((plan) =>
    affectedMonths.includes(plan.month) && plan.status === "APPROVED"
      ? {
          ...plan,
          status: "DRAFT" as const,
          version: plan.version + 1,
          approvedAt: undefined,
          approvedBy: undefined,
          updatedAt: now,
        }
      : plan,
  );
  [...new Set(affectedMonths)].forEach((month) => {
    if (
      !monthlyPlanForMonth(
        { ...state, monthlyPlans: data.monthlyPlans },
        month,
      ) &&
      data.calendarItems.some((item) => item.date.startsWith(month))
    )
      data.monthlyPlans.push({
        id: crypto.randomUUID(),
        month,
        goal: "Doplnit cíl ručně vytvořeného plánu",
        theme: "Vlastní měsíční plán",
        status: "DRAFT",
        source: "MANUAL",
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
  });
  return auditedState(state, data, "edit_calendar", summary, now);
}

function importItemToCalendar(
  item: PlanImportItem,
  source: PlanImportCommit["source"],
  batchId: string,
): StoredCalendarItem {
  return calendarItemSchema.parse({
    id: crypto.randomUUID(),
    date: item.date,
    type: item.type,
    title: item.title,
    state: "draft",
    source,
    externalId: item.externalId,
    platform: item.platform,
    formatLabel: item.formatLabel,
    goal: item.goal,
    campaign: item.campaign,
    cta: item.cta,
    caption: item.caption,
    graphicText: item.graphicText,
    hashtags: item.hashtags,
    notes: item.notes,
    storySlideCount: item.storySlideCount,
    storyFrames: item.storyFrames,
    visualDirection: item.visualDirection,
    sourceUrl: item.sourceUrl,
    importBatchId: batchId,
  });
}

function importResolutionForItem(
  item: PlanImportItem,
  commit: PlanImportCommit,
) {
  if (commit.mode === "replace") return "add" as const;
  if (!item.duplicateOf) return "add" as const;
  return (
    commit.resolutions[item.rowNumber] ??
    (commit.mode === "update" ? "update" : "skip")
  );
}

export function summarizePlanImport(
  commit: PlanImportCommit,
): PlanImportChangeSummary {
  const changedItems = commit.items.filter(
    (item) => importResolutionForItem(item, commit) !== "skip",
  );
  return {
    changed: changedItems.length,
    skipped: commit.items.length - changedItems.length,
    months: [...new Set(changedItems.map((item) => item.date.slice(0, 7)))],
  };
}

export function commitPlanImport(
  state: MarketingState,
  commit: PlanImportCommit,
  now = new Date().toISOString(),
) {
  if (!commit.items.length)
    throw new Error("Import neobsahuje žádné platné řádky.");
  const changeSummary = summarizePlanImport(commit);
  if (changeSummary.changed === 0) return state;
  const data = structuredClone(dataFromState(state));
  const batchId = crypto.randomUUID();
  const months = changeSummary.months;
  if (commit.mode === "replace") {
    const approvedMonth = months.find(
      (month) => monthlyPlanForMonth(state, month)?.status === "APPROVED",
    );
    if (approvedMonth && !commit.allowReplaceApproved)
      throw new Error(
        `Plán ${approvedMonth} je schválený. Nahrazení vyžaduje zvláštní potvrzení.`,
      );
    data.calendarItems = data.calendarItems.filter(
      (item) => !months.includes(item.date.slice(0, 7)),
    );
  }

  const addedIds: string[] = [];
  commit.items.forEach((item) => {
    const resolution = importResolutionForItem(item, commit);
    if (resolution === "skip") return;
    const imported = importItemToCalendar(item, commit.source, batchId);
    if (resolution === "update" && item.duplicateOf) {
      imported.id = item.duplicateOf;
      data.calendarItems = data.calendarItems.map((current) =>
        current.id === item.duplicateOf ? imported : current,
      );
    } else {
      data.calendarItems.push(imported);
    }
    addedIds.push(imported.id);
  });

  months.forEach((month) => {
    const previous = monthlyPlanForMonth(state, month);
    if (previous)
      data.monthlyPlans = data.monthlyPlans.map((plan) =>
        plan.id === previous.id
          ? { ...plan, status: "ARCHIVED" as const, updatedAt: now }
          : plan,
      );
    data.monthlyPlans.push({
      id: crypto.randomUUID(),
      month,
      goal:
        commit.items.find((item) => item.date.startsWith(month))?.goal ??
        "Zkontrolovat a doplnit importovaný plán",
      theme: `Import z ${commit.fileName}`,
      status: "DRAFT",
      source: commit.source,
      version: (previous?.version ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });
  });
  data.importBatches.unshift({
    id: batchId,
    fileName: commit.fileName,
    source: commit.source,
    previewToken: commit.previewToken,
    committedAt: now,
    itemIds: addedIds,
    months,
    rowCount: addedIds.length,
  });
  return auditedState(
    state,
    data,
    "import_monthly_plan",
    `Importován soubor ${commit.fileName}: ${addedIds.length} položek do ${months.join(", ")}.`,
    now,
  );
}

export function applyMarketingProposal(
  state: MarketingState,
  proposal: MarketingProposal,
  now = new Date().toISOString(),
): MarketingState {
  const data = structuredClone(dataFromState(state));
  let summary = "";

  if (proposal.tool === "reschedule_content") {
    const contentId = proposal.args.contentId;
    const targetDate = proposal.args.to;
    const originalDate = proposal.args.from;
    if (
      !contentId ||
      !targetDate ||
      !z.iso.date().safeParse(targetDate).success
    )
      throw new Error("Návrh přesunu nemá platný obsah nebo datum.");
    const item = data.calendarItems.find((entry) => entry.id === contentId);
    if (!item) throw new Error("Přesouvaný obsah už v kalendáři neexistuje.");
    if (originalDate && item.date !== originalDate)
      throw new Error("Obsah byl mezitím změněn. Připrav nový návrh přesunu.");
    data.calendarItems = data.calendarItems.map((entry) =>
      entry.id === contentId ? { ...entry, date: targetDate } : entry,
    );
    summary = `Přesunuto „${item.title}“ z ${item.date} na ${targetDate}.`;
  } else if (proposal.tool === "record_published_content") {
    const parsed = publishedSchema.safeParse({
      id: proposal.id,
      date: proposal.args.date,
      type: proposal.args.type,
      topic: proposal.args.topic,
      recordedAt: now,
    });
    if (!parsed.success)
      throw new Error("Zápis publikovaného obsahu není platný.");
    data.published = [parsed.data, ...data.published];
    summary = `Zapsán publikovaný obsah „${parsed.data.topic}“.`;
  } else {
    const text = proposal.args.text?.trim();
    if (!text) throw new Error("Nápad nemá žádný text.");
    data.ideas = [
      { id: proposal.id, text, createdAt: now, status: "idea" },
      ...data.ideas,
    ];
    summary = `Uložen nápad „${text.slice(0, 70)}“.`;
  }

  return auditedState(state, data, proposal.tool, summary, now);
}

export function undoLastMarketingAction(state: MarketingState): MarketingState {
  const action = state.audit[0];
  if (!action?.reversible || !action.before)
    throw new Error("Není k dispozici žádná vratná změna.");
  return {
    version: 2,
    ...action.before,
    audit: [
      {
        id: crypto.randomUUID(),
        action: "undo",
        summary: `Vráceno: ${action.summary}`,
        createdAt: new Date().toISOString(),
        reversible: false,
      },
      ...state.audit.map((entry) =>
        entry.id === action.id ? { ...entry, reversible: false } : entry,
      ),
    ],
  };
}

export function canUndoLastMarketingAction(state: MarketingState) {
  const action = state.audit[0];
  return Boolean(action?.reversible && action.before);
}

export function canUndoLatestImport(state: MarketingState) {
  return (
    state.audit[0]?.action === "import_monthly_plan" &&
    canUndoLastMarketingAction(state)
  );
}

export function saveMarketingState(state: MarketingState) {
  const serialized = JSON.stringify(state);
  window.localStorage.setItem(MARKETING_STATE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(MARKETING_STATE_EVENT));
}

export function loadMarketingState(
  fallbackCalendarItems: CalendarStoreItem[] = [],
) {
  return parseMarketingState(
    window.localStorage.getItem(MARKETING_STATE_KEY),
    fallbackCalendarItems,
  );
}

export function updateMarketingState(
  updater: (state: MarketingState) => MarketingState,
  fallbackCalendarItems: CalendarStoreItem[] = [],
) {
  const current = loadMarketingState(fallbackCalendarItems);
  const next = updater(current);
  saveMarketingState(next);
  return next;
}
