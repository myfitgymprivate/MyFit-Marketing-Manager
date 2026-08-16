import { z } from "zod";

export const DEFAULT_AGENT_MEMORY = {
  textInstructions:
    "Piš stručně, přirozeně a klidně. Upřednostni soukromí, vlastní tempo, komfort a čas pro sebe. Neopakuj pracovní název tématu jako finální text. Připrav konkrétní headline, podtext, CTA a caption, které lze rovnou vložit do Canvy. U carouselu dej každé stránce jinou funkci a jednu jasnou myšlenku.",
  imageInstructions:
    "Používej světlou boutique atmosféru, teplé přirozené světlo, krémový mléčný prostor pro text vlevo a realistické privátní fitness vpravo. Vizuál má působit jako luxusní hotelový nebo architektonický editorial: velké okno, zlatá hodinka, čisté černé stroje, lavička, jednoručky a rostlina. Žádná generická šablona, tmavý gym, deformované vybavení ani text v AI fotografii.",
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
