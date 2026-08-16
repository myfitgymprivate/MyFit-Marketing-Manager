import OpenAI from "openai";
import { z } from "zod";

import {
  createDemoAgentResponse,
  myfitAgentInstructions,
  myfitAgentTools,
  type AgentProposal,
} from "../../../../_lib/myfit-agent";
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
  message: z.string().trim().min(1).max(2_000),
  memory: agentMemorySchema.optional(),
});

const toolLabels: Record<
  AgentProposal["tool"],
  { title: string; risk: "R1" | "R2" }
> = {
  create_idea: { title: "Uložit nápad do Idea Bank", risk: "R1" },
  record_published_content: { title: "Zapsat publikovaný obsah", risk: "R2" },
  reschedule_content: { title: "Přesunout obsah", risk: "R2" },
};

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
          code: "INVALID_AGENT_MESSAGE",
          message: "Zpráva pro agenta není platná.",
          requestId,
          retryable: false,
        },
      },
      { status: 422 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      data: {
        ...createDemoAgentResponse(parsedBody.data.message),
        mode: "demo",
      },
      meta: { requestId },
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.6-sol",
      reasoning: { effort: "low" },
      instructions: `${myfitAgentInstructions}${customAgentMemoryInstructions(parsedBody.data.memory, "text")}`,
      input: parsedBody.data.message,
      tools: myfitAgentTools,
    });

    const proposals: AgentProposal[] = response.output.flatMap((item) => {
      if (item.type !== "function_call" || !(item.name in toolLabels))
        return [];

      const tool = item.name as AgentProposal["tool"];
      const label = toolLabels[tool];
      const args = JSON.parse(item.arguments) as Record<string, string>;

      return [
        {
          id: crypto.randomUUID(),
          tool,
          title: label.title,
          description: "Agent připravil tuto změnu k potvrzení.",
          args,
          risk: label.risk,
        },
      ];
    });

    return Response.json({
      data: {
        mode: "live",
        text:
          response.output_text ||
          (proposals.length
            ? "Připravila jsem návrh změny. Před provedením ho prosím potvrď."
            : "Hotovo."),
        proposals,
      },
      meta: { requestId, responseId: response.id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neznámá chyba";
    return Response.json(
      {
        error: {
          code: "AGENT_PROVIDER_ERROR",
          message: "MyFit Agent je dočasně nedostupný.",
          requestId,
          retryable: true,
          details: { providerMessage: message },
        },
      },
      { status: 502 },
    );
  }
}
