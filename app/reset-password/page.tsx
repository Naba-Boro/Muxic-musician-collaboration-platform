import Link from "next/link";
import { updatePassword } from "../actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="simple-auth-page">
      <Link className="brand" href="/"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link>
      <section className="simple-auth-card">
        <span className="eyebrow">ACCOUNT ACCESS</span>
        <h1>Choose a new password</h1>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <form className="auth-form" action={updatePassword}>
          <label htmlFor="password">New password</label>
          <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
          <button className="button button-primary" type="submit">Update password <span aria-hidden="true">→</span></button>
        </form>
      </section>
    </main>
  );
}
