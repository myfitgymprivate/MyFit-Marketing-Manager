import { NextResponse } from "next/server";

export function GET() {
  const requestId = crypto.randomUUID();

  return NextResponse.json(
    {
      data: {
        status: "ok",
        service: "myfit-web",
      },
      meta: {
        requestId,
      },
    },
    {
      headers: {
        "x-request-id": requestId,
      },
    },
  );
}
