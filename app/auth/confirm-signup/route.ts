import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/signup?error=This+verification+link+is+invalid+or+has+expired.+Try+signing+in+or+contact+support.", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/signup?error=This+verification+link+is+invalid+or+has+expired.+Try+signing+in+or+contact+support.", origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/signup?error=Your+email+was+verified,+but+we+couldn%E2%80%99t+activate+your+profile.+Please+sign+in+or+contact+support.", origin));
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
  if (profileError) {
    return NextResponse.redirect(new URL("/signup?error=Your+email+was+verified,+but+we+couldn%E2%80%99t+activate+your+profile.+Please+sign+in+or+contact+support.", origin));
  }

  return NextResponse.redirect(new URL("/opportunities", origin));
}
