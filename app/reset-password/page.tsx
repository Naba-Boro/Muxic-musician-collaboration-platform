import Link from "next/link";
import { PasswordResetForm } from "../auth/auth-forms";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string }> };

function WaveMark() {
  return <span className="auth-wave-mark" aria-hidden="true">{[8, 14, 21, 12, 26, 15, 9].map((height, index) => <i key={index} style={{ height }} />)}</span>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return <main className="auth-page recovery-page">
    <header className="auth-topbar">
      <Link href="/" className="auth-brand" aria-label="Muxics home"><span className="auth-brand-mark"><WaveMark /></span><span>Muxics<span className="brand-dot">.</span></span></Link>
      <div className="auth-session"><span className="auth-live-dot" /> ACCOUNT RECOVERY <span className="auth-topbar-divider">//</span> SET PASSWORD</div>
      <Link className="auth-route" href="/">← BACK TO <b>SIGN IN</b></Link>
    </header>

    <div className="recovery-main reset-main">
      <section className="recovery-intro">
        <span className="auth-kicker">STAGE GATE 02 <span>·</span> STUDIO IDENTITY DESK</span>
        <h1>Choose a new password</h1>
        <p>Set a new password for your account, then sign in and return to your projects.</p>
        <div className="recovery-steps" aria-label="Password recovery steps">
          <Link href="/forgot-password"><i>1</i> Request link</Link><span className="recovery-step-line" /><span className="is-current"><i>2</i> Set password</span>
        </div>
      </section>

      <section className="reset-workspace" aria-label="Set a new password">
        <div className="reset-form-panel">
          <div className="recovery-panel-top"><span><i /> PASSWORD UPDATE</span><span>RESET LINK REQUIRED</span></div>
          <div className="reset-form-body">
            <div className="reset-form-intro"><span className="auth-field-code">NEW ACCOUNT KEY</span><h2>Set a new password</h2><p>Choose at least 8 characters and enter it again to confirm.</p></div>
            <PasswordResetForm error={error} />
          </div>
        </div>
        <aside className="recovery-aside reset-aside">
          <section className="recovery-help-card"><div className="recovery-aside-icon" aria-hidden="true">⌑</div><div><h2>Use your reset email</h2><p>This page works after you open the password reset link sent to your email.</p><Link href="/forgot-password">Request a new link <span aria-hidden="true">→</span></Link></div></section>
          <div className="recovery-security-note"><span aria-hidden="true">◇</span><p><b>Choose a private password</b><br />Don’t reuse a password you share with another service.</p></div>
        </aside>
      </section>
    </div>

    <footer className="auth-footer"><span><b>MUXICS</b> MUSICIAN COLLABORATION</span><span>Independent musicians, connected across India.</span><span>SECURE ACCOUNT ACCESS <i>♫</i></span></footer>
  </main>;
}
