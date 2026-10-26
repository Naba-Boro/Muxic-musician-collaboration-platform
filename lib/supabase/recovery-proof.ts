import { createHmac, timingSafeEqual } from "node:crypto";

export const PASSWORD_RECOVERY_COOKIE = "muxics-password-recovery";
const RECOVERY_WINDOW_SECONDS = 30 * 60;

function signature(userId: string, expiresAt: number) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Supabase server secret is not configured.");
  return createHmac("sha256", secret).update(`${userId}:${expiresAt}`).digest("base64url");
}

export function createPasswordRecoveryProof(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + RECOVERY_WINDOW_SECONDS;
  return {
    name: PASSWORD_RECOVERY_COOKIE,
    value: `${expiresAt}.${signature(userId, expiresAt)}`,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/reset-password",
      maxAge: RECOVERY_WINDOW_SECONDS,
    },
  };
}

export function isValidPasswordRecoveryProof(value: string | undefined, userId: string) {
  if (!value) return false;
  const [expiresText, suppliedSignature, extra] = value.split(".");
  if (extra !== undefined || !/^\d+$/.test(expiresText)) return false;

  const expiresAt = Number(expiresText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const supplied = Buffer.from(suppliedSignature ?? "");
  const expected = Buffer.from(signature(userId, expiresAt));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
