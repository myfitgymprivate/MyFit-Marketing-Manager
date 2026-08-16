import OpenAI from "openai";
import { z } from "zod";

import {
  myfitStoryCompositions,
  myfitVisualTemplates,
  type MyfitStoryComposition,
  type MyfitVisualTemplate,
} from "../../../../_lib/myfit-visual-system";
import { getAuthenticatedUserId } from "../../../../_lib/auth";
import { myfitBrandManual } from "../../../../_lib/myfit-brand-manual";
import {
  invalidJsonResponse,
  readJsonBody,
} from "../../../../_lib/request-json";
import {
  agentMemorySchema,
  customAgentMemoryInstructions,
} from "../../../../_lib/agent-memory";

const requestSchema = z.object({
  headline: z.string().trim().min(1).max(160),
  theme: z.string().trim().min(1).max(240),
  format: z.enum(["story", "post"]).default("story"),
  template: z
    .enum(["story_private_benefit", "story_availability", "post_announcement"])
    .default("story_private_benefit"),
  composition: z
    .enum(["editorial_split", "photo_forward"])
    .default("editorial_split"),
  memory: agentMemorySchema.optional(),
});

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

  if (!parsedBody.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_VISUAL_REQUEST",
          message: "Zadání grafiky není platné.",
          requestId,
        },
      },
      { status: 422 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      data: {
        mode: "demo",
        imageDataUrl: null,
        template: parsedBody.data.template,
        composition: parsedBody.data.composition,
      },
      meta: { requestId },
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const templateKey = parsedBody.data.template as MyfitVisualTemplate;
    const template = myfitVisualTemplates[templateKey];
    const isStory = template.format === "story";
    const composition = parsedBody.data.composition as MyfitStoryComposition;
    const compositionPrompt = myfitStoryCompositions[composition];
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
      prompt: `Create a new photographic art direction for a MyFit Instagram ${isStory ? "Story" : "Post"}. Theme: ${parsedBody.data.theme}. Composition: ${compositionPrompt}. Template direction: ${template.imagePrompt}.

MANDATORY MYFIT BRAND MANUAL:
${myfitBrandManual}
${customAgentMemoryInstructions(parsedBody.data.memory, "image")}

Create only the photographic background. Keep it bright, warm, airy and architectural, with cream-to-photo text-safe negative space on the left and the private-gym scene on the right. Prefer no person; if a person is essential, show at most one natural non-bodybuilder adult without posing. The application adds typography and branding later. Absolutely no text, letters, logos, icons, watermarks, prices, discounts, dates, invented products or invented business facts.`,
      size: "1024x1536",
      quality: "low",
      output_format: "png",
    });
    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64)
      throw new Error("Image provider did not return image data.");

    return Response.json({
      data: {
        mode: "live",
        imageDataUrl: `data:image/png;base64,${imageBase64}`,
        template: templateKey,
        composition,
      },
      meta: { requestId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neznámá chyba";
    return Response.json(
      {
        error: {
          code: "VISUAL_PROVIDER_ERROR",
          message: "Grafiku se nepodařilo vygenerovat.",
          requestId,
          details: { providerMessage: message },
        },
      },
      { status: 502 },
    );
  }
}
