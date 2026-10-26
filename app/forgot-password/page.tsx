import Link from "next/link";
import { RecoveryRequestForm } from "../auth/auth-forms";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

function WaveMark() {
  return <span className="auth-wave-mark" aria-hidden="true">{[8, 14, 21, 12, 26, 15, 9].map((height, index) => <i key={index} style={{ height }} />)}</span>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, message } = await searchParams;
  return <main className="auth-page recovery-page">
    <header className="auth-topbar">
      <Link href="/" className="auth-brand" aria-label="Muxics home"><span className="auth-brand-mark"><WaveMark /></span><span>Muxics<span className="brand-dot">.</span></span></Link>
      <div className="auth-session"><span className="auth-live-dot" /> ACCOUNT RECOVERY <span className="auth-topbar-divider">//</span> PRIVATE RESET</div>
      <Link className="auth-route" href="/">← BACK TO <b>SIGN IN</b></Link>
    </header>

    <div className="recovery-main">
      <section className="recovery-intro">
        <span className="auth-kicker">CREDENTIAL ACCESS <span>·</span> ACCOUNT RECOVERY</span>
        <h1>Account<br className="recovery-desktop-break" /> recovery</h1>
        <p>Restore access to your Muxics account and get back to finding your next collaborator.</p>
      </section>

      <section className="recovery-workspace" aria-label="Request a password reset">
        <div className="recovery-form-panel">
          <div className="recovery-panel-top"><span><i /> RECOVERY DISPATCH</span><span>PRIVATE LOOKUP</span></div>
          <div className="recovery-form-body">
            <h2>Forgot your password?</h2>
            <p className="recovery-form-intro">Enter your account email or username. If it matches an account, we’ll send reset instructions to the registered email.</p>
            <RecoveryRequestForm error={error} message={message} />
            {!message && <div className="recovery-privacy"><span aria-hidden="true">◇</span><p><b>Privacy protected</b><br />We use the same confirmation either way, so this page won’t reveal whether an account exists.</p></div>}
          </div>
        </div>

      </section>
    </div>

    <footer className="auth-footer"><span><b>MUXICS</b> MUSICIAN COLLABORATION</span><span>Independent musicians, connected across India.</span><span>SECURE ACCOUNT ACCESS <i>♫</i></span></footer>
  </main>;
}
