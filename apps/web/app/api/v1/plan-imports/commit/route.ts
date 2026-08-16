import { z } from "zod";

import { getAuthenticatedUserId } from "../../../../_lib/auth";
import {
  invalidJsonResponse,
  readJsonBody,
} from "../../../../_lib/request-json";
import { verifyPlanImportPayload } from "../../../../_lib/plan-import-token";

const requestSchema = z.object({
  previewToken: z.string().min(20),
  payload: z.object({
    fileName: z.string().min(1),
    fileHash: z.string().min(20),
    source: z.enum(["XLSX_IMPORT", "CSV_IMPORT"]),
    sheetName: z.string().min(1),
    headerRow: z.number().int().positive(),
    mapping: z.record(z.string(), z.string()),
    items: z.array(z.record(z.string(), z.unknown())),
  }),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!(await getAuthenticatedUserId()))
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Přihlášení vypršelo." } },
      { status: 401 },
    );
  const body = await readJsonBody(request);
  if (!body.ok) return invalidJsonResponse(requestId);
  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success)
    return Response.json(
      {
        error: {
          code: "INVALID_IMPORT_COMMIT",
          message: "Potvrzení importu není platné.",
          requestId,
        },
      },
      { status: 422 },
    );
  const verified = await verifyPlanImportPayload(
    parsed.data.payload,
    parsed.data.previewToken,
  );
  if (!verified)
    return Response.json(
      {
        error: {
          code: "IMPORT_PREVIEW_CHANGED",
          message: "Náhled se změnil. Načti soubor znovu před potvrzením.",
          requestId,
        },
      },
      { status: 409 },
    );
  return Response.json({
    data: { verified: true, payload: parsed.data.payload },
    meta: { requestId },
  });
}
