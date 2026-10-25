import Link from "next/link";
import { PasswordResetForm } from "../auth/auth-forms";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string }> };

function WaveMark() {
  return <span className="auth-wave-mark" aria-hidden="true">{[8, 14, 21, 12, 26, 15, 9].map((height, index) => <i key={index} style={{ height }} />)}</span>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="auth-page auth-reset-page">
      <header className="auth-topbar">
        <Link href="/" className="auth-brand" aria-label="Muxics home"><span className="auth-brand-mark"><WaveMark /></span><span>Muxics<span className="brand-dot">.</span></span></Link>
        <div className="auth-session"><span className="auth-live-dot" /> ACCOUNT RECOVERY <span className="auth-topbar-divider">//</span> SECURE RESET</div>
        <Link className="auth-route auth-reset-back" href="/">BACK TO <b>SIGN IN</b></Link>
      </header>
      <div className="auth-reset-main">
        <section className="auth-reset-intro"><span className="auth-kicker"><span aria-hidden="true">✳</span> ACCOUNT ACCESS</span><h1>Back to making<br /><em>music together.</em></h1><p>Choose a new password for your Muxics account. Use at least eight characters.</p><div className="auth-reset-note"><span aria-hidden="true">♫</span><span>Keep your account secure. Your new password must match in both fields.</span></div></section>
        <section className="auth-panel auth-reset-panel" aria-label="Set a new password"><div className="auth-panel-inner"><div className="auth-card"><div className="auth-card-topline"><span><i /> RESET SESSION</span><span>SECURE LINK</span></div><div className="auth-card-heading"><span className="auth-field-code">PASSWORD UPDATE // 02</span><h2>Choose a new password</h2><p>Set a new key for your Muxics account.</p></div><PasswordResetForm error={error} /></div></div></section>
      </div>
      <footer className="auth-footer"><span><b>MUXICS</b> MUSICIAN COLLABORATION</span><span>Independent musicians, connected across India.</span><span>SECURE ACCOUNT ACCESS <i>♫</i></span></footer>
    </main>
  );
}
