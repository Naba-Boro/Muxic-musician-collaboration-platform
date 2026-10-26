import Link from "next/link";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function CheckEmailPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="signup-confirmation-page">
      <Link className="signup-brand" href="/" aria-label="Muxics home">
        <span className="signup-brand-icon" aria-hidden="true">♫</span>
        <span>Muxics<span className="brand-dot">.</span></span>
      </Link>

      <section className="signup-confirmation-card" aria-labelledby="check-email-title">
        <div className="signup-confirmation-icon" aria-hidden="true">✉</div>
        <span className="signup-kicker"><i /> ACCOUNT CREATED</span>
        <h1 id="check-email-title">You’re almost in.</h1>
        <p className="signup-confirmation-lead">Please verify your email to activate your Muxics account.</p>

        {error && <p className="notice notice-error" role="alert">{error}</p>}

        <div className="signup-confirmation-instructions">
          <strong>Check your inbox for the verification link.</strong>
          <span>Open the email and select its verification button. We’ll then activate your account and take you into Muxics.</span>
        </div>

        <p className="signup-confirmation-privacy">Your profile and demo are saved, but stay private until you verify your email. If the email doesn’t appear soon, check your spam or junk folder.</p>
        <Link className="signup-confirmation-link" href="/">Return to sign in</Link>
      </section>

      <p className="signup-confirmation-footer">MUXICS · MUSICIAN COLLABORATION ACROSS INDIA</p>
    </main>
  );
}
