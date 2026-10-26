import Link from "next/link";
import { signUp } from "../actions";
import { AudioDemoInput } from "./audio-demo-input";
import { ProfileAvatarInput, SignupProfileFields } from "./signup-profile-fields";

export const instant = false;

type SignupPageProps = { searchParams: Promise<{ error?: string }> };

function NoteMark() {
  return <span className="signup-note-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;
  return (
    <main className="signup-page">
      <header className="signup-topbar">
        <Link className="signup-brand" href="/" aria-label="Muxics home"><span className="signup-brand-icon"><NoteMark /></span><span>Muxics<span className="brand-dot">.</span></span></Link>
        <div className="signup-topbar-label"><i /> MUSICIAN PROFILE <span>//</span> REGISTRATION</div>
        <div className="signup-topbar-account"><span>Already a member?</span><Link href="/">Sign in <span aria-hidden="true">→</span></Link></div>
      </header>

      <div className="signup-mobile-progress"><span><i /> CREATE YOUR MUSICIAN PROFILE</span><span>INDIA</span></div>

      <div className="signup-main">
        <aside className="signup-story">
          <span className="signup-kicker"><i /> MADE FOR INDEPENDENT MUSICIANS</span>
          <h1>Join Muxics.<br /><em>Make music together.</em></h1>
          <p>Meet musicians for real projects, focused collaborations, and paid opportunities across India.</p>

          <section className="signup-profile-preview" aria-label="What your Muxics profile will include">
            <div className="signup-preview-head"><span><i /> YOUR MUSICIAN PROFILE</span><span>PUBLIC</span></div>
            <div className="signup-preview-person"><div className="signup-preview-avatar"><NoteMark /></div><div><strong>Your name, your sound</strong><span>Main specialty · Location</span></div></div>
            <div className="signup-preview-tags"><span>Skills</span><span>Genres</span><span>One demo</span></div>
            <p>Your profile helps other musicians discover your work and decide whether you’re a fit for their project.</p>
          </section>

          <div className="signup-story-foot"><span><i /> ONE PROFILE. MANY WAYS TO COLLABORATE.</span><span>INDIA · IST</span></div>
        </aside>

        <section className="signup-form-column" aria-label="Create a Muxics account">
          <div className="signup-form-heading"><span className="signup-kicker"><i /> SET UP YOUR PUBLIC PROFILE</span><h2>Join Muxics</h2><p>Start with the details musicians need to find and work with you.</p></div>
          {error && <p className="notice notice-error" role="alert">{error}</p>}
          <form className="signup-form" action={signUp}>
            <div className="signup-section-title"><span>01</span><div><h3>Credentials & identity</h3><p>Used to create and access your account.</p></div><small>REQUIRED</small></div>
            <ProfileAvatarInput />
            <div className="signup-form-grid">
              <div className="signup-field"><label htmlFor="fullName">FULL NAME</label><input id="fullName" name="fullName" autoComplete="name" placeholder="Your name" maxLength={100} required /></div>
              <div className="signup-field"><label htmlFor="username">USERNAME</label><div className="signup-handle-input"><span>@</span><input id="username" name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" placeholder="your_handle" required /></div><small>3–24 letters, numbers, or underscores</small></div>
              <div className="signup-field"><label htmlFor="email">EMAIL ADDRESS</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
              <div className="signup-field"><label htmlFor="password">PASSWORD <small>8+ CHARACTERS</small></label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Create a password" required /></div>
            </div>

            <SignupProfileFields />

            <div className="signup-section-title"><span>05</span><div><h3>Studio location</h3><p>Help musicians find collaborators nearby.</p></div><small>REQUIRED</small></div>
            <div className="signup-form-grid signup-location-grid">
              <div className="signup-field"><label htmlFor="city">CITY</label><input id="city" name="city" autoComplete="address-level2" placeholder="Your city" maxLength={100} required /></div>
              <div className="signup-field"><label htmlFor="state">STATE / REGION</label><input id="state" name="state" autoComplete="address-level1" placeholder="Your state" maxLength={100} required /></div>
              <div className="signup-field"><label htmlFor="country">COUNTRY</label><input id="country" name="country" defaultValue="India" autoComplete="country-name" maxLength={100} required /></div>
            </div>

            <div className="signup-section-title"><span>06</span><div><h3>A little about you</h3><p>Give potential collaborators useful context.</p></div><small>OPTIONAL</small></div>
            <div className="signup-field signup-bio-field"><label htmlFor="bio">MUSICIAN BIO</label><textarea id="bio" name="bio" rows={4} maxLength={1200} placeholder="What do you make, and what kind of projects are you looking for?" /><small>Up to 1,200 characters</small></div>

            <div className="signup-section-title"><span>07</span><div><h3>Audio demo</h3><p>Give other musicians a quick listen to your work.</p></div><small>REQUIRED · 1 MIN MAX</small></div>
            <AudioDemoInput />
            <p className="signup-demo-privacy">Your demo will be playable from your public profile. Upload only work you have the right to share.</p>

            <label className="signup-consent"><input type="checkbox" name="ageConfirmed" required /><span>I confirm I’m 18 or older and have the right to share the audio demo I uploaded.</span></label>
            <button className="signup-create-button" type="submit">Create my account <span aria-hidden="true">→</span></button>
            <p className="signup-email-note">We’ll email you a verification link. Your profile and demo are saved privately until you verify your email.</p>
          </form>
        </section>
      </div>
      <footer className="signup-footer"><span><b>MUXICS</b> MUSICIAN COLLABORATION</span><span>Independent musicians, connected across India.</span><span>YOUR MUSIC. YOUR PEOPLE. <i>♫</i></span></footer>
    </main>
  );
}
