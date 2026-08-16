export type CalendarContentKit = {
  headline: string;
  message: string;
  caption: string;
  cta: string;
  theme: string;
  visualDirection: string;
  textVariants: CalendarTextVariant[];
  slides?: CalendarSlideDraft[];
};

export type CalendarSlideDraft = {
  position: number;
  role: "hook" | "benefit" | "detail" | "cta";
  headline: string;
  message: string;
  visualDirection: string;
  cta?: string;
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
  slides?: SavedCalendarSlide[];
  storySlides?: SavedCalendarStorySlide[];
};

export type SavedCalendarSlide = {
  position: number;
  dataUrl: string;
  generatedAt: string;
  mode: "live" | "demo";
  version: number;
  kit: CalendarContentKit;
};

export type SavedCalendarStorySlide = SavedCalendarSlide;

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
  return createSeriesSlideContentKit(
    baseKit,
    {
      position: frame.position,
      role:
        frame.position === 1
          ? "hook"
          : frame.position === options.totalSlides
            ? "cta"
            : "detail",
      headline: frame.text.split("\n")[0]?.trim() || options.title,
      message: frame.text,
      visualDirection: frame.direction,
      cta:
        frame.position === options.totalSlides
          ? options.cta || baseKit.cta
          : undefined,
    },
    options,
  );
}

export function createSeriesSlideContentKit(
  baseKit: CalendarContentKit,
  frame: CalendarSlideDraft,
  options: { title: string; cta?: string; totalSlides: number },
): CalendarContentKit {
  return {
    ...baseKit,
    headline: compactText(
      frame.headline || options.title,
      CONTENT_KIT_LIMITS.headline,
    ),
    message: compactText(frame.message, CONTENT_KIT_LIMITS.message),
    caption: compactText(baseKit.caption, CONTENT_KIT_LIMITS.caption),
    cta: compactText(
      frame.cta ||
        (frame.position === options.totalSlides
          ? options.cta || baseKit.cta
          : baseKit.cta),
      CONTENT_KIT_LIMITS.cta,
    ),
    theme: compactText(baseKit.theme, CONTENT_KIT_LIMITS.theme),
    visualDirection: compactText(
      [
        `Stránka ${frame.position} z ${options.totalSlides}, role ${frame.role}`,
        frame.visualDirection,
        baseKit.visualDirection,
      ]
        .filter(Boolean)
        .join(". "),
      CONTENT_KIT_LIMITS.visualDirection,
    ),
  };
}

