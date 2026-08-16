export type ReelContentPackage = {
  type: "Reel";
  title: string;
  date: string;
  duration: string;
  goal: string;
  hook: string;
  script: Array<{ time: string; shot: string; text: string }>;
  shotlist: string[];
  overlays: string[];
  caption: string;
  cta: string;
};

export type PostContentPackage = {
  type: "Post";
  title: string;
  date: string;
  goal: string;
  headline: string;
  message: string;
  caption: string;
  visualBrief: string[];
  altText: string;
  cta: string;
};

export type ContentPackage = ReelContentPackage | PostContentPackage;

export const reelPartnerPackage: ReelContentPackage = {
  type: "Reel",
  title: "5 důvodů vzít parťáka",
  date: "7. 8. 2026",
  duration: "18–22 sekund",
  goal: "Zapojení",
  hook: "Když chceš svůj čas v MyFit výjimečně sdílet.",
  script: [
    {
      time: "0–3 s",
      shot: "Dvě připravené podložky v teplém ranním světle.",
      text: "VE DVOU?",
    },
    {
      time: "3–7 s",
      shot: "Detail dvou párů jednoruček a klidného prostoru.",
      text: "VÍC MOTIVACE.",
    },
    {
      time: "7–11 s",
      shot: "Krátké střídání cviků bez rušného pozadí.",
      text: "SPOLEČNÉ TEMPO.",
    },
    {
      time: "11–15 s",
      shot: "Odložení činek, voda a přirozený úsměv.",
      text: "A POŘÁD KLID.",
    },
    {
      time: "15–22 s",
      shot: "Široký záběr studia s logem a čistým CTA.",
      text: "VYBER SI SVŮJ ČAS.",
    },
  ],
  shotlist: [
    "Celkový záběr prázdného studia u okna",
    "Dvě podložky nebo dva ručníky připravené vedle sebe",
    "Detail dvou párů jednoruček",
    "Krátký pohyb bez pózování a flexení",
    "Detail vody a klidného zakončení tréninku",
    "Čistý závěrečný záběr s prostorem pro CTA",
  ],
  overlays: [
    "VE DVOU?",
    "VÍC MOTIVACE.",
    "SPOLEČNÉ TEMPO.",
    "A POŘÁD KLID.",
    "VYBER SI SVŮJ ČAS.",
  ],
  caption:
    "Někdy chceš mít svůj čas jen pro sebe. A někdy je fajn sdílet ho s někým, kdo drží stejné tempo. V MyFit zůstává nejdůležitější klid, prostor a trénink bez zbytečného čekání.",
  cta: "Vyber si svůj termín.",
};

export const postBenefitsPackage: PostContentPackage = {
  type: "Post",
  title: "Benefity MyFit",
  date: "12. 8. 2026",
  goal: "Akvizice",
  headline: "TVŮJ PROSTOR. TVÉ TEMPO.",
  message: "Klid, soukromí a čas věnovaný jen sobě.",
  caption:
    "Trénink nemusí znamenat hluk, čekání ani spěch. V MyFit získáš klidný prostor, ve kterém se můžeš soustředit na sebe a svoje tempo. Zacvič si. Vyčisti hlavu. Nabij tělo.",
  visualBrief: [
    "Formát 1080 × 1350 px, světlý boutique post",
    "Vlevo krémový mléčný prostor pro krátký text",
    "Vpravo reálná fotografie čistého privátního studia",
    "Golden hour, velké okno, černé stroje a jemná rostlina",
    "Tenká zlatá linka, malé logo a dostatek negativního prostoru",
    "Bez lidí, neonů, tmavého pozadí a agresivního fitness výrazu",
  ],
  altText:
    "Světlé privátní fitness studio MyFit s černými stroji, velkým oknem a teplým slunečním světlem.",
  cta: "Rezervuj si svůj čas.",
};

export function contentPackageToText(content: ContentPackage) {
  if (content.type === "Reel") {
    return [
      content.title,
      `Datum: ${content.date}`,
      `Délka: ${content.duration}`,
      `Cíl: ${content.goal}`,
      "",
      `HOOK\n${content.hook}`,
      "",
      "ČASOVANÝ SCÉNÁŘ",
      ...content.script.map(
        (step) => `${step.time} | ${step.shot} | ${step.text}`,
      ),
      "",
      "SHOTLIST",
      ...content.shotlist.map((item) => `- ${item}`),
      "",
      "TEXTY DO VIDEA",
      ...content.overlays.map((item) => `- ${item}`),
      "",
      `CAPTION\n${content.caption}\n${content.cta}`,
    ].join("\n");
  }

  return [
    content.title,
    `Datum: ${content.date}`,
    `Cíl: ${content.goal}`,
    "",
    `HLAVNÍ SDĚLENÍ\n${content.headline}\n${content.message}`,
    "",
    `FINÁLNÍ CAPTION\n${content.caption}\n${content.cta}`,
    "",
    "VIZUÁLNÍ ZADÁNÍ",
    ...content.visualBrief.map((item) => `- ${item}`),
    "",
    `ALT TEXT\n${content.altText}`,
  ].join("\n");
}
