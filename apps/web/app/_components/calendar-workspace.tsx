"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";

import { calendarItems } from "../_lib/demo-data";
import {
  calendarVisualReady,
  createCalendarVisualRequestCopy,
  createCalendarGraphic,
  createPostCarouselSlides,
  createSeriesSlideContentKit,
  getCalendarVisual,
  saveCalendarVisual,
  type CalendarContentKit,
  type CalendarSlideDraft,
  type CalendarVisualMeta,
  type SavedCalendarSlide,
  type SavedCalendarVisual,
} from "../_lib/calendar-visual";
import {
  myfitVisualTemplates,
  type MyfitStoryComposition,
  type MyfitVisualTemplate,
} from "../_lib/myfit-visual-system";
import {
  approveMonthlyPlan,
  canUndoLatestImport,
  commitMonthlyPlanDraft,
  loadMarketingState,
  MARKETING_STATE_EVENT,
  monthlyPlanForMonth,
  saveMarketingState,
  undoLastMarketingAction,
  updateCalendarWithAudit,
  type CalendarStoreItem,
} from "../_lib/marketing-store";
import {
  createMonthlyPlanDraft,
  planningMonthForDate,
  type MonthlyPlan,
  type MonthlyPlanDraft,
} from "../_lib/monthly-plan";
import { pragueDateKey } from "../_lib/task-schedule";
import { createStoryFrames } from "../_lib/story-series";
import { PlanImportDialog } from "./plan-import-dialog";

type CalendarItem = CalendarStoreItem;

type ContentKitResponse = {
  data?: { mode: "live" | "demo"; kit: CalendarContentKit };
  error?: { message: string };
};

type VisualResponse = {
  data?: {
    mode: "live" | "demo";
    imageDataUrl: string | null;
    template: MyfitVisualTemplate;
    composition: MyfitStoryComposition;
  };
  error?: { message: string };
};

type VisualMeta = Record<string, CalendarVisualMeta>;

type AgentMessage = { role: "user" | "assistant"; text: string };

type VisualSeriesFrame = CalendarSlideDraft;

const brandBenefitPoints = [
  {
    headline: "Soukromí",
    message: "Celé studio máš jen pro sebe.",
  },
  {
    headline: "Bez čekání",
    message: "Cvičíš tehdy, kdy chceš.",
  },
  {
    headline: "Klid",
    message: "Bez davů. Bez rušení.",
  },
];

function graphicSupportingPoints(frames: VisualSeriesFrame[]) {
  const contentPoints = frames
    .filter((frame) => frame.role !== "hook" && frame.role !== "cta")
    .map((frame) => ({
      headline: frame.headline,
      message: frame.message,
    }));
  const points = [...contentPoints, ...brandBenefitPoints];
  return points
    .filter(
      (point, index) =>
        points.findIndex(
          (candidate) =>
            candidate.headline.toLocaleLowerCase("cs-CZ") ===
            point.headline.toLocaleLowerCase("cs-CZ"),
        ) === index,
    )
    .slice(0, 3);
}

const STORAGE_KEY = "myfit-calendar-items-v2";
const VISUAL_META_KEY = "myfit-calendar-visual-meta";
const weekdays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const filters = ["Vše", "Story", "Reel", "Post", "Úkoly"];

const augustItems: CalendarItem[] = calendarItems.map((item, index) => ({
  id: `august-${index + 1}`,
  date: `2026-08-${String(item.day).padStart(2, "0")}`,
  type: item.type,
  title: item.title,
  state: item.state,
  source: "MANUAL",
}));
const defaultItems = augustItems;

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(month: string) {
  const [yearText = "2026", monthText = "01"] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const label = new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
  return label.charAt(0).toLocaleUpperCase("cs-CZ") + label.slice(1);
}

function contentCopy(item: CalendarItem) {
  const importedFormat = [item.platform, item.formatLabel]
    .filter(Boolean)
    .join(" · ");
  const importedMessage = item.graphicText || item.goal;
  if (item.type === "REEL")
    return {
      message:
        importedMessage || "Krátký a snadno natočitelný Reel s jasným úvodem.",
      cta: item.cta || "Vyber si svůj termín",
      format: importedFormat || "Scénář · shotlist · caption",
    };
  if (item.type === "POST")
    return {
      message:
        importedMessage || "Klidný prémiový příspěvek navázaný na téma měsíce.",
      cta: item.cta || "Rezervovat termín",
      format: importedFormat || "Grafika 4:5 · caption · CTA",
    };
  return {
    message:
      importedMessage ||
      "Krátká Story série s jedním hlavním sdělením a výzvou.",
    cta: item.cta || "Rezervovat termín",
    format: importedFormat || "Story 9:16 · texty · vizuální pokyny",
  };
}

function usefulFallbackHeadline(item: CalendarItem) {
  const normalized = item.title.toLocaleLowerCase("cs-CZ");
  if (normalized.includes("anketa"))
    return "CO JE PRO TEBE PŘI TRÉNINKU NEJDŮLEŽITĚJŠÍ?";
  if (normalized.includes("benefit")) return "TVŮJ PROSTOR. TVÉ TEMPO.";
  if (normalized.includes("soukrom")) return "CELÉ FITNESS. JEN PRO TEBE.";
  return item.title;
}