export function createPostCarouselSlides(
  title: string,
  kit: CalendarContentKit,
): CalendarSlideDraft[] {
  if (kit.slides && kit.slides.length > 1)
    return [...kit.slides]
      .sort((first, second) => first.position - second.position)
      .slice(0, 4)
      .map((slide, index, slides) => ({
        ...slide,
        position: index + 1,
        role:
          index === 0
            ? "hook"
            : index === slides.length - 1
              ? "cta"
              : slide.role,
        cta: index === slides.length - 1 ? slide.cta || kit.cta : slide.cta,
      }));

  return [
    {
      position: 1,
      role: "hook",
      headline: kit.headline || title,
      message: kit.message,
      visualDirection:
        "Úvodní editorial cover. Velký klidný headline vlevo, světlé okno a privátní studio vpravo.",
    },
    {
      position: 2,
      role: "benefit",
      headline: "SOUKROMÍ",
      message: "Celé studio máš jen pro sebe.",
      visualDirection:
        "Detail čistého prostoru, lavičky a jednoruček. Hodně vzduchu, žádní další lidé.",
    },
    {
      position: 3,
      role: "benefit",
      headline: "VLASTNÍ TEMPO",
      message: "Cvičíš v klidu, bez čekání a zbytečného ruchu.",
      visualDirection:
        "Otevřené okno, přirozené teplé světlo, rostlina a nenucená wellness atmosféra.",
    },
    {
      position: 4,
      role: "cta",
      headline: "UDĚLEJ SI ČAS PRO SEBE",
      message: "Tvůj prostor. Tvé tempo.",
      visualDirection:
        "Čistý závěrečný slide s velkým negativním prostorem a jemným zlatým rámečkem pro CTA.",
      cta: kit.cta,
    },
  ];
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
  expectedSeriesSlides?: number,
) {
  const expectedSlides = expectedSeriesSlides ?? item.storySlideCount ?? 1;
  if (expectedSlides > 1)
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

function drawLogo(context: CanvasRenderingContext2D) {
  const color = "#b7862c";
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

function drawTextLines(
  context: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    maxLines: number;
  },
) {
  const lines = wrapText(context, text, options.maxWidth).slice(
    0,
    options.maxLines,
  );
  lines.forEach((line, index) =>
    context.fillText(line, options.x, options.y + index * options.lineHeight),
  );
  return options.y + Math.max(0, lines.length - 1) * options.lineHeight;
}

function fitHeadlineTypography(
  context: CanvasRenderingContext2D,
  text: string,
  options: {
    maxWidth: number;
    maxLines: number;
    preferredSize: number;
    minimumSize: number;
  },
) {
  for (
    let fontSize = options.preferredSize;
    fontSize >= options.minimumSize;
    fontSize -= 4
  ) {
    context.font = `400 ${fontSize}px Georgia`;
    const lines = wrapText(context, text, options.maxWidth);
    if (
      lines.length <= options.maxLines &&
      lines.every((line) => context.measureText(line).width <= options.maxWidth)
    ) {
      return { fontSize, lineHeight: Math.round(fontSize * 1.14) };
    }
  }

  return {
    fontSize: options.minimumSize,
    lineHeight: Math.round(options.minimumSize * 1.14),
  };
}

function drawHeart(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.moveTo(0, 12);
  context.bezierCurveTo(-30, -16, -54, 22, 0, 64);
  context.bezierCurveTo(54, 22, 30, -16, 0, 12);
  context.stroke();
  context.restore();
}

export type CalendarGraphicPage = {
  position: number;
  total: number;
  role: CalendarSlideDraft["role"];
  supportingPoints?: Array<Pick<CalendarSlideDraft, "headline" | "message">>;
};

function drawBenefitIcon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#b7862c";
  context.lineWidth = 2.5;
  context.beginPath();
  context.arc(0, 0, 42, 0, Math.PI * 2);
  context.stroke();

  if (index % 3 === 0) {
    context.beginPath();
    context.roundRect(-15, -4, 30, 26, 4);
    context.stroke();
    context.beginPath();
    context.arc(0, -5, 11, Math.PI, Math.PI * 2);
    context.stroke();
  } else if (index % 3 === 1) {
    context.beginPath();
    context.arc(0, 0, 19, 0, Math.PI * 2);
    context.moveTo(0, 0);
    context.lineTo(0, -12);
    context.moveTo(0, 0);
    context.lineTo(11, 7);
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(0, 21);
    context.bezierCurveTo(-27, 5, -25, -19, 0, -25);
    context.bezierCurveTo(25, -19, 27, 5, 0, 21);
    context.moveTo(0, 18);
    context.lineTo(0, -17);
    context.stroke();
  }
  context.restore();
}

function drawSupportingPoints(
  context: CanvasRenderingContext2D,
  points: Array<Pick<CalendarSlideDraft, "headline" | "message">>,
  options: { x: number; y: number; maxWidth: number; gap: number },
) {
  points.forEach((point, index) => {
    const y = options.y + index * options.gap;
    drawBenefitIcon(context, options.x + 44, y + 28, index);
    context.fillStyle = "#171513";
    context.font = "600 27px Arial";
    context.letterSpacing = "2px";
    context.fillText(
      point.headline.toLocaleUpperCase("cs-CZ"),
      options.x + 112,
      y + 13,
    );
    context.letterSpacing = "0px";
    context.fillStyle = "#4b4640";
    context.font = "400 24px Arial";
    drawTextLines(context, point.message, {
      x: options.x + 112,
      y: y + 52,
      maxWidth: options.maxWidth - 112,
      lineHeight: 32,
      maxLines: 2,
    });
  });
}

