import { z } from "zod";

export const monthlyPlanStatusSchema = z.enum([
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED",
  "ARCHIVED",
]);

export const monthlyPlanSchema = z.object({
  id: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  goal: z.string().min(1),
  theme: z.string().min(1),
  status: monthlyPlanStatusSchema,
  source: z.enum(["MANUAL", "AI_PLAN", "XLSX_IMPORT", "CSV_IMPORT"]),
  version: z.number().int().positive(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  approvedAt: z.string().min(1).optional(),
  approvedBy: z.string().min(1).optional(),
});

export const planningSettingsSchema = z.object({
  draftDay: z.number().int().min(1).max(28).default(20),
  reminderDay: z.number().int().min(1).max(28).default(25),
  timezone: z.literal("Europe/Prague").default("Europe/Prague"),
});

export type MonthlyPlan = z.infer<typeof monthlyPlanSchema>;
export type PlanningSettings = z.infer<typeof planningSettingsSchema>;

export type GeneratedPlanItem = {
  id: string;
  date: string;
  type: "STORY" | "REEL" | "POST" | "ÚKOL";
  title: string;
  state: "draft";
  source: "AI_PLAN";
  goal: string;
};

export type MonthlyPlanDraftInput = {
  month: string;
  goal?: string;
  theme?: string;
  campaign?: string;
  constraints?: string;
  storyEveryDays?: number;
};

export type MonthlyPlanDraft = {
  plan: MonthlyPlan;
  items: GeneratedPlanItem[];
  summary: {
    stories: number;
    reels: number;
    posts: number;
    tasks: number;
  };
};

export const DEFAULT_PLANNING_SETTINGS: PlanningSettings = {
  draftDay: 20,
  reminderDay: 25,
  timezone: "Europe/Prague",
};

function daysInMonth(month: string) {
  const [yearText = "2026", monthText = "01"] = month.split("-");
  return new Date(Number(yearText), Number(monthText), 0).getDate();
}

function isoDate(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function safeCadence(value?: number) {
  return Math.min(7, Math.max(2, Math.round(value ?? 3)));
}

export function createMonthlyPlanDraft(
  input: MonthlyPlanDraftInput,
  now = new Date().toISOString(),
): MonthlyPlanDraft {
  if (!/^\d{4}-\d{2}$/.test(input.month))
    throw new Error("Měsíc musí mít formát YYYY-MM.");
  const goal = input.goal?.trim() || "Budovat povědomí a rezervace MyFit";
  const theme = input.theme?.trim() || "Čas a prostor jen pro sebe";
  const campaign = input.campaign?.trim();
  const constraints = input.constraints?.trim();
  const totalDays = daysInMonth(input.month);
  const items: GeneratedPlanItem[] = [];
  const cadence = safeCadence(input.storyEveryDays);
  const titleSuffix = campaign ? ` · ${campaign}` : "";

  for (let day = 2; day <= totalDays; day += cadence) {
    items.push({
      id: crypto.randomUUID(),
      date: isoDate(input.month, day),
      type: "STORY",
      title: `${theme}${titleSuffix}`,
      state: "draft",
      source: "AI_PLAN",
      goal,
    });
  }

  for (let day = 6, week = 0; day <= totalDays; day += 7, week += 1) {
    const type = week % 2 === 0 ? "REEL" : "POST";
    items.push({
      id: crypto.randomUUID(),
      date: isoDate(input.month, day),
      type,
      title:
        type === "REEL"
          ? `MyFit v klidu · ${theme}`
          : `Prostor jen pro tebe · ${theme}`,
      state: "draft",
      source: "AI_PLAN",
      goal,
    });
  }

  const taskDays = [1, Math.min(15, totalDays), Math.max(1, totalDays - 3)];
  const taskTitles = [
    "Zkontrolovat podklady a fotografie",
    "Připravit obsah na druhou polovinu měsíce",
    "Vyhodnotit měsíční komunikaci",
  ];
  taskDays.forEach((day, index) => {
    items.push({
      id: crypto.randomUUID(),
      date: isoDate(input.month, day),
      type: "ÚKOL",
      title: constraints
        ? `${taskTitles[index]} · zohlednit: ${constraints}`
        : taskTitles[index]!,
      state: "draft",
      source: "AI_PLAN",
      goal,
    });
  });

  items.sort((first, second) => first.date.localeCompare(second.date));
  const count = (type: GeneratedPlanItem["type"]) =>
    items.filter((item) => item.type === type).length;

  return {
    plan: {
      id: crypto.randomUUID(),
      month: input.month,
      goal,
      theme,
      status: "READY_FOR_REVIEW",
      source: "AI_PLAN",
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    items,
    summary: {
      stories: count("STORY"),
      reels: count("REEL"),
      posts: count("POST"),
      tasks: count("ÚKOL"),
    },
  };
}

export function nextMonth(month: string) {
  const [yearText = "2026", monthText = "01"] = month.split("-");
  const date = new Date(Number(yearText), Number(monthText), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function planningMonthForDate(
  dateKey: string,
  settings: PlanningSettings = DEFAULT_PLANNING_SETTINGS,
) {
  const currentMonth = dateKey.slice(0, 7);
  const day = Number(dateKey.slice(8, 10));
  return day >= settings.draftDay ? nextMonth(currentMonth) : null;
}

export function shouldRemindPlanApproval(
  dateKey: string,
  plan: MonthlyPlan | undefined,
  settings: PlanningSettings = DEFAULT_PLANNING_SETTINGS,
) {
  const day = Number(dateKey.slice(8, 10));
  return day >= settings.reminderDay && plan?.status !== "APPROVED";
}
