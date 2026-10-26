import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tokenType = searchParams.get("type");

  // A stale recovery email template can point here. Forward it to the correct
  // flow instead of trying to activate the account as a signup confirmation.
  if (tokenType === "recovery") {
    const recovery = new URL("/auth/recovery", origin);
    if (code) recovery.searchParams.set("code", code);
    if (tokenHash) recovery.searchParams.set("token_hash", tokenHash);
    recovery.searchParams.set("type", "recovery");
    return NextResponse.redirect(recovery);
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/signup?error=This+verification+link+is+invalid+or+has+expired.+Try+signing+in+or+contact+support.", origin));
  }

  const supabase = await createClient();
  if (tokenHash) {
    // Some recovery templates send the token hash through the signup
    // confirmation route. Let Supabase validate the token's actual purpose
    // before treating it as a signup verification token.
    const { error: recoveryError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (!recoveryError) {
      return NextResponse.redirect(new URL("/reset-password", origin));
    }
  }

  const { error: verificationError } = tokenHash
    ? tokenType === "signup" || tokenType === "email"
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType })
      : { error: new Error("Unsupported verification link type") }
    : await supabase.auth.exchangeCodeForSession(code!);
  if (verificationError) {
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
