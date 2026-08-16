import { pingDatabase } from "@myfit/database";

import { getDatabase } from "../../../_lib/database";
import { getProductionReadiness } from "../../../_lib/env";

export async function GET() {
  const requestId = crypto.randomUUID();
  const environment = getProductionReadiness();
  let database = false;
  if (environment.ready) {
    try {
      await pingDatabase(getDatabase());
      database = true;
    } catch {
      database = false;
    }
  }
  const ready = environment.ready && database;
  return Response.json(
    {
      data: {
        status: ready ? "ready" : "not_ready",
        database,
        missing: environment.missing,
      },
      meta: { requestId },
    },
    { status: ready ? 200 : 503 },
  );
}
