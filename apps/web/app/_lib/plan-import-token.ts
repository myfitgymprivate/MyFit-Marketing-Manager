function signingSecret() {
  return (
    process.env.PLAN_IMPORT_SIGNING_SECRET ??
    process.env.CRON_SECRET ??
    "myfit-local-plan-import-preview"
  );
}

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(value: ArrayBuffer) {
  return Buffer.from(value).toString("base64url");
}

export async function signPlanImportPayload(payload: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(
    await crypto.subtle.sign("HMAC", await signingKey(), encoded),
  );
}

export async function verifyPlanImportPayload(payload: unknown, token: string) {
  try {
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    return crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      Buffer.from(token, "base64url"),
      encoded,
    );
  } catch {
    return false;
  }
}
