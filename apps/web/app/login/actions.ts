"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "../_lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/today");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=1");
  redirect("/today");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