export async function createCalendarGraphic(
  type: string,
  kit: CalendarContentKit,
  backgroundDataUrl: string,
  page?: CalendarGraphicPage,
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

  const shade = context.createLinearGradient(0, 0, width * 0.84, 0);
  shade.addColorStop(0, "rgba(250,239,222,.995)");
  shade.addColorStop(0.48, "rgba(250,239,222,.95)");
  shade.addColorStop(0.76, "rgba(250,239,222,.5)");
  shade.addColorStop(1, "rgba(250,239,222,.04)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);

  const warmth = context.createLinearGradient(0, 0, 0, height);
  warmth.addColorStop(0, "rgba(255,250,242,.12)");
  warmth.addColorStop(1, "rgba(120,78,24,.12)");
  context.fillStyle = warmth;
  context.fillRect(0, 0, width, height);

  drawLogo(context);

  const pagePosition = page?.position ?? 1;
  const pageTotal = page?.total ?? 1;
  const pageRole = page?.role ?? "hook";
  const supportingPoints = page?.supportingPoints ?? [];
  const left = 64;
  const textWidth = isPost ? 630 : 690;
  const headlineStart = isPost ? 360 : 470;
  const headline = kit.headline.toLocaleUpperCase("cs-CZ");
  const headlineLines = isPost ? 4 : 5;
  const headlineTypography = fitHeadlineTypography(context, headline, {
    maxWidth: textWidth,
    maxLines: headlineLines,
    preferredSize: isPost ? 82 : 94,
    minimumSize: isPost ? 44 : 42,
  });

  context.fillStyle = "#9a6d22";
  context.font = "600 24px Arial";
  context.letterSpacing = "5px";
  context.fillText(
    pageRole === "cta"
      ? "ČAS PRO SEBE"
      : pageRole === "hook"
        ? "BOUTIQUE PRIVATE FITNESS"
        : "PROČ MY FIT",
    left,
    headlineStart - 88,
  );
  context.letterSpacing = "0px";

  context.fillStyle = "#171513";
  context.font = `400 ${headlineTypography.fontSize}px Georgia`;
  const headlineEnd = drawTextLines(context, headline, {
    x: left,
    y: headlineStart,
    maxWidth: textWidth,
    lineHeight: headlineTypography.lineHeight,
    maxLines: headlineLines,
  });

  const dividerY = Math.min(
    headlineEnd + (isPost ? 70 : 92),
    isPost ? 780 : 1080,
  );
  context.strokeStyle = "#b7862c";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(left, dividerY);
  context.lineTo(left + 210, dividerY);
  context.moveTo(left + 300, dividerY);
  context.lineTo(left + 540, dividerY);
  context.stroke();
  context.lineWidth = 2;
  drawHeart(context, left + 255, dividerY - 15);

  if (pageRole === "hook" && supportingPoints.length > 0) {
    drawSupportingPoints(context, supportingPoints.slice(0, isPost ? 2 : 3), {
      x: left,
      y: dividerY + (isPost ? 70 : 88),
      maxWidth: textWidth,
      gap: isPost ? 122 : 144,
    });
  } else {
    const messageY = dividerY + (isPost ? 78 : 108);
    context.fillStyle = "rgba(255,250,242,.74)";
    context.beginPath();
    context.roundRect(left, messageY - 44, textWidth, isPost ? 190 : 230, 18);
    context.fill();
    context.strokeStyle = "rgba(183,134,44,.52)";
    context.stroke();
    context.fillStyle = "#2b2926";
    context.font = `400 ${isPost ? 31 : 38}px Arial`;
    drawTextLines(context, kit.message, {
      x: left + 34,
      y: messageY + 16,
      maxWidth: textWidth - 68,
      lineHeight: isPost ? 44 : 54,
      maxLines: 4,
    });
    context.fillStyle = "#9a6d22";
    context.font = `italic ${isPost ? 24 : 30}px Georgia`;
    context.fillText(
      pageRole === "cta"
        ? "Udělej něco pro sebe."
        : "Vlastní tempo. Vlastní prostor.",
      left + 34,
      messageY + (isPost ? 146 : 178),
    );
  }

  const ctaY = isPost ? 1160 : 1635;
  context.fillStyle = "rgba(250,239,222,.88)";
  context.beginPath();
  context.roundRect(left, ctaY, isPost ? 650 : 730, isPost ? 104 : 126, 8);
  context.fill();
  context.strokeStyle = "#b7862c";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = "#171513";
  context.font = `500 ${isPost ? 25 : 31}px Arial`;
  context.letterSpacing = "3px";
  context.fillText(
    kit.cta.toLocaleUpperCase("cs-CZ"),
    left + 36,
    ctaY + (isPost ? 65 : 77),
  );
  context.letterSpacing = "0px";
  context.fillStyle = "#b7862c";
  context.font = `400 ${isPost ? 44 : 52}px Arial`;
  context.fillText("→", left + (isPost ? 565 : 638), ctaY + (isPost ? 69 : 81));

  context.fillStyle = "#8f661b";
  context.font = `500 ${isPost ? 18 : 22}px Arial`;
  context.letterSpacing = "2px";
  context.fillText("MYFITGYM.CZ", left, height - 58);
  context.textAlign = "right";
  context.fillText(
    `${String(pagePosition).padStart(2, "0")} / ${String(pageTotal).padStart(2, "0")}`,
    width - 58,
    height - 58,
  );
  context.textAlign = "left";
  context.letterSpacing = "0px";

  return canvas.toDataURL("image/png");
}
