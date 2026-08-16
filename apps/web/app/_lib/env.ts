import { z } from "zod";

const productionSchema = z.object({
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  MYFIT_WORKSPACE_ID: z.uuid(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),
  CRON_SECRET: z.string().min(32),
  PLAN_IMPORT_SIGNING_SECRET: z.string().min(32),
});

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function getProductionReadiness() {
  const parsed = productionSchema.safeParse(process.env);
  return {
    ready: parsed.success,
    missing: parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.path.join(".")),
  };
}