function defaultContentKit(item: CalendarItem): CalendarContentKit {
  const copy = contentCopy(item);
  const isPoll = item.title.toLocaleLowerCase("cs-CZ").includes("anketa");
  const importedHeadline = item.graphicText
    ?.split("\n")
    .find((line) => line.trim())
    ?.trim();
  const headline = importedHeadline || usefulFallbackHeadline(item);
  const caption =
    item.caption ||
    (isPoll
      ? "Co je pro tebe při tréninku nejdůležitější — soukromí, klid, nebo možnost cvičit ve vlastním tempu? Napiš nám svůj pohled."
      : `${item.title}. V MyFit máš prostor jen pro sebe a můžeš se soustředit na svůj trénink.`);
  const message = isPoll
    ? "Jednoduchá komunitní otázka s konkrétními možnostmi a výzvou k odpovědi."
    : copy.message;
  const theme = [item.title, item.goal, item.campaign]
    .filter(Boolean)
    .join("; ");
  const kit: CalendarContentKit = {
    headline,
    message,
    caption,
    cta: copy.cta,
    theme: theme || `${item.title}; soukromé fitness, klid a vlastní tempo`,
    visualDirection:
      item.visualDirection ||
      (item.type === "POST"
        ? "Světlá boutique fotografie privátního studia, přirozené teplé slunce, champagne a krémová, černé stroje jen jako detail."
        : "Teplá reálná fotografie MyFit, krémový prostor, tlumená zlatá a klidná prémiová kompozice."),
    textVariants: [
      {
        id: "short",
        label: "Stručná",
        headline,
        message: "Vlastní tempo. Vlastní prostor. Bez čekání.",
        caption:
          item.caption ||
          `${item.title}. Dopřej si trénink v klidu a soukromí.`,
        cta: copy.cta,
      },
      {
        id: "premium",
        label: "Prémiová",
        headline,
        message,
        caption,
        cta: copy.cta,
      },
      {
        id: "personal",
        label: "Osobnější",
        headline: "Čas jen pro tebe",
        message: "Zacvič si. Vyčisti hlavu. Nabij tělo.",
        caption: `Někdy stačí mít chvíli jen pro sebe. ${item.title} v MyFit znamená klid a žádné čekání.`,
        cta: "Vybrat svůj čas",
      },
    ],
  };
  if (item.type === "POST")
    kit.slides = createPostCarouselSlides(item.title, kit);
  if (item.type === "STORY")
    kit.slides = [
      {
        position: 1,
        role: "hook",
        headline,
        message: isPoll ? "Vyber jednu možnost." : copy.message,
        visualDirection:
          "Silný úvodní slide s velkým headline, světlým mléčným přechodem a teplým studiem vpravo.",
      },
      {
        position: 2,
        role: "detail",
        headline: isPoll ? "SOUKROMÍ, KLID, NEBO VOLNOST?" : "TVŮJ PROSTOR",
        message: isPoll
          ? "Co rozhoduje o tom, že se ti cvičí dobře?"
          : "Klid, soukromí a vlastní tempo bez čekání.",
        visualDirection:
          "Konkrétní informace, tenká outline ikona a čistý architektonický detail privátního studia.",
      },
      {
        position: 3,
        role: "cta",
        headline: isPoll ? "NAPIŠ NÁM SVŮJ POHLED" : "ČAS PRO SEBE",
        message: isPoll
          ? "Zajímá nás, co ti v MyFit vyhovuje nejvíc."
          : "Vyber si chvíli, která patří jen tobě.",
        visualDirection:
          "Vzdušný závěrečný slide, jemné srdce nebo šipka a čistý prostor pro CTA.",
        cta: isPoll ? item.cta || "Odpověz nám" : copy.cta,
      },
    ];
  return kit;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function readinessFor(item: CalendarItem, visualReady: boolean) {
  if (visualReady)
    return { state: "ready", label: "Grafika připravená", detail: "✓" };
  const publishingDate = new Date(`${item.date}T12:00:00`);
  const preparationDate = new Date(publishingDate);
  preparationDate.setDate(preparationDate.getDate() - 7);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (today >= publishingDate)
    return {
      state: "late",
      label: "Grafika chybí",
      detail: "Připravit nyní",
    };
  if (today >= preparationDate)
    return {
      state: "due",
      label: "Je čas připravit grafiku",
      detail: "Do publikace zbývá nejvýše 7 dní",
    };
  return {
    state: "scheduled",
    label: `Příprava od ${formatDate(toIsoDate(preparationDate))}`,
    detail: "Vygenerovat lze i dříve",
  };
}

export function CalendarWorkspace() {
  const [items, setItems] = useState<CalendarItem[]>(defaultItems);
  const [viewMonth, setViewMonth] = useState("2026-08");
  const [filter, setFilter] = useState("Vše");
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("STORY");
  const [date, setDate] = useState("2026-08-13");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("STORY");
  const [editDate, setEditDate] = useState("");
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [planGoal, setPlanGoal] = useState("");
  const [planTheme, setPlanTheme] = useState("");
  const [planCampaign, setPlanCampaign] = useState("");
  const [planConstraints, setPlanConstraints] = useState("");
  const [storyEveryDays, setStoryEveryDays] = useState(3);
  const [planBusy, setPlanBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [visualMeta, setVisualMeta] = useState<VisualMeta>({});
  const [activeVisual, setActiveVisual] = useState<SavedCalendarVisual | null>(
    null,
  );
  const [contentKit, setContentKit] = useState<CalendarContentKit | null>(null);
  const [kitMode, setKitMode] = useState<"live" | "demo" | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("premium");
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [visualBusy, setVisualBusy] = useState(false);
  const [storyBusyPositions, setStoryBusyPositions] = useState<number[]>([]);
  const [lastImportUndo, setLastImportUndo] = useState(false);
  const [eventAgentMessage, setEventAgentMessage] = useState("");
  const [eventAgentBusy, setEventAgentBusy] = useState(false);
  const [eventAgentEntries, setEventAgentEntries] = useState<AgentMessage[]>(
    [],
  );

  useEffect(() => {
    function hydrate() {
      let marketingState = loadMarketingState(defaultItems);
      const automaticMonth = planningMonthForDate(
        pragueDateKey(),
        marketingState.planningSettings,
      );
      if (
        automaticMonth &&
        !monthlyPlanForMonth(marketingState, automaticMonth) &&
        !marketingState.calendarItems.some((item) =>
          item.date.startsWith(automaticMonth),
        )
      ) {
        marketingState = commitMonthlyPlanDraft(
          marketingState,
          createMonthlyPlanDraft({ month: automaticMonth }),
        );
        saveMarketingState(marketingState);
      }
      setItems(marketingState.calendarItems);
      setMonthlyPlans(marketingState.monthlyPlans);
      setLastImportUndo(canUndoLatestImport(marketingState));
      const savedVisualMeta = window.localStorage.getItem(VISUAL_META_KEY);
      if (savedVisualMeta) {
        try {
          const parsed = JSON.parse(savedVisualMeta) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            setVisualMeta(parsed as VisualMeta);
        } catch {
          window.localStorage.removeItem(VISUAL_META_KEY);
        }
      }
    }
    const frameId = window.requestAnimationFrame(hydrate);
    window.addEventListener(MARKETING_STATE_EVENT, hydrate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MARKETING_STATE_EVENT, hydrate);
    };
  }, []);

  const calendarDays = useMemo(() => {
    const [yearText = "2026", monthText = "01"] = viewMonth.split("-");
    const year = Number(yearText);
    const monthNumber = Number(monthText);
    const firstDay = new Date(year, monthNumber - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const value = new Date(year, monthNumber - 1, index - mondayOffset + 1);
      return {
        date: toIsoDate(value),
        day: value.getDate(),
        outside: value.getMonth() !== monthNumber - 1,
      };
    });
  }, [viewMonth]);

  const visibleItems = useMemo(() => {
    if (filter === "Vše") return items;
    const normalizedFilter = filter === "Úkoly" ? "ÚKOL" : filter.toUpperCase();
    return items.filter((item) => item.type === normalizedFilter);
  }, [filter, items]);

  const editingItem = items.find((item) => item.id === editingId);
  const currentPlan = monthlyPlanForMonth({ monthlyPlans }, viewMonth);
  const currentMonthItems = items.filter((item) =>
    item.date.startsWith(viewMonth),
  );
  const currentMonthSummary = {
    stories: currentMonthItems.filter((item) => item.type === "STORY").length,
    reels: currentMonthItems.filter((item) => item.type === "REEL").length,
    posts: currentMonthItems.filter((item) => item.type === "POST").length,
    tasks: currentMonthItems.filter((item) => item.type === "ÚKOL").length,
  };
  const editingContent = editingItem ? contentCopy(editingItem) : null;
  const editingStoryFrames =
    editingItem?.type === "STORY"
      ? editingItem.storyFrames?.length
        ? [...editingItem.storyFrames].sort(
            (first, second) => first.position - second.position,
          )
        : createStoryFrames({
            title: editingItem.title,
            graphicText: editingItem.graphicText,
            visualDirection: editingItem.visualDirection,
            cta: editingItem.cta,
            count: editingItem.storySlideCount ?? 3,
          })
      : [];
  const selectedTextVariant =
    contentKit?.textVariants.find(
      (variant) => variant.id === selectedVariantId,
    ) ?? contentKit?.textVariants[0];
  const selectedKit =
    contentKit && selectedTextVariant
      ? {
          ...contentKit,
          headline: selectedTextVariant.headline,
          message: selectedTextVariant.message,
          caption: selectedTextVariant.caption,
          cta: selectedTextVariant.cta,
        }
      : contentKit;
  const editingVisualFrames: VisualSeriesFrame[] =
    editingItem?.type === "STORY"
      ? !editingItem.storyFrames?.length && selectedKit?.slides?.length
        ? selectedKit.slides
        : editingStoryFrames.map((frame, index) => ({
            position: frame.position,
            role:
              index === 0
                ? "hook"
                : index === editingStoryFrames.length - 1
                  ? "cta"
                  : "detail",
            headline: frame.text.split("\n")[0]?.trim() || editingItem.title,
            message: frame.text.replace(/\n+/g, " ").trim(),
            visualDirection: frame.direction,
            cta:
              index === editingStoryFrames.length - 1
                ? editingItem.cta || selectedKit?.cta
                : undefined,
          }))
      : editingItem?.type === "POST" && selectedKit
        ? createPostCarouselSlides(editingItem.title, selectedKit)
        : [];
  const isVisualSeries =
    (editingItem?.type === "STORY" && editingVisualFrames.length > 1) ||
    (editingItem?.type === "POST" && editingVisualFrames.length > 1);
  const persistedSeriesSlides =
    activeVisual?.slides ?? activeVisual?.storySlides ?? [];
  const activeSeriesSlides: SavedCalendarSlide[] =
    editingItem?.type === "POST" &&
    activeVisual &&
    !persistedSeriesSlides.length
      ? [
          {
            position: 1,
            dataUrl: activeVisual.dataUrl,
            generatedAt: activeVisual.generatedAt,
            mode: activeVisual.mode,
            version: 1,
            kit: activeVisual.kit,
          },
        ]
      : persistedSeriesSlides;
  const editingReadiness = editingItem
    ? readinessFor(
        editingItem,
        calendarVisualReady(
          editingItem,
          visualMeta[editingItem.id],
          isVisualSeries ? activeSeriesSlides.length : undefined,
          isVisualSeries ? editingVisualFrames.length : undefined,
        ),
      )
    : null;

  function persistItems(
    nextItems: CalendarItem[],
    summary: string,
    affectedMonths: string[],
  ) {
    const state = loadMarketingState(defaultItems);
    const next = updateCalendarWithAudit(
      state,
      nextItems,
      summary,
      affectedMonths,
    );
    saveMarketingState(next);
    setItems(next.calendarItems);
    setMonthlyPlans(next.monthlyPlans);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function changeMonth(offset: number) {
    const [yearText = "2026", monthText = "01"] = viewMonth.split("-");
    const year = Number(yearText);
    const monthNumber = Number(monthText);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setViewMonth(nextMonth);
    setDate(`${nextMonth}-01`);
  }

  function addItem() {
    if (!title.trim()) return;
    const nextItems = [
      ...items,
      {
        id: crypto.randomUUID(),
        date,
        type,
        title: title.trim(),
        state: "draft",
      },
    ];
    persistItems(nextItems, `Přidán obsah „${title.trim()}“.`, [
      date.slice(0, 7),
    ]);
    setTitle("");
    setFormOpen(false);
    setViewMonth(date.slice(0, 7));
    setNotice("Obsah byl přidán do kalendáře.");
  }

  async function openEditor(item: CalendarItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditType(item.type);
    setEditDate(item.date);
    setSelectedVariantId("premium");
    setAgentSteps([]);
    setEventAgentMessage("");
    setEventAgentEntries([
      {
        role: "assistant",
        text: `Pracuji jen s událostí „${item.title}“. Můžeme upravit text, tón, CTA, vizuální směr nebo vytvořit novou grafiku.`,
      },
    ]);
    if (item.type === "ÚKOL") {
      setContentKit(null);
      setActiveVisual(null);
      return;
    }
    const immediateKit = defaultContentKit(item);
    setContentKit(immediateKit);
    setKitMode(null);
    setActiveVisual(null);
    try {
      const savedVisual = await getCalendarVisual(item.id);
      if (savedVisual) {
        setActiveVisual(savedVisual);
        setContentKit(savedVisual.kit);
        setKitMode(savedVisual.mode);
      }
    } catch {
      setNotice("Uložený náhled grafiky se nepodařilo načíst.");
    }
  }

  async function prepareContentKit(item: CalendarItem, instruction?: string) {
    const response = await fetch("/api/v1/ai/content-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        title: item.title,
        type: item.type,
        date: item.date,
        instruction,
        memory: loadMarketingState(defaultItems).agentMemory,
        brief: {
          platform: item.platform,
          formatLabel: item.formatLabel,
          goal: item.goal,
          campaign: item.campaign,
          cta: item.cta,
          caption: item.caption,
          graphicText: item.graphicText,
          hashtags: item.hashtags,
          notes: item.notes,
          visualDirection: item.visualDirection,
        },
      }),
    });
    const result = (await response.json()) as ContentKitResponse;
    if (!response.ok || !result.data)
      throw new Error(result.error?.message ?? "Agent podklady nepřipravil.");
    setContentKit(result.data.kit);
    setKitMode(result.data.mode);
    return result.data;
  }

  async function generateVisual() {
    if (!editingItem || editingItem.type === "ÚKOL" || !contentKit) return;
    if (isVisualSeries) {
      await generateVisualSeries();
      return;
    }
    setVisualBusy(true);
    setAgentSteps(["Obsahový agent analyzuje cíl události…"]);
    try {
      let activeKit = contentKit;
      if (!kitMode) {
        const prepared = await prepareContentKit(
          editingItem,
          `Připrav podklady v tónu varianty ${selectedVariantId}.`,
        );
        activeKit = prepared.kit;
      }
      const selectedVariant =
        activeKit.textVariants.find(
          (variant) => variant.id === selectedVariantId,
        ) ?? activeKit.textVariants[0];
      if (!selectedVariant) throw new Error("Chybí textová varianta.");
      const finalKit: CalendarContentKit = {
        ...activeKit,
        headline: selectedVariant.headline,
        message: selectedVariant.message,
        caption: selectedVariant.caption,
        cta: selectedVariant.cta,
      };
      setAgentSteps((current) => [
        ...current,
        `Text hotový · ${selectedVariant.label}`,
        "Brand agent kontroluje barvy, tón a kompozici MyFit…",
      ]);
      const isPost = editingItem.type === "POST";
      const template: MyfitVisualTemplate = isPost
        ? "post_announcement"
        : "story_private_benefit";
      const composition: MyfitStoryComposition = activeVisual
        ? "photo_forward"
        : "editorial_split";
      const requestCopy = createCalendarVisualRequestCopy(finalKit);
      const visualResponse = await fetch("/api/v1/ai/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestCopy,
          format: isPost ? "post" : "story",
          template,
          composition,
          memory: loadMarketingState(defaultItems).agentMemory,
        }),
      });
      const visualResult = (await visualResponse.json()) as VisualResponse;
      if (!visualResponse.ok || !visualResult.data)
        throw new Error(
          visualResult.error?.message ?? "Grafický agent nedokončil návrh.",
        );
      setAgentSteps((current) => [
        ...current,
        "Grafický agent vytváří fotografický podklad…",
      ]);
      const background =
        visualResult.data.imageDataUrl ??
        myfitVisualTemplates[visualResult.data.template].backgroundAsset;
      const dataUrl = await createCalendarGraphic(
        editingItem.type,
        finalKit,
        background,
      );
      const savedVisual: SavedCalendarVisual = {
        itemId: editingItem.id,
        dataUrl,
        generatedAt: new Date().toISOString(),
        mode: visualResult.data.mode,
        kit: finalKit,
      };
      await saveCalendarVisual(savedVisual);
      setActiveVisual(savedVisual);
      setContentKit(finalKit);
      const nextMeta = {
        ...visualMeta,
        [editingItem.id]: {
          generatedAt: savedVisual.generatedAt,
          mode: savedVisual.mode,
          storySlideCount: editingStoryFrames.length,
        },
      };
      setVisualMeta(nextMeta);
      window.localStorage.setItem(VISUAL_META_KEY, JSON.stringify(nextMeta));
      setAgentSteps((current) => [
        ...current,
        "Grafika složená a uložená ke konkrétní události ✓",
      ]);
      setNotice(
        savedVisual.mode === "live"
          ? "AI agent připravil text i grafiku a uložil je ke kalendáři."
          : "Byl použit demo fotografický podklad. Pro skutečnou AI grafiku je potřeba připojit OpenAI API klíč v Netlify.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Agent návrh nedokončil.";
      setAgentSteps((current) => [...current, `Nedokončeno: ${message}`]);
      setNotice(message);
    } finally {
      setVisualBusy(false);
    }
  }

  async function resolveSelectedKit() {
    if (!editingItem || !contentKit)
      throw new Error("Chybí podklady události.");
    let activeKit = contentKit;
    if (!kitMode) {
      const prepared = await prepareContentKit(
        editingItem,
        `Připrav podklady v tónu varianty ${selectedVariantId}.`,
      );
      activeKit = prepared.kit;
    }
    const selectedVariant =
      activeKit.textVariants.find(
        (variant) => variant.id === selectedVariantId,
      ) ?? activeKit.textVariants[0];
    if (!selectedVariant) throw new Error("Chybí textová varianta.");
    return {
      ...activeKit,
      headline: selectedVariant.headline,
      message: selectedVariant.message,
      caption: selectedVariant.caption,
      cta: selectedVariant.cta,
    };
  }

  async function createVisualSlide(
    frame: VisualSeriesFrame,
    baseKit: CalendarContentKit,
    currentSlides: SavedCalendarSlide[],
    seriesFrames: VisualSeriesFrame[],
  ) {
    if (!editingItem) throw new Error("Chybí obsahová událost.");
    const currentSlide = currentSlides.find(
      (slide) => slide.position === frame.position,
    );
    const frameKit = createSeriesSlideContentKit(baseKit, frame, {
      title: editingItem.title,
      cta: editingItem.cta,
      totalSlides: seriesFrames.length,
    });
    const composition: MyfitStoryComposition = currentSlide
      ? currentSlide.version % 2 === 1
        ? "photo_forward"
        : "editorial_split"
      : frame.position % 2 === 0
        ? "photo_forward"
        : "editorial_split";
    const requestCopy = createCalendarVisualRequestCopy(frameKit);
    const response = await fetch("/api/v1/ai/visual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...requestCopy,
        format: editingItem.type === "POST" ? "post" : "story",
        template:
          editingItem.type === "POST"
            ? "post_announcement"
            : "story_private_benefit",
        composition,
        memory: loadMarketingState(defaultItems).agentMemory,
      }),
    });
    const result = (await response.json()) as VisualResponse;
    if (!response.ok || !result.data)
      throw new Error(
        result.error?.message ??
          `Slide ${frame.position} se nepodařilo vytvořit.`,
      );
    const background =
      result.data.imageDataUrl ??
      myfitVisualTemplates[result.data.template].backgroundAsset;
    return {
      position: frame.position,
      dataUrl: await createCalendarGraphic(
        editingItem.type,
        frameKit,
        background,
        {
          position: frame.position,
          total: seriesFrames.length,
          role: frame.role,
          supportingPoints: graphicSupportingPoints(seriesFrames),
        },
      ),
      generatedAt: new Date().toISOString(),
      mode: result.data.mode,
      version: (currentSlide?.version ?? 0) + 1,
      kit: frameKit,
    } satisfies SavedCalendarSlide;
  }

  async function persistVisualSlides(
    slides: SavedCalendarSlide[],
    baseKit: CalendarContentKit,
    expectedSlides: number,
  ) {
    if (!editingItem || !slides[0]) return;
    const orderedSlides = [...slides].sort(
      (first, second) => first.position - second.position,
    );
    const firstSlide = orderedSlides[0];
    if (!firstSlide) return;
    const savedVisual: SavedCalendarVisual = {
      itemId: editingItem.id,
      dataUrl: firstSlide.dataUrl,
      generatedAt: new Date().toISOString(),
      mode: orderedSlides.some((slide) => slide.mode === "live")
        ? "live"
        : "demo",
      kit: baseKit,
      slides: orderedSlides,
      storySlides: editingItem.type === "STORY" ? orderedSlides : undefined,
    };
    await saveCalendarVisual(savedVisual);
    setActiveVisual(savedVisual);
    if (orderedSlides.length === expectedSlides) {
      const nextMeta = {
        ...visualMeta,
        [editingItem.id]: {
          generatedAt: savedVisual.generatedAt,
          mode: savedVisual.mode,
          storySlideCount:
            editingItem.type === "STORY" ? expectedSlides : undefined,
        },
      };
      setVisualMeta(nextMeta);
      window.localStorage.setItem(VISUAL_META_KEY, JSON.stringify(nextMeta));
    }
  }

  async function regenerateVisualSlide(frame: VisualSeriesFrame) {
    if (!editingItem || storyBusyPositions.includes(frame.position)) return;
    setStoryBusyPositions((current) => [...current, frame.position]);
    try {
      const baseKit = await resolveSelectedKit();
      const frames =
        editingItem.type === "POST"
          ? createPostCarouselSlides(editingItem.title, baseKit)
          : !editingItem.storyFrames?.length && baseKit.slides?.length
            ? baseKit.slides
            : editingVisualFrames;
      const slide = await createVisualSlide(
        frame,
        baseKit,
        activeSeriesSlides,
        frames,
      );
      const slides = [
        ...activeSeriesSlides.filter(
          (current) => current.position !== frame.position,
        ),
        slide,
      ];
      await persistVisualSlides(slides, baseKit, editingVisualFrames.length);
      setNotice(`Slide ${frame.position} je připravený a uložený.`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : `Slide ${frame.position} se nepodařilo vytvořit.`,
      );
    } finally {
      setStoryBusyPositions((current) =>
        current.filter((position) => position !== frame.position),
      );
    }
  }

  async function generateVisualSeries() {
    if (!editingItem || !contentKit || visualBusy) return;
    setVisualBusy(true);
    setNotice(`Tvořím sérii · 0/${editingVisualFrames.length}…`);
    try {
      const baseKit = await resolveSelectedKit();
      const frames =
        editingItem.type === "POST"
          ? createPostCarouselSlides(editingItem.title, baseKit)
          : !editingItem.storyFrames?.length && baseKit.slides?.length
            ? baseKit.slides
            : editingVisualFrames;
      let slides = [...activeSeriesSlides];
      for (const frame of frames) {
        setStoryBusyPositions([frame.position]);
        const slide = await createVisualSlide(frame, baseKit, slides, frames);
        slides = [
          ...slides.filter((current) => current.position !== frame.position),
          slide,
        ];
        await persistVisualSlides(slides, baseKit, frames.length);
        setNotice(`Tvořím sérii · ${slides.length}/${frames.length}…`);
      }
      setContentKit(baseKit);
      setNotice(
        slides.some((slide) => slide.mode === "live")
          ? `Hotovo. Připraveny ${frames.length} samostatné stránky s texty pro Canvu.`
          : `Připraveny ${frames.length} demo stránky. Pro skutečně generované fotografie je potřeba připojit OpenAI API klíč v Netlify.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Série nebyla dokončena.",
      );
    } finally {
      setStoryBusyPositions([]);
      setVisualBusy(false);
    }
  }

  function downloadVisualSeries() {
    [...activeSeriesSlides]
      .sort((first, second) => first.position - second.position)
      .forEach((slide, index) => {
        window.setTimeout(() => {
          const link = document.createElement("a");
          link.download = `myfit-${editingItem?.id ?? "obsah"}-${String(slide.position).padStart(2, "0")}.png`;
          link.href = slide.dataUrl;
          link.click();
        }, index * 180);
      });
  }

  function undoLatestImport() {
    const current = loadMarketingState(defaultItems);
    if (!canUndoLatestImport(current)) return;
    const next = undoLastMarketingAction(current);
    saveMarketingState(next);
    setItems(next.calendarItems);
    setMonthlyPlans(next.monthlyPlans);
    setLastImportUndo(false);
    setNotice("Poslední import byl vrácen.");
  }

  async function sendEventAgentMessage() {
    if (!editingItem || !eventAgentMessage.trim() || eventAgentBusy) return;
    const message = eventAgentMessage.trim();
    setEventAgentMessage("");
    setEventAgentEntries((current) => [
      ...current,
      { role: "user", text: message },
    ]);
    setEventAgentBusy(true);
    try {
      const prepared = await prepareContentKit(editingItem, message);
      setSelectedVariantId("premium");
      setEventAgentEntries((current) => [
        ...current,
        {
          role: "assistant",
          text: `Připravila jsem tři nové textové varianty a upravila vizuální směr. Vyber text níže; grafiku vytvořím až po stisknutí tlačítka, aby nevznikal zbytečný náklad. Režim: ${prepared.mode === "live" ? "živá AI" : "demo"}.`,
        },
      ]);
    } catch (error) {
      setEventAgentEntries((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Úpravu se nepodařilo připravit.",
        },
      ]);
    } finally {
      setEventAgentBusy(false);
    }
  }

  function saveEditedItem() {
    if (!editingItem || !editTitle.trim() || !editDate) return;
    const nextItems = items.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            title: editTitle.trim(),
            type: editType,
            date: editDate,
          }
        : item,
    );
    persistItems(nextItems, `Upravena událost „${editingItem.title}“.`, [
      editingItem.date.slice(0, 7),
      editDate.slice(0, 7),
    ]);
    setEditingId(null);
    setViewMonth(editDate.slice(0, 7));
    setNotice("Událost byla upravena.");
  }

  function moveItem(itemId: string, targetDate: string) {
    const movedItem = items.find((item) => item.id === itemId);
    if (!movedItem || movedItem.date === targetDate) return;
    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, date: targetDate } : item,
    );
    persistItems(nextItems, `Přesunuta událost „${movedItem.title}“.`, [
      movedItem.date.slice(0, 7),
      targetDate.slice(0, 7),
    ]);
    setNotice(`„${movedItem.title}“ přesunuto na ${targetDate}.`);
  }

  async function generateMonthlyPlan() {
    setPlanBusy(true);
    setNotice("");
    try {
      const marketingState = loadMarketingState(defaultItems);
      const response = await fetch("/api/v1/monthly-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: viewMonth,
          goal: planGoal || undefined,
          theme: planTheme || undefined,
          campaign: planCampaign || undefined,
          constraints: planConstraints || undefined,
          storyEveryDays,
          context: {
            memory: marketingState.agentMemory,
            ideas: marketingState.ideas.map((idea) => idea.text),
            campaigns: marketingState.campaigns.map(
              (campaign) => `${campaign.title}: ${campaign.offer}`,
            ),
            trends: marketingState.trends
              .filter((trend) => /^https?:\/\//.test(trend.sourceUrl))
              .map(
                (trend) =>
                  `${trend.title} (${trend.sourceUrl}): ${trend.recommendation}`,
              ),
            published: marketingState.published.map(
              (entry) => `${entry.date} ${entry.type}: ${entry.topic}`,
            ),
          },
        }),
      });
      const result = (await response.json()) as {
        data?: { draft: MonthlyPlanDraft };
        error?: { message: string };
      };
      if (!response.ok || !result.data)
        throw new Error(
          result.error?.message ?? "Návrh se nepodařilo vytvořit.",
        );
      const next = commitMonthlyPlanDraft(marketingState, result.data.draft);
      saveMarketingState(next);
      setItems(next.calendarItems);
      setMonthlyPlans(next.monthlyPlans);
      setNotice(
        `Návrh pro ${monthLabel(viewMonth)} je připravený ke kontrole.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Návrh se nepodařilo vytvořit.",
      );
    } finally {
      setPlanBusy(false);
    }
  }

  function approvePlan() {
    try {
      const next = approveMonthlyPlan(
        loadMarketingState(defaultItems),
        viewMonth,
      );
      saveMarketingState(next);
      setItems(next.calendarItems);
      setMonthlyPlans(next.monthlyPlans);
      setNotice(
        `${monthLabel(viewMonth)} je schválený a položky jsou naplánované.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Plán se nepodařilo schválit.",
      );
    }
  }

  return (
    <>
      <div className="calendar-toolbar">
        <div className="month-navigation" aria-label="Přepínání měsíců">
          <button
            aria-label="Předchozí měsíc"
            className="month-button"
            onClick={() => changeMonth(-1)}
            type="button"
          >
            ←
          </button>
          <div>
            <p className="eyebrow accent">Zobrazený měsíc</p>
            <h2>{monthLabel(viewMonth)}</h2>
          </div>
          <button
            aria-label="Následující měsíc"
            className="month-button"
            onClick={() => changeMonth(1)}
            type="button"
          >
            →
          </button>
        </div>
        <div className="calendar-toolbar-actions">
          <PlanImportDialog
            fallbackItems={defaultItems}
            onCommitted={(state, message) => {
              setItems(state.calendarItems);
              setMonthlyPlans(state.monthlyPlans);
              setNotice(message);
              setLastImportUndo(canUndoLatestImport(state));
            }}
          />
          <button
            className="primary-button"
            onClick={() => setFormOpen((current) => !current)}
            type="button"
          >
            {formOpen ? "Zavřít" : "+ Přidat obsah"}
          </button>
        </div>
      </div>

      {formOpen ? (
        <section className="panel inline-form" aria-label="Nový obsah">
          <label>
            Název
            <input
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Např. Volné ranní termíny"
              value={title}
            />
          </label>
          <label>
            Formát
            <select
              onChange={(event) => setType(event.target.value)}
              value={type}
            >
              <option>STORY</option>
              <option>REEL</option>
              <option>POST</option>
              <option>ÚKOL</option>
            </select>
          </label>
          <label>
            Datum
            <input
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <button
            className="primary-button"
            disabled={!title.trim() || !date}
            onClick={addItem}
            type="button"
          >
            Přidat do plánu
          </button>
        </section>
      ) : null}

      {notice || lastImportUndo ? (
        <div className="notice-bar" role="status">
          <span>{notice || "Poslední import můžeš bezpečně vrátit."}</span>
          {lastImportUndo ? (
            <button
              className="notice-action"
              onClick={undoLatestImport}
              type="button"
            >
              Vrátit import
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="calendar-controls">
        <div className="filter-row" aria-label="Filtry kalendáře">
          {filters.map((item) => (
            <button
              className={`filter-pill ${filter === item ? "active" : ""}`}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <p className="calendar-help">
          Přetáhni položku na jiný den nebo ji otevři kliknutím.
        </p>
      </div>

      <section className="panel calendar-panel">
        <div className="calendar-weekdays">
          {weekdays.map((weekday) => (
            <strong key={weekday}>{weekday}</strong>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((calendarDay) => {
            const dayItems = visibleItems.filter(
              (candidate) => candidate.date === calendarDay.date,
            );
            return (
              <div
                className={`calendar-day ${calendarDay.outside ? "outside" : ""}`}
                key={calendarDay.date}
                onDragOver={(event) => {
                  if (!calendarDay.outside) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!calendarDay.outside)
                    moveItem(
                      event.dataTransfer.getData("text/calendar-item"),
                      calendarDay.date,
                    );
                }}
              >
                <span className="day-number">{calendarDay.day}</span>
                {!calendarDay.outside
                  ? dayItems.map((item) => {
                      const visual = visualMeta[item.id];
                      const readiness = readinessFor(
                        item,
                        calendarVisualReady(item, visual),
                      );
                      return (
                        <button
                          className={`calendar-event ${item.state}`}
                          draggable
                          key={item.id}
                          onClick={() => openEditor(item)}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/calendar-item",
                              item.id,
                            );
                          }}
                          type="button"
                        >
                          <small>{item.type}</small>
                          <strong>{item.title}</strong>
                          {item.type !== "ÚKOL" ? (
                            <span
                              className={`calendar-visual-status ${readiness.state}`}
                            >
                              {readiness.label}
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel monthly-plan-card" id="monthly-plan">
        <div>
          <p className="eyebrow accent">
            Měsíční plán · {monthLabel(viewMonth)}
          </p>
          <h2>
            {currentPlan?.status === "APPROVED"
              ? `Plán je schválený · verze ${currentPlan.version}`
              : currentPlan
                ? `Verze ${currentPlan.version} čeká na kontrolu`
                : "Pro tento měsíc zatím není plán"}
          </h2>
          <p className="muted">
            {currentPlan
              ? `Téma: ${currentPlan.theme} · cíl: ${currentPlan.goal}`
              : "Nech AI připravit návrh nebo nahraj vlastní Excel/CSV. Nic se neschválí automaticky."}
          </p>
          <div className="monthly-plan-stats" aria-label="Obsahový mix měsíce">
            <span>{currentMonthSummary.stories} Story</span>
            <span>{currentMonthSummary.reels} Reels</span>
            <span>{currentMonthSummary.posts} Posty</span>
            <span>{currentMonthSummary.tasks} Úkoly</span>
          </div>
        </div>
        <div className="button-row wrap-buttons">
          <Link
            className="secondary-button link-button"
            href={`/ai?intent=edit-plan&month=${viewMonth}`}
          >
            Upravit s AI
          </Link>
          {currentPlan ? (
            <button
              className={`primary-button ${currentPlan.status === "APPROVED" ? "completed-button" : ""}`}
              disabled={currentPlan.status === "APPROVED"}
              onClick={approvePlan}
              type="button"
            >
              {currentPlan.status === "APPROVED"
                ? "✓ Schváleno"
                : "Schválit tuto verzi"}
            </button>
          ) : null}
        </div>
        {currentPlan?.status !== "APPROVED" ? (
          <div className="monthly-plan-generator">
            <div className="section-heading-compact">
              <div>
                <p className="eyebrow accent">AI návrh</p>
                <h3>
                  {currentPlan
                    ? "Připravit novou verzi"
                    : "Navrhnout plán s AI"}
                </h3>
              </div>
            </div>
            <div className="monthly-plan-form-grid">
              <label>
                Hlavní cíl
                <input
                  onChange={(event) => setPlanGoal(event.target.value)}
                  placeholder="Např. zvýšit rezervace ve všední dny"
                  value={planGoal}
                />
              </label>
              <label>
                Téma měsíce
                <input
                  onChange={(event) => setPlanTheme(event.target.value)}
                  placeholder="Např. Podzimní klid"
                  value={planTheme}
                />
              </label>
              <label>
                Kampaň
                <input
                  onChange={(event) => setPlanCampaign(event.target.value)}
                  placeholder="Volitelné"
                  value={planCampaign}
                />
              </label>
              <label>
                Story každých
                <select
                  onChange={(event) =>
                    setStoryEveryDays(Number(event.target.value))
                  }
                  value={storyEveryDays}
                >
                  <option value={2}>2 dny</option>
                  <option value={3}>3 dny</option>
                  <option value={4}>4 dny</option>
                  <option value={5}>5 dní</option>
                </select>
              </label>
              <label className="monthly-plan-constraints">
                Omezení a poznámky
                <textarea
                  onChange={(event) => setPlanConstraints(event.target.value)}
                  placeholder="Co má AI respektovat, dostupné fotografie, dovolená…"
                  rows={3}
                  value={planConstraints}
                />
              </label>
            </div>
            <button
              className="primary-button"
              disabled={planBusy}
              onClick={generateMonthlyPlan}
              type="button"
            >
              {planBusy ? "Připravuji návrh…" : "Navrhnout plán s AI"}
            </button>
          </div>
        ) : null}
      </section>

      {editingItem ? (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingId(null);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="calendar-edit-title"
            aria-modal="true"
            className="panel calendar-dialog"
            role="dialog"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow accent">
                  {editingItem.type === "ÚKOL"
                    ? "Detail úkolu"
                    : "Detail obsahu"}
                </p>
                <h2 id="calendar-edit-title">{editingItem.title}</h2>
              </div>
              <button
                aria-label="Zavřít"
                className="dialog-close"
                onClick={() => setEditingId(null)}
                type="button"
              >
                ×
              </button>
            </div>
            {editingItem.type !== "ÚKOL" &&
            editingContent &&
            contentKit &&
            editingReadiness ? (
              <>
                <div className="calendar-content-detail">
                  <div className="calendar-visual-column">
                    {isVisualSeries ? (
                      <div className="calendar-story-series">
                        <div className="calendar-story-series-heading">
                          <strong>
                            {editingItem.type === "POST"
                              ? "Post carousel"
                              : "Story série"}{" "}
                            · {editingVisualFrames.length} stránky
                          </strong>
                          <span>
                            {activeSeriesSlides.length}/
                            {editingVisualFrames.length} připraveno
                          </span>
                        </div>
                        {activeSeriesSlides.length === 0 ? (
                          <div className="calendar-series-callout">
                            <div>
                              <span>Grafika ještě není vytvořená</span>
                              <strong>
                                Níže je pouze textový brief, ne výsledný návrh.
                              </strong>
                              <p>
                                AI připraví fotografii, kompletní sazbu, ikony a
                                samostatné PNG pro každou stránku.
                              </p>
                            </div>
                            <button
                              className="primary-button"
                              disabled={visualBusy}
                              onClick={generateVisualSeries}
                              type="button"
                            >
                              {visualBusy
                                ? "Agent tvoří celou sérii…"
                                : `Vygenerovat ${editingVisualFrames.length} hotové PNG s AI`}
                            </button>
                          </div>
                        ) : null}
                        {editingVisualFrames.map((frame) => {
                          const slide = activeSeriesSlides.find(
                            (candidate) =>
                              candidate.position === frame.position,
                          );
                          return (
                            <article
                              className="calendar-story-slide"
                              key={frame.position}
                            >
                              <div className="calendar-story-slide-heading">
                                <span>Slide {frame.position}</span>
                                {slide ? `Verze ${slide.version}` : "Čeká"}
                              </div>
                              {slide ? (
                                <NextImage
                                  alt={`Stránka ${frame.position} pro ${editingItem.title}`}
                                  className="calendar-generated-visual"
                                  height={
                                    editingItem.type === "POST" ? 1350 : 1920
                                  }
                                  src={slide.dataUrl}
                                  unoptimized
                                  width={1080}
                                />
                              ) : (
                                <div
                                  className={`calendar-story-placeholder ${editingItem.type === "POST" ? "post" : "story"}`}
                                >
                                  <span>
                                    Textový podklad · slide {frame.position}
                                  </span>
                                  <div>
                                    <strong>{frame.headline}</strong>
                                    <p>{frame.message}</p>
                                  </div>
                                  <small>
                                    Fotografie a finální design se vytvoří po
                                    spuštění AI generování.
                                  </small>
                                </div>
                              )}
                              <div className="button-row wrap-buttons">
                                <button
                                  className="secondary-button"
                                  disabled={storyBusyPositions.includes(
                                    frame.position,
                                  )}
                                  onClick={() => regenerateVisualSlide(frame)}
                                  type="button"
                                >
                                  {storyBusyPositions.includes(frame.position)
                                    ? "Tvořím slide…"
                                    : slide
                                      ? "Regenerovat slide"
                                      : "Vytvořit slide"}
                                </button>
                                {slide ? (
                                  <a
                                    className="secondary-button link-button"
                                    download={`myfit-${editingItem.id}-${String(frame.position).padStart(2, "0")}.png`}
                                    href={slide.dataUrl}
                                  >
                                    Stáhnout PNG
                                  </a>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : activeVisual ? (
                      <NextImage
                        alt={`Grafika pro ${editingItem.title}`}
                        className="calendar-generated-visual"
                        height={editingItem.type === "POST" ? 1350 : 1920}
                        src={activeVisual.dataUrl}
                        unoptimized
                        width={1080}
                      />
                    ) : (
                      <div
                        className={`calendar-asset-preview ${editingItem.type === "STORY" ? "light" : "dark"}`}
                      >
                        <span>MY FIT</span>
                        <strong>
                          {selectedTextVariant?.headline ?? editingItem.title}
                        </strong>
                        <small>
                          {selectedTextVariant?.cta ?? editingContent.cta} →
                        </small>
                      </div>
                    )}
                    <div
                      className={`visual-readiness ${editingReadiness.state}`}
                    >
                      <strong>{editingReadiness.label}</strong>
                      <small>{editingReadiness.detail}</small>
                    </div>
                    {!isVisualSeries || activeSeriesSlides.length > 0 ? (
                      <button
                        className="primary-button"
                        disabled={visualBusy}
                        onClick={generateVisual}
                        type="button"
                      >
                        {visualBusy
                          ? isVisualSeries
                            ? "Agent tvoří celou sérii…"
                            : "Agent tvoří grafiku…"
                          : isVisualSeries
                            ? `Regenerovat celou sérii (${editingVisualFrames.length} PNG)`
                            : activeVisual
                              ? "Vytvořit novou variantu"
                              : "Vygenerovat grafiku s agentem"}
                      </button>
                    ) : null}
                    {isVisualSeries &&
                    activeSeriesSlides.length === editingVisualFrames.length ? (
                      <button
                        className="secondary-button download-button"
                        onClick={downloadVisualSeries}
                        type="button"
                      >
                        Stáhnout celou sérii ({editingVisualFrames.length} PNG)
                      </button>
                    ) : !isVisualSeries && activeVisual ? (
                      <a
                        className="secondary-button link-button"
                        download={`myfit-${editingItem.id}.png`}
                        href={activeVisual.dataUrl}
                      >
                        Stáhnout PNG
                      </a>
                    ) : null}
                  </div>
                  <div>
                    <dl className="facts-list calendar-content-facts">
                      <div>
                        <dt>Hlavní sdělení</dt>
                        <dd>
                          {selectedTextVariant?.message ??
                            editingContent.message}
                        </dd>
                      </div>
                      <div>
                        <dt>Podklady</dt>
                        <dd>{editingContent.format}</dd>
                      </div>
                      {editingItem.goal ? (
                        <div>
                          <dt>Cíl</dt>
                          <dd>{editingItem.goal}</dd>
                        </div>
                      ) : null}
                      {editingItem.graphicText ? (
                        <div>
                          <dt>Text z plánu</dt>
                          <dd className="preserve-lines">
                            {editingItem.graphicText}
                          </dd>
                        </div>
                      ) : null}
                      {editingItem.visualDirection ? (
                        <div>
                          <dt>Vizuální zadání</dt>
                          <dd>{editingItem.visualDirection}</dd>
                        </div>
                      ) : null}
                      {editingItem.hashtags ? (
                        <div>
                          <dt>Hashtagy</dt>
                          <dd>{editingItem.hashtags}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>CTA</dt>
                        <dd>
                          {selectedTextVariant?.cta ?? editingContent.cta}
                        </dd>
                      </div>
                      <div>
                        <dt>Stav</dt>
                        <dd>
                          {editingItem.state === "draft"
                            ? "Návrh před schválením"
                            : "Naplánováno"}
                        </dd>
                      </div>
                    </dl>

                    {isVisualSeries ? (
                      <section className="carousel-copy-section">
                        <div className="section-heading-compact">
                          <div>
                            <p className="eyebrow accent">Podklady do Canvy</p>
                            <h3>
                              Texty a směr pro všechny{" "}
                              {editingVisualFrames.length} stránky
                            </h3>
                          </div>
                        </div>
                        <div className="carousel-copy-grid">
                          {editingVisualFrames.map((frame) => (
                            <article key={`copy-${frame.position}`}>
                              <span>
                                {String(frame.position).padStart(2, "0")} ·{" "}
                                {frame.role === "hook"
                                  ? "cover"
                                  : frame.role === "cta"
                                    ? "CTA"
                                    : "obsah"}
                              </span>
                              <strong>{frame.headline}</strong>
                              <p>{frame.message}</p>
                              <small>{frame.visualDirection}</small>
                              {frame.cta ? <b>CTA: {frame.cta}</b> : null}
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="text-variant-section">
                      <div className="section-heading-compact">
                        <div>
                          <p className="eyebrow accent">Text od AI</p>
                          <h3>Vyber jednu ze 3 variant</h3>
                        </div>
                        {kitMode ? (
                          <span className={`agent-result-mode ${kitMode}`}>
                            {kitMode === "live" ? "Živá AI" : "Demo"}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-variant-grid">
                        {contentKit.textVariants.map((variant) => (
                          <button
                            className={`text-variant-card ${selectedVariantId === variant.id ? "selected" : ""}`}
                            key={variant.id}
                            onClick={() => setSelectedVariantId(variant.id)}
                            type="button"
                          >
                            <span>{variant.label}</span>
                            <strong>{variant.headline}</strong>
                            <small>{variant.message}</small>
                          </button>
                        ))}
                      </div>
                      {selectedTextVariant ? (
                        <div className="selected-copy-preview">
                          <strong>Caption</strong>
                          <p>{selectedTextVariant.caption}</p>
                        </div>
                      ) : null}
                    </section>
                  </div>
                </div>

                <section className="event-agent-panel">
                  <div className="section-heading-compact">
                    <div>
                      <p className="eyebrow accent">Agent této události</p>
                      <h3>Uprav text nebo grafický směr</h3>
                    </div>
                  </div>
                  <div className="event-agent-actions">
                    {[
                      "Zkrať text a nech jen jednu myšlenku.",
                      "Udělej text více prémiový a klidný.",
                      "Navrhni jinou kompozici grafiky ve stylu MyFit.",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setEventAgentMessage(prompt)}
                        type="button"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="event-agent-thread">
                    {eventAgentEntries.map((entry, index) => (
                      <p className={entry.role} key={`${entry.role}-${index}`}>
                        {entry.text}
                      </p>
                    ))}
                  </div>
                  <div className="event-agent-composer">
                    <textarea
                      aria-label="Zpráva agentovi této události"
                      onChange={(event) =>
                        setEventAgentMessage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendEventAgentMessage();
                        }
                      }}
                      placeholder="Např. zkrať text, změň CTA nebo navrhni tmavší grafiku…"
                      rows={2}
                      value={eventAgentMessage}
                    />
                    <button
                      className="primary-button"
                      disabled={eventAgentBusy || !eventAgentMessage.trim()}
                      onClick={sendEventAgentMessage}
                      type="button"
                    >
                      {eventAgentBusy ? "Agent pracuje…" : "Odeslat"}
                    </button>
                  </div>
                </section>

                {agentSteps.length ? (
                  <section className="agent-work-log" aria-live="polite">
                    <p className="eyebrow accent">Jak agent pracoval</p>
                    <ol>
                      {agentSteps.map((step, index) => (
                        <li key={`${step}-${index}`}>{step}</li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </>
            ) : null}
            <p className="eyebrow calendar-edit-label">Upravit událost</p>
            <div className="calendar-edit-form">
              <label>
                Název
                <input
                  onChange={(event) => setEditTitle(event.target.value)}
                  value={editTitle}
                />
              </label>
              <label>
                Formát
                <select
                  onChange={(event) => setEditType(event.target.value)}
                  value={editType}
                >
                  <option>STORY</option>
                  <option>REEL</option>
                  <option>POST</option>
                  <option>ÚKOL</option>
                </select>
              </label>
              <label>
                Datum
                <input
                  onChange={(event) => setEditDate(event.target.value)}
                  type="date"
                  value={editDate}
                />
              </label>
            </div>
            <div className="button-row dialog-actions">
              {editingItem.type !== "ÚKOL" ? (
                <Link
                  className="secondary-button link-button"
                  href={`/ai?intent=change-content&title=${encodeURIComponent(editingItem.title)}`}
                >
                  Otevřít plný AI chat
                </Link>
              ) : null}
              <button
                className="primary-button"
                disabled={!editTitle.trim() || !editDate}
                onClick={saveEditedItem}
                type="button"
              >
                Uložit změny
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
