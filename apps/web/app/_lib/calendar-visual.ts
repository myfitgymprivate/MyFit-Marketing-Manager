export type CalendarContentKit = {
  headline: string;
  message: string;
  caption: string;
  cta: string;
  theme: string;
  visualDirection: string;
  textVariants: CalendarTextVariant[];
};

export type CalendarTextVariant = {
  id: string;
  label: string;
  headline: string;
  message: string;
  caption: string;
  cta: string;
};

export type SavedCalendarVisual = {
  itemId: string;
  dataUrl: string;
  generatedAt: string;
  mode: "live" | "demo";
  kit: CalendarContentKit;
  storySlides?: SavedCalendarStorySlide[];
};

export type SavedCalendarStorySlide = {
  position: number;
  dataUrl: string;
  generatedAt: string;
  mode: "live" | "demo";
  version: number;
  kit: CalendarContentKit;
};

export type CalendarVisualMeta = {
  generatedAt: string;
  mode: "live" | "demo";
  storySlideCount?: number;
};

const CONTENT_KIT_LIMITS = {
  headline: 90,
  message: 180,
  caption: 900,
  cta: 60,
  theme: 220,
  visualDirection: 400,
} as const;

const VISUAL_REQUEST_LIMITS = {
  headline: 160,
  theme: 240,
} as const;

function compactText(value: string, maximum: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximum) return normalized;
  const candidate = normalized.slice(0, Math.max(0, maximum - 1)).trimEnd();
  const lastSpace = candidate.lastIndexOf(" ");
  const shortened =
    lastSpace >= maximum * 0.65 ? candidate.slice(0, lastSpace) : candidate;
  return `${shortened.trimEnd()}…`;
}

export function createStorySlideContentKit(
  baseKit: CalendarContentKit,
  frame: { text: string; direction: string; position: number },
  options: { title: string; cta?: string; totalSlides: number },
): CalendarContentKit {
  return {
    ...baseKit,
    headline: compactText(
      frame.text.split("\n")[0]?.trim() || options.title,
      CONTENT_KIT_LIMITS.headline,
    ),
    message: compactText(frame.text, CONTENT_KIT_LIMITS.message),
    caption: compactText(baseKit.caption, CONTENT_KIT_LIMITS.caption),
    cta: compactText(
      frame.position === options.totalSlides
        ? options.cta || baseKit.cta
        : baseKit.cta,
      CONTENT_KIT_LIMITS.cta,
    ),
    theme: compactText(baseKit.theme, CONTENT_KIT_LIMITS.theme),
    visualDirection: compactText(
      [frame.direction, baseKit.visualDirection].filter(Boolean).join(". "),
      CONTENT_KIT_LIMITS.visualDirection,
    ),
  };
}

export function createCalendarVisualRequestCopy(
  kit: Pick<CalendarContentKit, "headline" | "theme" | "visualDirection">,
) {
  return {
    headline: compactText(kit.headline, VISUAL_REQUEST_LIMITS.headline),
    theme: compactText(
      [kit.theme, kit.visualDirection].filter(Boolean).join(". "),
      VISUAL_REQUEST_LIMITS.theme,
    ),
  };
}

export function calendarVisualReady(
  item: { type: string; storySlideCount?: number },
  meta?: CalendarVisualMeta,
  completedStorySlides?: number,
) {
  const expectedSlides = item.storySlideCount ?? 1;
  if (item.type === "STORY" && expectedSlides > 1)
    return completedStorySlides === undefined
      ? meta?.storySlideCount === expectedSlides
      : completedStorySlides === expectedSlides;
  return Boolean(meta);
}

const DATABASE_NAME = "myfit-marketing-assets";
const STORE_NAME = "calendar-visuals";

function openVisualDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME))
        database.createObjectStore(STORE_NAME, { keyPath: "itemId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCalendarVisual(visual: SavedCalendarVisual) {
  const database = await openVisualDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(visual);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getCalendarVisual(itemId: string) {
  const database = await openVisualDatabase();
  const visual = await new Promise<SavedCalendarVisual | null>(
    (resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(itemId);
      request.onsuccess = () =>
        resolve((request.result as SavedCalendarVisual | undefined) ?? null);
      request.onerror = () => reject(request.error);
    },
  );
  database.close();
  return visual;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = `${line} ${word}`.trim();
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function loadImage(source: string) {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  context.drawImage(
    image,
    (width - renderedWidth) / 2,
    (height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight,
  );
}

function drawLogo(context: CanvasRenderingContext2D, light: boolean) {
  const color = light ? "#c49432" : "#dbbe50";
  context.fillStyle = color;
  context.font = "400 58px Arial";
  context.fillText("MY", 62, 125);
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.strokeRect(180, 62, 126, 92);
  context.font = "400 44px Courier New";
  context.fillText("FIT", 202, 123);
  context.font = "400 18px Courier New";
  context.fillText("P R I V A T E   F I T N E S S", 64, 188);
}

export async function createCalendarGraphic(
  type: string,
  kit: CalendarContentKit,
  backgroundDataUrl: string,
) {
  const isPost = type === "POST";
  const width = 1080;
  const height = isPost ? 1350 : 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Grafiku nelze v tomto prohlížeči vytvořit.");

  const image = await loadImage(backgroundDataUrl);
  drawCover(context, image, width, height);

  if (isPost) {
    const shade = context.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, "rgba(8,10,14,.96)");
    shade.addColorStop(0.58, "rgba(8,10,14,.64)");
    shade.addColorStop(1, "rgba(8,10,14,.18)");
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
    drawLogo(context, false);
    context.fillStyle = "#dbbe50";
    context.font = "400 38px Courier New";
    context.fillText("MYFIT NOVINKA", 60, 340);
    context.fillStyle = "#fff8ec";
    context.font = "400 72px Courier New";
    const lines = wrapText(
      context,
      kit.headline.toLocaleUpperCase("cs-CZ"),
      760,
    ).slice(0, 4);
    lines.forEach((line, index) =>
      context.fillText(line, 60, 440 + index * 82),
    );
    context.strokeStyle = "#c49432";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(60, 810);
    context.lineTo(560, 810);
    context.stroke();
    context.fillStyle = "#f3dcc2";
    context.font = "400 32px Courier New";
    wrapText(context, kit.message.toLocaleUpperCase("cs-CZ"), 720)
      .slice(0, 3)
      .forEach((line, index) => context.fillText(line, 60, 900 + index * 42));
    context.fillStyle = "#c49432";
    context.font = "400 25px Courier New";
    context.fillText(`${kit.cta.toLocaleUpperCase("cs-CZ")}  →`, 60, 1220);
  } else {
    const shade = context.createLinearGradient(0, 0, 900, 0);
    shade.addColorStop(0, "rgba(243,220,194,.99)");
    shade.addColorStop(0.52, "rgba(243,220,194,.92)");
    shade.addColorStop(1, "rgba(243,220,194,.08)");
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
    drawLogo(context, true);
    context.fillStyle = "#c49432";
    context.font = "400 40px Courier New";
    context.fillText(type === "REEL" ? "REEL" : "STORY", 60, 390);
    context.fillStyle = "#111114";
    context.font = "400 70px Courier New";
    const lines = wrapText(
      context,
      kit.headline.toLocaleUpperCase("cs-CZ"),
      720,
    ).slice(0, 5);
    lines.forEach((line, index) =>
      context.fillText(line, 60, 490 + index * 80),
    );
    context.strokeStyle = "#c49432";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(0, 980);
    context.lineTo(560, 980);
    context.stroke();
    context.fillStyle = "#111114";
    context.font = "400 34px Courier New";
    wrapText(context, kit.message.toLocaleUpperCase("cs-CZ"), 700)
      .slice(0, 3)
      .forEach((line, index) => context.fillText(line, 60, 1080 + index * 46));
    context.fillStyle = "rgba(243,220,194,.86)";
    context.beginPath();
    context.roundRect(64, 1480, 950, 250, 38);
    context.fill();
    context.strokeStyle = "#c49432";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#c49432";
    context.font = "400 31px Courier New";
    context.fillText("PŘIPRAVENO PRO MYFIT", 120, 1570);
    context.fillStyle = "#111114";
    context.font = "400 42px Courier New";
    context.fillText(kit.cta.toLocaleUpperCase("cs-CZ"), 120, 1650);
    context.fillStyle = "#8f661b";
    context.font = "400 22px Courier New";
    context.fillText("MYFITGYM.CZ", 60, 1840);
  }

  return canvas.toDataURL("image/png");
}
