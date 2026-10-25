import Link from "next/link";
import { AuthExperience } from "./auth/auth-forms";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ authMode?: string; error?: string; message?: string }>;
};

function WaveMark({ large = false }: { large?: boolean }) {
  return (
    <span className={`auth-wave-mark${large ? " auth-wave-mark-large" : ""}`} aria-hidden="true">
      {[8, 14, 21, 12, 26, 15, 9].map((height, index) => <i key={index} style={{ height }} />)}
    </span>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { authMode, error, message } = await searchParams;
  const initialMode = authMode === "forgot" ? "forgot" : "signin";

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link href="/" className="auth-brand" aria-label="Muxics home">
          <span className="auth-brand-mark"><WaveMark /></span>
          <span>Muxics<span className="brand-dot">.</span></span>
        </Link>
        <div className="auth-session"><span className="auth-live-dot" /> INDEPENDENT MUSICIAN NETWORK <span className="auth-topbar-divider">//</span> INDIA</div>
        <div className="auth-topbar-actions"><span className="auth-route">MUXICS <b>/ SIGN IN</b></span><span className="auth-topbar-new">New to Muxics?</span><Link href="/signup" className="auth-topbar-cta">Create profile <span aria-hidden="true">↗</span></Link></div>
      </header>

      <div className="auth-main">
        <section className="auth-story" aria-label="About Muxics">
          <div className="auth-story-copy">
            <span className="auth-kicker"><span aria-hidden="true">✳</span> A MUSICIAN-TO-MUSICIAN NETWORK</span>
            <h1>Where Indian musicians <em>connect, collaborate,</em> and create.</h1>
            <p>Find vocalists, instrumentalists, songwriters, producers, and engineers for your next project.</p>
          </div>

          <article className="auth-opportunity-preview" aria-label="Sample opportunity preview">
            <div className="auth-preview-top"><span><i /> SAMPLE OPPORTUNITY</span><span className="auth-preview-kind">COLLABORATION</span></div>
            <div className="auth-preview-content">
              <span className="auth-preview-label">PROJECT BRIEF</span>
              <h2>Vocalist for an indie pop single</h2>
              <p>Looking for a vocalist to collaborate on a new original track.</p>
            </div>
            <div className="auth-preview-tags"><span>Looking for · Vocalist</span><span>Remote friendly</span><span>2–3 weeks</span></div>
            <div className="auth-preview-bottom"><span>OPEN TO MUSICIANS ACROSS INDIA</span><span aria-hidden="true">♫</span></div>
          </article>

          <div className="auth-story-footer"><span><i /> FIND YOUR PEOPLE. MAKE YOUR SOUND.</span><span>COLLABORATION · HIRING · DISCOVERY</span></div>
        </section>

        <section className="auth-panel" aria-label="Account access">
          <div className="auth-panel-inner">
            <div className="auth-mobile-brand">
              <span className="auth-mobile-logo"><WaveMark large /></span>
              <span className="auth-mobile-wordmark">Muxics<span className="brand-dot">.</span></span>
            </div>
            <div className="auth-mobile-intro">
              <span className="auth-kicker"><span className="auth-live-dot" /> MUSIC PEOPLE, TOGETHER</span>
              <h1>Sign in to Muxics</h1>
              <p>Connect, collaborate, and create with musicians across India.</p>
              <WaveMark large />
            </div>
            <AuthExperience initialMode={initialMode} error={error} message={message} />
            <div className="auth-mobile-status"><span><i /> YOUR NEXT COLLABORATION STARTS HERE</span><span>INDIA · IST</span></div>
          </div>
        </section>
      </div>

      <footer className="auth-footer"><span><b>MUXICS</b> MUSICIAN COLLABORATION</span><span>Independent musicians, connected across India.</span><span>BUILT FOR YOUR NEXT PROJECT <i>♫</i></span></footer>
    </main>
  );
}
