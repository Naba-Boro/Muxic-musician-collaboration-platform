import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/opportunities";
  const flow = searchParams.get("flow");
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/opportunities";
  const isSignupConfirmation = flow === "signup" || (!flow && next !== "/reset-password");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isSignupConfirmation) {
        const { data: profile, error: lookupError } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        if (lookupError) return NextResponse.redirect(new URL("/signup?error=Email+verified,+but+we+couldn%E2%80%99t+activate+your+profile.+Please+sign+in+or+contact+support.", origin));
        if (profile && !profile.onboarding_completed) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id);
          if (profileError) return NextResponse.redirect(new URL("/signup?error=Email+verified,+but+we+couldn%E2%80%99t+activate+your+profile.+Please+sign+in+or+contact+support.", origin));
        }
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(new URL("/?error=That+sign-in+link+could+not+be+used.+Try+signing+in+or+request+a+new+link.", origin));
}
