"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset, signIn, updatePassword } from "../actions";

function PersonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.4-3.5 2.7-5.4 6.5-5.4s6.1 1.9 6.5 5.4"/></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{hidden ? <><path d="M3 3l18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c5.2 0 8.7 4.7 9.5 6-.3.5-1.4 2.1-3.3 3.6M6.2 6.2C4.1 7.5 2.7 9.5 2.5 11c.5.8 3.9 7 9.5 7a9.4 9.4 0 0 0 3.3-.6"/></> : <><path d="M2.5 12s3.2-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.2 6.2-9.5 6.2S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/></>}</svg>;
}

export function AuthExperience({ initialMode, error, message }: {
  initialMode: "signin" | "forgot";
  error?: string;
  message?: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(!message);
  const isForgot = mode === "forgot";
  const isConfirmation = isForgot && Boolean(message) && !showResetForm;

  return (
    <section className="auth-card" aria-label={isForgot ? "Reset password" : "Sign in"}>
      <div className="auth-card-topline"><span><i /> {isForgot ? "ACCOUNT RECOVERY" : "MUXICS // AUTH GATE"}</span><span>{isForgot ? "SECURE LINK" : "MEMBER ACCESS"}</span></div>

      {isConfirmation ? <div className="auth-confirmation" role="status">
        <span className="auth-confirmation-icon" aria-hidden="true">✓</span>
        <span className="auth-field-code">RESET LINK SENT</span>
        <h2>Check your email</h2>
        <p>{message}</p>
        <button type="button" className="auth-submit" onClick={() => setMode("signin")}>Back to sign in <span aria-hidden="true">→</span></button>
        <button type="button" className="auth-back-button" onClick={() => setShowResetForm(true)}>Use a different email or username</button>
      </div> : <>
        <div className="auth-card-heading">
          <span className="auth-field-code">{isForgot ? "ACCOUNT ACCESS // 01" : "STUDIO SESSION // MEMBER ACCESS"}</span>
          <h2>{isForgot ? "Reset your password" : "Sign in to Muxics"}</h2>
          <p>{isForgot ? "Enter your email or username and we’ll send a secure reset link." : "Enter your credentials to find your next music collaborator."}</p>
        </div>

        {error && <p className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><span><strong>{error.includes("No account exists") ? "Account not found" : "Authentication error"}</strong><br />{error}</span></p>}
        {!error && message && <p className="notice notice-success" role="status">{message}</p>}

        {isForgot ? <form className="auth-console-form" action={requestPasswordReset}>
          <div className="auth-field">
            <div className="auth-field-label"><label htmlFor="reset-identifier">EMAIL OR USERNAME</label><span>IN // CH.1</span></div>
            <div className="auth-input-wrap"><input id="reset-identifier" name="identifier" type="text" autoComplete="username" placeholder="you@example.com or yourname" required /><span className="auth-input-icon"><PersonIcon /></span></div>
          </div>
          <button className="auth-submit" type="submit">Send reset link <span aria-hidden="true">→</span></button>
          <button type="button" className="auth-back-button" onClick={() => setMode("signin")}>← Back to sign in</button>
        </form> : <form className="auth-console-form" action={signIn}>
          <div className="auth-field">
            <div className="auth-field-label"><label htmlFor="identifier">EMAIL OR USERNAME</label><span>IN // CH.1</span></div>
            <div className="auth-input-wrap"><input id="identifier" name="identifier" type="text" autoComplete="username" placeholder="you@example.com or yourname" required /><span className="auth-input-icon"><PersonIcon /></span></div>
          </div>
          <div className="auth-field">
            <div className="auth-field-label"><label htmlFor="password">PASSWORD</label><span>KEY // AUTH</span></div>
            <div className="auth-input-wrap"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required /><button className="auth-input-icon auth-input-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><EyeIcon hidden={showPassword} /></button></div>
          </div>
          <Link className="auth-forgot-link" href="/forgot-password">Forgot your password?</Link>
          <button className="auth-submit" type="submit">Sign in <span aria-hidden="true">→</span></button>
          <div className="auth-card-signup"><span>NEW TO MUXICS?</span><Link href="/signup">Create your musician profile <span aria-hidden="true">↗</span></Link></div>
        </form>}
      </>}
    </section>
  );
}

export function PasswordResetForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [mismatch, setMismatch] = useState("");

  return <form className="auth-console-form" action={updatePassword} onSubmit={(event) => {
    const form = event.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const confirmation = String(new FormData(form).get("confirmPassword") ?? "");
    if (password !== confirmation) {
      event.preventDefault();
      setMismatch("The passwords don’t match. Check both fields and try again.");
    } else {
      setMismatch("");
    }
  }}>
    {(error || mismatch) && <p className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><span><strong>Password not updated</strong><br />{mismatch || error}</span></p>}
    <div className="auth-field">
      <div className="auth-field-label"><label htmlFor="new-password">NEW PASSWORD</label><span>MIN. 8 CHARACTERS</span></div>
      <div className="auth-input-wrap"><input id="new-password" name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" required /><button className="auth-input-icon auth-input-toggle" type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><EyeIcon hidden={showPassword} /></button></div>
    </div>
    <div className="auth-field">
      <div className="auth-field-label"><label htmlFor="confirm-password">CONFIRM PASSWORD</label><span>RE-ENTER KEY</span></div>
      <div className="auth-input-wrap"><input id="confirm-password" name="confirmPassword" type={showConfirmation ? "text" : "password"} minLength={8} autoComplete="new-password" required /><button className="auth-input-icon auth-input-toggle" type="button" aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmation} onClick={() => setShowConfirmation((value) => !value)}><EyeIcon hidden={showConfirmation} /></button></div>
    </div>
    <button className="auth-submit" type="submit">Update password <span aria-hidden="true">→</span></button>
    <Link className="auth-back-button" href="/">← Back to sign in</Link>
  </form>;
}

export function RecoveryRequestForm({ error, message }: { error?: string; message?: string }) {
  const [showConfirmation, setShowConfirmation] = useState(Boolean(message));

  if (showConfirmation) {
    return <div className="recovery-dispatched" role="status">
      <div className="recovery-dispatched-icon" aria-hidden="true">✓</div>
      <div><div className="recovery-state-label">TRANSMISSION DISPATCHED <span>PRIVATE</span></div>
        <p>If an account matches that email or username, we’ve sent a reset link to its registered email. Check your inbox and spam folder.</p>
        <div className="recovery-dispatched-bottom"><span>Reset links expire for security.</span><button type="button" onClick={() => setShowConfirmation(false)}>Send another link</button></div>
      </div>
    </div>;
  }

  return <form className="auth-console-form recovery-request-form" action={requestPasswordReset}>
    {error && <p className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><span><strong>Could not send the link</strong><br />{error}</span></p>}
    <div className="recovery-card-heading"><span className="auth-field-code">RECOVERY CREDENTIAL <span>CH—01</span></span><p>Enter the email or username on your account. We’ll send password reset instructions if it matches.</p></div>
    <div className="auth-field">
      <div className="auth-field-label"><label htmlFor="recovery-identifier">VERIFIED USERNAME OR EMAIL</label></div>
      <div className="auth-input-wrap"><input id="recovery-identifier" name="identifier" type="text" autoComplete="username" placeholder="you@example.com or username" required /><span className="auth-input-icon"><PersonIcon /></span></div>
      <div className="recovery-format"><span>Format: @handle or email</span><span>PRIVATE LOOKUP</span></div>
    </div>
    <button className="auth-submit" type="submit">Send reset link <span aria-hidden="true">➤</span></button>
  </form>;
}
