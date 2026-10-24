import Link from "next/link";
import { signUp } from "../actions";

export const instant = false;
import { AudioDemoInput } from "./audio-demo-input";

type SignupPageProps = { searchParams: Promise<{ error?: string }> };

const specialtyOptions = [
  "Vocalist / singer", "Instrumentalist", "Songwriter", "Lyricist", "Composer", "Music producer",
  "Sound engineer", "Mixing engineer", "Mastering engineer", "Arranger", "Beatmaker", "DJ", "Other",
];
const genreOptions = ["Pop", "Rock", "Indie", "Hip-hop", "Electronic", "Classical", "Jazz", "Folk", "Film music", "Other"];

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;
  return (
    <main className="signup-layout">
      <header className="signup-header">
        <Link className="brand" href="/"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link>
        <span>Already have an account? <Link className="small-link" href="/">Sign in</Link></span>
      </header>
      <section className="signup-content">
        <div className="signup-intro">
          <span className="eyebrow">YOUR FIRST STEP</span>
          <h1>Let’s meet the<br /><em>music you.</em></h1>
          <p>Set up the essentials. You can add more work and details to your profile later.</p>
        </div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <form className="signup-form" action={signUp} encType="multipart/form-data">
          <div className="form-section-heading"><span>01</span><h2>Your account</h2></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="fullName">Name</label><input id="fullName" name="fullName" autoComplete="name" required /></div>
            <div className="field"><label htmlFor="username">Username</label><input id="username" name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" placeholder="e.g. riya_sings" required /><span className="field-hint">3–24 letters, numbers, or underscores</span></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="field-hint">At least 8 characters</span></div>
          </div>

          <div className="form-section-heading"><span>02</span><h2>Where you’re based</h2></div>
          <div className="form-grid location-grid">
            <div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required /></div>
            <div className="field"><label htmlFor="state">State</label><input id="state" name="state" autoComplete="address-level1" required /></div>
            <div className="field"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue="India" autoComplete="country-name" required /></div>
          </div>

          <div className="form-section-heading"><span>03</span><h2>Your sound and skills</h2></div>
          <div className="field">
            <label htmlFor="mainSpecialty">Main specialty</label>
            <select id="mainSpecialty" name="mainSpecialty" required defaultValue="">
              <option value="" disabled>Choose your main specialty</option>
              {specialtyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input className="other-entry" name="mainSpecialtyOther" aria-label="Type your main specialty if you chose Other" placeholder="If you chose Other, tell us what you do" />
          </div>
          <div className="field">
            <label htmlFor="secondarySpecialties">Secondary specialties <span className="optional">optional · up to 6</span></label>
            <input id="secondarySpecialties" name="secondarySpecialties" placeholder="Separate with commas, e.g. songwriter, producer" />
          </div>
          <div className="field">
            <label htmlFor="genres">Genres you’re interested in</label>
            <select id="genres" name="genres" required defaultValue="">
              <option value="" disabled>Choose your primary genre</option>
              {genreOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input className="other-entry" name="genreOther" aria-label="Type your genre if you chose Other" placeholder="If you chose Other, tell us the genre" />
            <span className="field-hint">You can add more genres in profile settings later.</span>
          </div>

          <div className="form-section-heading"><span>04</span><h2>Let them hear you</h2></div>
          <p className="section-description">Upload one short demo so other musicians can get a feel for your work. You can add a second one later.</p>
          <AudioDemoInput />

          <label className="checkbox-row"><input type="checkbox" name="ageConfirmed" required /><span>I confirm I’m 18 or older.</span></label>
          <button className="button button-primary signup-submit" type="submit">Create my account <span aria-hidden="true">→</span></button>
          <p className="auth-legal">We’ll email you a verification link before you can sign in.</p>
        </form>
      </section>
    </main>
  );
}
