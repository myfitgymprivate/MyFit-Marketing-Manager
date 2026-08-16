import { z } from "zod";

export const DEFAULT_AGENT_MEMORY = {
  textInstructions:
    "Piš stručně, přirozeně a klidně. Upřednostni soukromí, vlastní tempo, komfort a čas pro sebe. Nabídni konkrétní text připravený k použití.",
  imageInstructions:
    "Používej světlou boutique atmosféru, teplé přirozené světlo, krémový prostor pro text vlevo a čisté privátní fitness vpravo. Výsledek musí být vzdušný a prémiový.",
} as const;

export const agentMemorySchema = z.object({
  textInstructions: z.string().trim().max(4_000),
  imageInstructions: z.string().trim().max(4_000),
});

export type AgentMemory = z.infer<typeof agentMemorySchema>;

export function customAgentMemoryInstructions(
  memory: AgentMemory | undefined,
  kind: "text" | "image",
) {
  const instructions =
    kind === "text" ? memory?.textInstructions : memory?.imageInstructions;
  if (!instructions?.trim()) return "";

  return `

UŽIVATELSKÁ PAMĚŤ PRO ${kind === "text" ? "TVORBU TEXTŮ" : "TVORBU OBRÁZKŮ"}:
${instructions.trim()}

Tato paměť doplňuje závazný manuál MY FIT. Nesmí rušit bezpečnostní pravidla, vymýšlet neověřená fakta ani měnit identitu značky.`;
}
