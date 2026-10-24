import Link from "next/link";
import { signIn } from "./actions";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <main className="auth-layout">
      <section className="auth-art" aria-label="A place for musicians to find their next collaborators">
        <Link className="brand" href="/" aria-label="Muxics home">
          <span className="brand-icon" aria-hidden="true">♫</span>
          <span>Muxics<span className="brand-dot">.</span></span>
        </Link>

        <div className="art-copy">
          <span className="eyebrow"><span className="eyebrow-mark">✳</span> MADE FOR MUSIC PEOPLE</span>
          <h1>Make your<br />next thing<br /><em>together.</em></h1>
          <p>Find the voice, hands, and ears your project is missing.</p>
        </div>

        <div className="sound-orbit sound-orbit-one" />
        <div className="sound-orbit sound-orbit-two" />
        <div className="note note-a" aria-hidden="true">♫</div>
        <div className="note note-b" aria-hidden="true">♪</div>
        <div className="note note-c" aria-hidden="true">♬</div>
        <div className="art-card">
          <span className="art-card-label">A GOOD PLACE TO START</span>
          <div className="art-record"><span>mj</span></div>
          <strong>Your next collaboration</strong>
          <span className="art-card-caption">is closer than you think</span>
          <div className="art-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </div>

        <div className="art-footer"><span>✦</span> FIND YOUR PEOPLE. MAKE YOUR SOUND.</div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand brand">
            <span className="brand-icon" aria-hidden="true">♫</span>
            <span>Muxics<span className="brand-dot">.</span></span>
          </div>
          <div className="auth-heading">
            <span className="eyebrow">YOUR PEOPLE ARE HERE</span>
            <h2>Welcome back</h2>
            <p>Sign in to find your next music collaborator.</p>
          </div>

          {message && <p className="notice notice-success" role="status">{message}</p>}
          {error && <p className="notice notice-error" role="alert">{error}</p>}

          <form className="auth-form" action={signIn}>
            <label htmlFor="identifier">Email or username</label>
            <input id="identifier" name="identifier" type="text" autoComplete="username" placeholder="you@example.com or yourname" required />

            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" className="small-link">Forgot password?</Link>
            </div>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />

            <button className="button button-primary" type="submit">Sign in <span aria-hidden="true">→</span></button>
          </form>

          <div className="auth-divider"><span>NEW TO MUXICS?</span></div>
          <Link className="button button-secondary" href="/signup">Create your profile <span aria-hidden="true">↗</span></Link>
          <p className="auth-legal">By continuing, you confirm that you are 18 or older.</p>
        </div>
      </section>
    </main>
  );
}
