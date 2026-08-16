import { isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

export async function getAuthenticatedUserId() {
  if (!isSupabaseConfigured()) return "local-demo-user";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase!.auth.getClaims();
  return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
}
