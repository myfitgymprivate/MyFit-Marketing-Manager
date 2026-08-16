import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseConfig } from "../env";

const publicPaths = new Set([
  "/login",
  "/api/v1/health",
  "/api/v1/jobs/reservations",
  "/api/v1/ready",
  "/manifest.webmanifest",
]);

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims?.sub);
  const isPublic = publicPaths.has(request.nextUrl.pathname);

  if (!authenticated && !isPublic) {
    if (request.nextUrl.pathname.startsWith("/api/"))
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Přihlášení vypršelo." } },
        { status: 401 },
      );
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && request.nextUrl.pathname === "/login") {
    const target = request.nextUrl.clone();
    target.pathname = "/today";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}
