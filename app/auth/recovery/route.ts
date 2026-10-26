import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
  }

  return NextResponse.redirect(new URL("/reset-password", origin));
}
