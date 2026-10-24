import Link from "next/link";
import { createGig } from "../../actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewOpportunityPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="signup-layout">
      <header className="signup-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/opportunities">Back to opportunities</Link></header>
      <section className="signup-content">
        <div className="signup-intro"><span className="eyebrow">PUT THE PIECES TOGETHER</span><h1>Post an<br /><em>opportunity.</em></h1><p>Describe what you’re making and the one kind of musician you need for it.</p></div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <form className="signup-form" action={createGig}>
          <div className="field"><label htmlFor="title">Opportunity title</label><input id="title" name="title" maxLength={100} placeholder="e.g. Vocalist for an indie pop single" required /></div>
          <div className="field"><label htmlFor="description">What is the project?</label><textarea id="description" name="description" rows={4} maxLength={4000} placeholder="Briefly describe the music project." required /></div>
          <div className="field"><label htmlFor="expectations">What do you expect from the person?</label><textarea id="expectations" name="expectations" rows={3} maxLength={4000} placeholder="Describe the contribution and any important requirements." required /></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="requiredSpecialty">One expert type needed</label><select id="requiredSpecialty" name="requiredSpecialty" required defaultValue=""><option value="" disabled>Select a specialty</option><option>Vocalist / singer</option><option>Instrumentalist</option><option>Songwriter</option><option>Lyricist</option><option>Composer</option><option>Music producer</option><option>Sound engineer</option><option>Mixing engineer</option><option>Mastering engineer</option><option>Arranger</option><option>Beatmaker</option><option>DJ</option><option>Other</option></select><input className="other-entry" name="requiredSpecialtyOther" placeholder="If you chose Other, specify the expert type" /></div>
            <div className="field"><label htmlFor="estimatedDuration">Estimated project duration</label><input id="estimatedDuration" name="estimatedDuration" placeholder="e.g. 2–3 weeks" required /></div>
          </div>
          <fieldset className="choice-fieldset"><legend>Opportunity type</legend><label><input type="radio" name="kind" value="collaboration" defaultChecked /> Collaboration <span>No payment through the app</span></label><label><input type="radio" name="kind" value="hiring" /> Hiring <span>Set a fixed amount in INR</span></label></fieldset>
          <div className="field"><label htmlFor="paymentAmount">Fixed amount offered <span className="optional">required for hiring</span></label><div className="currency-input"><span>₹</span><input id="paymentAmount" name="paymentAmount" type="number" min="1" step="1" placeholder="Amount in rupees" /></div><span className="field-hint">Payment is arranged outside Muxics for v1.</span></div>
          <div className="form-grid location-grid">
            <div className="field"><label htmlFor="city">City</label><input id="city" name="city" required /></div>
            <div className="field"><label htmlFor="state">State</label><input id="state" name="state" required /></div>
            <div className="field"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue="India" required /></div>
          </div>
          <label className="checkbox-row"><input type="checkbox" name="remoteAllowed" /><span>Remote collaboration is possible</span></label>
          <div className="form-grid deadline-grid">
            <div className="field"><label htmlFor="deadlineDate">Application deadline</label><input id="deadlineDate" name="deadlineDate" type="date" required /></div>
            <div className="field"><label htmlFor="deadlineTime">Time <span className="optional">India Standard Time</span></label><input id="deadlineTime" name="deadlineTime" type="time" defaultValue="23:59" required /></div>
          </div>
          <p className="field-hint deadline-note">We’ll remind you 24 hours before the deadline. If you don’t extend it, applications close automatically at the deadline.</p>
          <button className="button button-primary signup-submit" type="submit">Post opportunity <span aria-hidden="true">→</span></button>
        </form>
      </section>
    </main>
  );
}
