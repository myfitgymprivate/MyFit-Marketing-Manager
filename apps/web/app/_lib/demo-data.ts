export const storyFrames = [
  {
    position: 1,
    text: "Kolikrát jste dnes čekali na volný stroj?",
    direction: "Detail stroje a krátká otázka přes celou obrazovku.",
  },
  {
    position: 2,
    text: "V MyFit nemusíte. Celé fitness máte pro sebe.",
    direction: "Široký záběr prázdného fitka, klidná atmosféra.",
  },
  {
    position: 3,
    text: "Vyberte si svůj termín.",
    direction: "Logo MyFit, výrazné CTA a prostor pro odkaz Rezervovat.",
  },
];

export const calendarItems = [
  { day: 3, type: "STORY", title: "Cvičení ve dvou", state: "published" },
  { day: 5, type: "STORY", title: "Soukromí bez čekání", state: "today" },
  { day: 7, type: "REEL", title: "5 důvodů vzít parťáka", state: "ready" },
  { day: 9, type: "STORY", title: "Rezervace a CTA", state: "planned" },
  { day: 12, type: "POST", title: "Benefity MyFit", state: "planned" },
  { day: 15, type: "STORY", title: "Trenérský tip", state: "draft" },
  { day: 19, type: "REEL", title: "Krátký trénink", state: "draft" },
  { day: 22, type: "STORY", title: "Community anketa", state: "planned" },
  { day: 26, type: "POST", title: "Soukromé fitness", state: "draft" },
] as const;

export const defaultTasks = [
  {
    id: "shots",
    title: "Připravit záběry pro Reel",
    detail: "14. 8. 2026 · obsah „5 důvodů vzít parťáka“",
    priority: "Vysoká" as const,
    dueDate: "2026-08-14",
    recurrence: "Žádné" as const,
    completed: false,
  },
  {
    id: "photos",
    title: "Nahrát fotografie prostoru",
    detail: "15. 8. 2026 · Media Library",
    priority: "Běžná" as const,
    dueDate: "2026-08-15",
    recurrence: "Žádné" as const,
    completed: false,
  },
  {
    id: "plan",
    title: "Potvrdit měsíční plán",
    detail: "25. 8. 2026 · září 2026",
    priority: "Běžná" as const,
    dueDate: "2026-08-25",
    recurrence: "Žádné" as const,
    completed: false,
  },
  {
    id: "story",
    title: "Publikovat Story „Cvičení ve dvou“",
    detail: "10. 8. 2026 · dokončeno",
    priority: "Běžná" as const,
    dueDate: "2026-08-10",
    recurrence: "Žádné" as const,
    completed: true,
  },
  {
    id: "links",
    title: "Zkontrolovat CTA odkazy",
    detail: "7. 8. 2026 · dokončeno",
    priority: "Běžná" as const,
    dueDate: "2026-08-07",
    recurrence: "Týdně" as const,
    completed: true,
  },
];

export const moduleCards = [
  {
    title: "Marketing Brain",
    description:
      "Ověřená fakta, pravidla značky a preference, které AI musí dodržovat.",
    icon: "◈",
    status: "Aktivní AI paměť",
  },
  {
    title: "Idea Bank",
    description: "Rychlé nápady přirozeným jazykem a jejich využití v plánu.",
    icon: "◇",
    status: "Součást MVP",
  },
  {
    title: "Trend Radar",
    description:
      "Aktuální trendy se zdrojem, expirací a doporučením pro MyFit.",
    icon: "↗",
    status: "Součást MVP",
  },
  {
    title: "Kampaně",
    description:
      "Mechanika akce, komunikační plán a samostatné potvrzení výše slevy.",
    icon: "◎",
    status: "Finanční potvrzení povinné",
  },
  {
    title: "AI Visual",
    description:
      "Generování náhledového PNG pro Story nebo Post, i bez vlastní fotky.",
    icon: "▧",
    status: "Součást MVP",
  },
  {
    title: "Marketing Memory",
    description:
      "Historie publikovaného obsahu, témat a odvozených doporučení.",
    icon: "◌",
    status: "Učí se až z potvrzených dat",
  },
];
