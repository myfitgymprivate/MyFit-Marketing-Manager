import * as XLSX from "xlsx";
import { z } from "zod";

import { getAuthenticatedUserId } from "../../../../_lib/auth";
import {
  buildPlanImportPreview,
  buildStoryScenarioMap,
  type PlanImportMapping,
} from "../../../../_lib/plan-import";
import { signPlanImportPayload } from "../../../../_lib/plan-import-token";

const existingItemSchema = z.object({
  id: z.string(),
  date: z.iso.date(),
  type: z.string(),
  title: z.string(),
  externalId: z.string().optional(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T) {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!(await getAuthenticatedUserId()))
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Přihlášení vypršelo." } },
      { status: 401 },
    );

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_IMPORT_BODY",
          message: "Soubor se nepodařilo načíst.",
          requestId,
        },
      },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File) || !/\.(xlsx|csv)$/i.test(file.name))
    return Response.json(
      {
        error: {
          code: "UNSUPPORTED_IMPORT_FILE",
          message: "Vyber soubor XLSX nebo CSV.",
          requestId,
        },
      },
      { status: 422 },
    );
  if (file.size > MAX_FILE_SIZE)
    return Response.json(
      {
        error: {
          code: "IMPORT_FILE_TOO_LARGE",
          message: "Soubor může mít nejvýše 5 MB.",
          requestId,
        },
      },
      { status: 413 },
    );

  try {
    const bytes = await file.arrayBuffer();
    const isCsv = file.name.toLocaleLowerCase("cs-CZ").endsWith(".csv");
    const workbook = isCsv
      ? XLSX.read(new TextDecoder("utf-8").decode(bytes), {
          type: "string",
          cellDates: false,
          raw: true,
        })
      : XLSX.read(bytes, { type: "array", cellDates: false });
    const requestedSheet = String(formData.get("sheetName") ?? "");
    const sheetName = workbook.SheetNames.includes(requestedSheet)
      ? requestedSheet
      : workbook.SheetNames[0];
    if (!sheetName) throw new Error("Soubor neobsahuje žádný list.");
    const headerRow = Math.max(
      1,
      Math.min(50, Number(formData.get("headerRow") ?? 1)),
    );
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("Vybraný list neexistuje.");
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
    });
    const headers = (matrix[headerRow - 1] ?? []).map((value) =>
      String(value).trim(),
    );
    const rows = matrix
      .slice(headerRow)
      .map((values) =>
        Object.fromEntries(
          headers.map((header, index) => [header, values[index]]),
        ),
      );
    const existingItems = z
      .array(existingItemSchema)
      .catch([])
      .parse(parseJsonField(formData.get("existingItems"), []));
    const suppliedMapping = parseJsonField<PlanImportMapping | undefined>(
      formData.get("mapping"),
      undefined,
    );
    const scenarioSheet = workbook.Sheets["Stories scénáře"];
    const scenarioMatrix = scenarioSheet
      ? XLSX.utils.sheet_to_json<unknown[]>(scenarioSheet, {
          header: 1,
          raw: true,
          defval: "",
        })
      : [];
    const scenarioHeaders = (scenarioMatrix[0] ?? []).map((value) =>
      String(value).trim(),
    );
    const storyScenarios = buildStoryScenarioMap(
      scenarioMatrix
        .slice(1)
        .map((values) =>
          Object.fromEntries(
            scenarioHeaders.map((header, index) => [header, values[index]]),
          ),
        ),
    );
    const preview = buildPlanImportPreview(
      rows,
      headers,
      existingItems,
      suppliedMapping,
      storyScenarios,
    );
    const fileHash = Buffer.from(
      await crypto.subtle.digest("SHA-256", bytes),
    ).toString("hex");
    const source = isCsv ? ("CSV_IMPORT" as const) : ("XLSX_IMPORT" as const);
    const payload = {
      fileName: file.name,
      fileHash,
      source,
      sheetName,
      headerRow,
      mapping: preview.mapping,
      items: preview.items,
    };
    const previewToken = await signPlanImportPayload(payload);
    return Response.json({
      data: {
        sheets: workbook.SheetNames,
        preview,
        payload,
        previewToken,
      },
      meta: { requestId },
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          code: "IMPORT_PREVIEW_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Náhled importu se nepodařilo připravit.",
          requestId,
        },
      },
      { status: 422 },
    );
  }
}
