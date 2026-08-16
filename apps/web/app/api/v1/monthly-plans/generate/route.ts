import OpenAI from "openai";
import { z } from "zod";

import {
  agentMemorySchema,
  customAgentMemoryInstructions,
} from "../../../../_lib/agent-memory";
import { getAuthenticatedUserId } from "../../../../_lib/auth";
import { createMonthlyPlanDraft } from "../../../../_lib/monthly-plan";
import { myfitAgentInstructions } from "../../../../_lib/myfit-agent";
import {
  invalidJsonResponse,
  readJsonBody,
} from "../../../../_lib/request-json";

const requestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  goal: z.string().trim().max(300).optional(),
  theme: z.string().trim().max(180).optional(),
  campaign: z.string().trim().max(180).optional(),
  constraints: z.string().trim().max(500).optional(),
  storyEveryDays: z.number().int().min(2).max(7).optional(),
  context: z
    .object({
      memory: agentMemorySchema.optional(),
      ideas: z.array(z.string().max(300)).max(30).default([]),
      campaigns: z.array(z.string().max(300)).max(20).default([]),
      trends: z.array(z.string().max(500)).max(20).default([]),
      published: z.array(z.string().max(300)).max(30).default([]),
    })
    .optional(),
});

const aiPlanSchema = z.object({
  theme: z.string().trim().min(1).max(180),
  goal: z.string().trim().min(1).max(300),
  items: z
    .array(
      z.object({
        date: z.iso.date(),
        type: z.enum(["STORY", "REEL", "POST", "ÚKOL"]),
        title: z.string().trim().min(1).max(180),
      }),
    )
    .min(1)
    .max(60),
});

function summarize(items: z.infer<typeof aiPlanSchema>["items"]) {
  const count = (type: string) =>
    items.filter((item) => item.type === type).length;
  return {
    stories: count("STORY"),
    reels: count("REEL"),
    posts: count("POST"),
    tasks: count("ÚKOL"),
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!(await getAuthenticatedUserId()))
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Přihlášení vypršelo." } },
      { status: 401 },
    );
  const body = await readJsonBody(request);
  if (!body.ok) return invalidJsonResponse(requestId);
  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success)
    return Response.json(
      {
        error: {
          code: "INVALID_MONTHLY_PLAN_REQUEST",
          message: "Podklady pro měsíční plán nejsou platné.",
          requestId,
        },
      },
      { status: 422 },
    );

  const fallbackDraft = createMonthlyPlanDraft(parsed.data);
  if (!process.env.OPENAI_API_KEY)
    return Response.json({
      data: { mode: "demo", draft: fallbackDraft },
      meta: { requestId },
    });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const context = parsed.data.context;
    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.6-sol",
      reasoning: { effort: "medium" },
      instructions: `${myfitAgentInstructions}${customAgentMemoryInstructions(context?.memory, "text")}\n\nVrať pouze platný JSON bez markdownu: {theme, goal, items:[{date,type,title}]}. Typ je STORY, REEL, POST nebo ÚKOL. Všechna data musí patřit do požadovaného měsíce. Připrav přibližně jeden Post nebo Reel týdně, Story podle zadané četnosti a produkční úkoly. Nevymýšlej ceny, slevy ani provozní fakta.`,
      input: `Připrav plán pro ${parsed.data.month}. Požadovaný cíl: ${parsed.data.goal || "není doplněn"}. Téma: ${parsed.data.theme || "navrhni"}. Kampaň: ${parsed.data.campaign || "žádná"}. Omezení: ${parsed.data.constraints || "žádná"}. Story každých ${parsed.data.storyEveryDays ?? 3} dní. Nápady: ${context?.ideas.join(" | ") || "žádné"}. Kampaně: ${context?.campaigns.join(" | ") || "žádné"}. Aktuální trendy se zdrojem: ${context?.trends.join(" | ") || "žádné"}. Publikovaná historie: ${context?.published.join(" | ") || "žádná"}.`,
    });
    const raw = response.output_text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");
    const aiPlan = aiPlanSchema.parse(JSON.parse(raw));
    if (!aiPlan.items.every((item) => item.date.startsWith(parsed.data.month)))
      throw new Error("AI vrátila položku mimo vybraný měsíc.");
    const now = new Date().toISOString();
    return Response.json({
      data: {
        mode: "live",
        draft: {
          plan: {
            ...fallbackDraft.plan,
            goal: aiPlan.goal,
            theme: aiPlan.theme,
            createdAt: now,
            updatedAt: now,
          },
          items: aiPlan.items.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            state: "draft" as const,
            source: "AI_PLAN" as const,
            goal: aiPlan.goal,
          })),
          summary: summarize(aiPlan.items),
        },
      },
      meta: { requestId, responseId: response.id },
    });
  } catch {
    return Response.json({
      data: { mode: "demo", draft: fallbackDraft },
      meta: { requestId, fallback: true },
    });
  }
}
