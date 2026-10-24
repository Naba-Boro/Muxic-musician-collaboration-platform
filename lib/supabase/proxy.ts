import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./env";

const protectedRoutes = ["/opportunities", "/my-opportunities", "/discover", "/applications", "/proposals", "/projects", "/settings", "/notifications", "/profiles"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isProtected = protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path));
  if (!user && isProtected) {
    const login = new URL("/", request.url);
    login.searchParams.set("message", "Sign in to continue.");
    return NextResponse.redirect(login);
  }
  if (user && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/opportunities", request.url));
  }
  return response;
}
