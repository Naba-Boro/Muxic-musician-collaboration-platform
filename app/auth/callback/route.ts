import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tokenType = searchParams.get("type");

  // Older Supabase email templates may still send callbacks to this route.
  // Keep recovery links on the recovery handler so failures never look like
  // signup verification failures.
  if (tokenType === "recovery") {
    const recovery = new URL("/auth/recovery", origin);
    if (code) recovery.searchParams.set("code", code);
    if (tokenHash) recovery.searchParams.set("token_hash", tokenHash);
    recovery.searchParams.set("type", "recovery");
    return NextResponse.redirect(recovery);
  }

  if (tokenHash) {
    const confirmation = new URL("/auth/confirm-signup", origin);
    confirmation.searchParams.set("token_hash", tokenHash);
    if (tokenType) confirmation.searchParams.set("type", tokenType);
    return NextResponse.redirect(confirmation);
  }

  const requestedNext = searchParams.get("next") ?? "/opportunities";
  let next = "/opportunities";
  let nextPath = "/opportunities";
  if (requestedNext.startsWith("/")) {
    try {
      const candidate = new URL(requestedNext, origin);
      if (candidate.origin === origin) {
        next = `${candidate.pathname}${candidate.search}${candidate.hash}`;
        nextPath = candidate.pathname;
      }
    } catch {
      // Malformed destinations fall back to the opportunities page.
    }
  }
  // Compatibility for email links sent before signup and recovery had separate callback routes.
  const isSignupConfirmation = nextPath !== "/reset-password";
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
    if (!isSignupConfirmation) {
      return NextResponse.redirect(new URL("/forgot-password?error=That+reset+link+could+not+be+used.+Request+a+new+one.", origin));
    }
  }
  return NextResponse.redirect(new URL("/signup?error=That+verification+link+could+not+be+used.+Try+signing+in+or+request+a+new+link.", origin));
}
