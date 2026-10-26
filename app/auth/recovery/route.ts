import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createPasswordRecoveryProof } from "@/lib/supabase/recovery-proof";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tokenType = searchParams.get("type");

  if (!tokenHash && !code) {
    return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
  }

  const supabase = await createClient();
  let userId: string | undefined;
  if (tokenHash) {
    if (tokenType !== "recovery") {
      return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
    }
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error || !data.user) {
      return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
    }
    userId = data.user.id;
  } else if (code) {
    if (tokenType && tokenType !== "recovery") {
      return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(new URL("/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.", origin));
    }
    userId = data.user.id;
  }

  const cookie = createPasswordRecoveryProof(userId!);
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
  return NextResponse.redirect(new URL("/reset-password", origin));
}
