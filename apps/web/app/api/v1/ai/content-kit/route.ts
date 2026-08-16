import OpenAI from "openai";
import { z } from "zod";

import { myfitAgentInstructions } from "../../../../_lib/myfit-agent";
import { getAuthenticatedUserId } from "../../../../_lib/auth";
import {
  invalidJsonResponse,
  readJsonBody,
} from "../../../../_lib/request-json";
import {
  agentMemorySchema,
  customAgentMemoryInstructions,
} from "../../../../_lib/agent-memory";

const requestSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(180),
  type: z.enum(["STORY", "REEL", "POST"]),
  date: z.iso.date(),
  instruction: z.string().trim().max(1_000).optional(),
  memory: agentMemorySchema.optional(),
  brief: z
    .object({
      platform: z.string().trim().max(120).optional(),
      formatLabel: z.string().trim().max(120).optional(),
      goal: z.string().trim().max(300).optional(),
      campaign: z.string().trim().max(200).optional(),
      cta: z.string().trim().max(120).optional(),
      caption: z.string().trim().max(2_000).optional(),
      graphicText: z.string().trim().max(1_000).optional(),
      hashtags: z.string().trim().max(500).optional(),
      notes: z.string().trim().max(1_000).optional(),
      visualDirection: z.string().trim().max(1_000).optional(),
    })
    .optional(),
});

type ContentBrief = NonNullable<z.infer<typeof requestSchema>["brief"]>;

const textVariantSchema = z.object({
  id: z.string().trim().min(1).max(30),
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(90),
  message: z.string().trim().min(1).max(180),
  caption: z.string().trim().min(1).max(900),
  cta: z.string().trim().min(1).max(60),
});

const contentKitSchema = z.object({
  headline: z.string().trim().min(1).max(90),
  message: z.string().trim().min(1).max(180),
  caption: z.string().trim().min(1).max(900),
  cta: z.string().trim().min(1).max(60),
  theme: z.string().trim().min(1).max(220),
  visualDirection: z.string().trim().min(1).max(400),
  textVariants: z.array(textVariantSchema).length(3),
});

function truncate(value: string, maximum: number) {
  return value.length <= maximum
    ? value
    : `${value.slice(0, Math.max(0, maximum - 1)).trim()}…`;
}

function createDemoKit(
  title: string,
  type: "STORY" | "REEL" | "POST",
  brief?: ContentBrief,
) {
  const isReel = type === "REEL";
  const isPost = type === "POST";
  const message = isReel
    ? "Krátký návratový trénink v soukromí a vlastním tempu."
    : isPost
      ? "Vrať se k pohybu bez tlaku, čekání a přeplněného fitness."
      : "Celé fitness pro tebe. Klid, soukromí a vlastní tempo.";
  const headline = truncate(
    brief?.graphicText
      ?.split("\n")
      .find((line) => line.trim())
      ?.trim() || title,
    90,
  );
  const preparedMessage = truncate(
    brief?.graphicText?.replace(/\s*\n\s*/g, " ") || brief?.goal || message,
    180,
  );
  const caption = truncate(
    brief?.caption ||
      `${title}. V MyFit máš prostor jen pro sebe a můžeš se soustředit na svůj trénink.`,
    900,
  );
  const cta = truncate(brief?.cta || "Rezervovat termín", 60);
  const theme = truncate(
    [title, brief?.goal, brief?.campaign].filter(Boolean).join("; ") ||
      `${title}; soukromé fitness, klid a návrat do vlastního rytmu`,
    220,
  );
  const visualDirection = truncate(
    brief?.visualDirection ||
      (isPost
        ? "Světlá boutique fotografie privátního studia, přirozené teplé slunce, champagne a krémová, černé stroje jen jako detail, hodně čistého prostoru."
        : "Teplá světlá fotografie privátního studia, vlevo mléčný krémový prostor pro text, vpravo čisté fitness, tlumená zlatá a klidná prémiová kompozice."),
    400,
  );
  return {
    headline,
    message: preparedMessage,
    caption,
    cta,
    theme,
    visualDirection,
    textVariants: [
      {
        id: "short",
        label: "Stručná",
        headline,
        message: "Vlastní tempo. Vlastní prostor. Bez čekání.",
        caption: `${title}. Dopřej si trénink v klidu a soukromí.`,
        cta,
      },
      {
        id: "premium",
        label: "Prémiová",
        headline,
        message: preparedMessage,
        caption,
        cta,
      },
      {
        id: "personal",
        label: "Osobnější",
        headline: "Čas jen pro tebe",
        message: "Zacvič si. Vyčisti hlavu. Nabij tělo.",
        caption: `Někdy stačí mít chvíli jen pro sebe. ${title} v MyFit znamená klid, soukromí a žádné čekání.`,
        cta: "Vybrat svůj čas",
      },
    ],
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!(await getAuthenticatedUserId()))
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Přihlášení vypršelo." } },
      { status: 401 },
    );
  const jsonBody = await readJsonBody(request);
  if (!jsonBody.ok) return invalidJsonResponse(requestId);
  const parsedBody = requestSchema.safeParse(jsonBody.value);
  if (!parsedBody.success)
    return Response.json(
      {
        error: {
          code: "INVALID_CONTENT_KIT_REQUEST",
          message: "Událost nemá platné podklady pro AI agenta.",
          requestId,
        },
      },
      { status: 422 },
    );

  const event = parsedBody.data;
  if (!process.env.OPENAI_API_KEY)
    return Response.json({
      data: {
        mode: "demo",
        kit: createDemoKit(event.title, event.type, event.brief),
      },
      meta: { requestId },
    });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.6-sol",
      reasoning: { effort: "low" },
      instructions: `${myfitAgentInstructions}${customAgentMemoryInstructions(event.memory, "text")}\n\nVýstup musí být pouze platný JSON bez markdownu s klíči headline, message, caption, cta, theme, visualDirection a textVariants. textVariants musí obsahovat přesně 3 položky: Stručná, Prémiová a Osobnější. Každá má id, label, headline, message, caption a cta. Připrav konkrétní použitelné podklady. Nevymýšlej ceny, slevy, termíny ani provozní fakta.`,
      input: `Připrav podklady pro událost: ${event.title}. Formát: ${event.type}. Datum publikace: ${event.date}.${event.brief ? ` Schválené zadání z marketingového plánu: ${JSON.stringify(event.brief)}` : ""}${event.instruction ? ` Požadavek uživatelky: ${event.instruction}` : ""}`,
    });
    const rawOutput = response.output_text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");
    const kit = contentKitSchema.parse(JSON.parse(rawOutput));
    return Response.json({
      data: { mode: "live", kit },
      meta: { requestId, responseId: response.id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neznámá chyba";
    return Response.json(
      {
        error: {
          code: "CONTENT_KIT_AGENT_ERROR",
          message: "Obsahový agent podklady nedokončil.",
          requestId,
          details: { providerMessage: message },
        },
      },
      { status: 502 },
    );
  }
}
