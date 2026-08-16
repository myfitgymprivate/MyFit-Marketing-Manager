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

const slideSchema = z.object({
  position: z.number().int().min(1).max(5),
  role: z.enum(["hook", "benefit", "detail", "cta"]),
  headline: z.string().trim().min(1).max(90),
  message: z.string().trim().min(1).max(180),
  visualDirection: z.string().trim().min(1).max(400),
  cta: z.string().trim().min(1).max(60).optional(),
});

const contentKitSchema = z.object({
  headline: z.string().trim().min(1).max(90),
  message: z.string().trim().min(1).max(180),
  caption: z.string().trim().min(1).max(900),
  cta: z.string().trim().min(1).max(60),
  theme: z.string().trim().min(1).max(220),
  visualDirection: z.string().trim().min(1).max(400),
  textVariants: z.array(textVariantSchema).length(3),
  slides: z.array(slideSchema).min(1).max(5).optional(),
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
  const isPoll = title.toLocaleLowerCase("cs-CZ").includes("anketa");
  const message = isReel
    ? "Krátký návratový trénink v soukromí a vlastním tempu."
    : isPost
      ? "Vrať se k pohybu bez tlaku, čekání a přeplněného fitness."
      : "Celé fitness pro tebe. Klid, soukromí a vlastní tempo.";
  const headline = truncate(
    brief?.graphicText
      ?.split("\n")
      .find((line) => line.trim())
      ?.trim() ||
      (isPoll ? "CO JE PRO TEBE PŘI TRÉNINKU NEJDŮLEŽITĚJŠÍ?" : title),
    90,
  );
  const preparedMessage = truncate(
    brief?.graphicText?.replace(/\s*\n\s*/g, " ") ||
      brief?.goal ||
      (isPoll ? "Vyber jednu možnost a napiš nám svůj pohled." : message),
    180,
  );
  const caption = truncate(
    brief?.caption ||
      (isPoll
        ? "Co je pro tebe při tréninku nejdůležitější — soukromí, klid, nebo možnost cvičit ve vlastním tempu? Napiš nám svůj pohled."
        : `${title}. V MyFit máš prostor jen pro sebe a můžeš se soustředit na svůj trénink.`),
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
  const slides =
    type === "POST"
      ? [
          {
            position: 1,
            role: "hook" as const,
            headline,
            message: preparedMessage,
            visualDirection:
              "Úvodní editorial cover. Velký klidný headline vlevo, světlý mléčný přechod a privátní studio vpravo.",
          },
          {
            position: 2,
            role: "benefit" as const,
            headline: "SOUKROMÍ",
            message: "Celé studio máš jen pro sebe.",
            visualDirection:
              "Čistý prostor, lavička a jednoručky v teplém denním světle. Žádní další lidé.",
          },
          {
            position: 3,
            role: "benefit" as const,
            headline: "VLASTNÍ TEMPO",
            message: "Cvičíš v klidu, bez čekání a zbytečného ruchu.",
            visualDirection:
              "Otevřené okno, rostlina a jemné sluneční paprsky. Vzdušná wellness atmosféra.",
          },
          {
            position: 4,
            role: "cta" as const,
            headline: "UDĚLEJ SI ČAS PRO SEBE",
            message: "Tvůj prostor. Tvé tempo.",
            visualDirection:
              "Čistý závěrečný slide s velkým negativním prostorem a tenkým zlatým rámečkem pro CTA.",
            cta,
          },
        ]
      : type === "STORY"
        ? [
            {
              position: 1,
              role: "hook" as const,
              headline,
              message: preparedMessage,
              visualDirection:
                "Silná úvodní emoce, velký nadpis, krémový prostor vlevo a teplé studio vpravo.",
            },
            isPoll
              ? {
                  position: 2,
                  role: "detail" as const,
                  headline: "SOUKROMÍ, KLID, NEBO VOLNOST?",
                  message: "Co rozhoduje o tom, že se ti cvičí dobře?",
                  visualDirection:
                    "Jednoduchá anketa s tenkými outline symboly a světlým architektonickým detailem studia.",
                }
              : {
                  position: 2,
                  role: "detail" as const,
                  headline: "TVŮJ PROSTOR",
                  message: "Klid, soukromí a vlastní tempo bez čekání.",
                  visualDirection:
                    "Konkrétní informace s jednoduchou outline ikonou a světlým architektonickým detailem studia.",
                },
            isPoll
              ? {
                  position: 3,
                  role: "cta" as const,
                  headline: "NAPIŠ NÁM SVŮJ POHLED",
                  message: "Zajímá nás, co ti v MyFit vyhovuje nejvíc.",
                  visualDirection:
                    "Vzdušný závěrečný slide, jemné srdce nebo šipka a čistý prostor pro odpověď.",
                  cta: brief?.cta || "Odpověz nám",
                }
              : {
                  position: 3,
                  role: "cta" as const,
                  headline: "ČAS PRO SEBE",
                  message: "Vyber si chvíli, která patří jen tobě.",
                  visualDirection:
                    "Vzdušný závěrečný slide, jemné srdce nebo šipka a čistý prostor pro CTA.",
                  cta,
                },
          ]
        : [
            {
              position: 1,
              role: "hook" as const,
              headline,
              message: preparedMessage,
              visualDirection,
              cta,
            },
          ];
  return {
    headline,
    message: preparedMessage,
    caption,
    cta,
    theme,
    visualDirection,
    slides,
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
      instructions: `${myfitAgentInstructions}${customAgentMemoryInstructions(event.memory, "text")}\n\nVýstup musí být pouze platný JSON bez markdownu s klíči headline, message, caption, cta, theme, visualDirection, textVariants a slides. textVariants musí obsahovat přesně 3 položky: Stručná, Prémiová a Osobnější. Každá má id, label, headline, message, caption a cta. slides obsahují position, role (hook, benefit, detail nebo cta), headline, message, visualDirection a volitelně cta. Pro POST připrav přesně 4 konkrétní stránky carouselu: 1) silný cover, 2–3) dvě rozdílné užitečné myšlenky, 4) klidné CTA. Pro STORY připrav přesně 3 obrazovky: emoce, konkrétní informace, CTA. Pro REEL stačí 1 cover. Neopakuj pouze pracovní název události; napiš finální texty, které lze vložit do Canvy bez přepisování. Každá stránka musí mít jinou funkci a maximálně jednu hlavní myšlenku. Pokud zadání neobsahuje ověřené faktum, použij pocitovou nebo otázkovou formulaci a nic nevymýšlej. Nevymýšlej ceny, slevy, termíny ani provozní fakta.`,
      input: `Připrav podklady pro událost: ${event.title}. Formát: ${event.type}. Datum publikace: ${event.date}.${event.brief ? ` Schválené zadání z marketingového plánu: ${JSON.stringify(event.brief)}` : ""}${event.instruction ? ` Požadavek uživatelky: ${event.instruction}` : ""}`,
    });
    const rawOutput = response.output_text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");
    const parsedKit = contentKitSchema.parse(JSON.parse(rawOutput));
    const fallbackKit = createDemoKit(event.title, event.type, event.brief);
    const expectedSlideCount =
      event.type === "POST" ? 4 : event.type === "STORY" ? 3 : 1;
    const slides =
      parsedKit.slides?.length === expectedSlideCount
        ? parsedKit.slides
        : fallbackKit.slides;
    const kit = { ...parsedKit, slides };
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
