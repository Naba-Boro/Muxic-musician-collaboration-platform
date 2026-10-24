import Link from "next/link";
import { requestPasswordReset } from "../actions";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, message } = await searchParams;
  return (
    <main className="simple-auth-page">
      <Link className="brand" href="/"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link>
      <section className="simple-auth-card">
        <span className="eyebrow">ACCOUNT ACCESS</span>
        <h1>Reset your password</h1>
        <p>Enter your account email and we’ll send you a secure reset link.</p>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        {message && <p className="notice notice-success" role="status">{message}</p>}
        <form className="auth-form" action={requestPasswordReset}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <button className="button button-primary" type="submit">Send reset link <span aria-hidden="true">→</span></button>
        </form>
        <Link className="small-link back-link" href="/">Back to sign in</Link>
      </section>
    </main>
  );
}
