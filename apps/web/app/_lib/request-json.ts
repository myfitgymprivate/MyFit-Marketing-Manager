export async function readJsonBody(request: Request) {
  try {
    return { ok: true as const, value: (await request.json()) as unknown };
  } catch {
    return { ok: false as const };
  }
}

export function invalidJsonResponse(requestId: string) {
  return Response.json(
    {
      error: {
        code: "INVALID_JSON",
        message: "Požadavek neobsahuje platný JSON.",
        requestId,
        retryable: false,
      },
    },
    { status: 400 },
  );
}
