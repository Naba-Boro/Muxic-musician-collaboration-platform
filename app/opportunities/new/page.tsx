import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { createGig } from "../../actions";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewOpportunityPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="opportunities-shell create-opportunity-page">
      <header className="app-header">
        <Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link>
        <nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities" aria-current="page">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav>
        <div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div>
      </header>

      <section className="create-opportunity-wrap">
        <div className="create-opportunity-breadcrumb"><Link href="/my-opportunities">← My opportunities</Link><span>/</span><strong>Create new opportunity</strong></div>
        <div className="create-opportunity-heading"><div><span className="eyebrow">STUDIO CHANNEL 01 · POSTING</span><h1>Create an opportunity</h1><p>Describe your project and the specialist you need. Musicians across India can apply.</p></div><span className="create-draft-label"><i /> New opportunity</span></div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <aside className="create-terms-note"><span aria-hidden="true">ⓘ</span><p><strong>Opportunity terms lock after the first acceptance.</strong> Check the role, timeline, location, and offer carefully. You can accept multiple contributors for this one specialty.</p></aside>

        <form className="create-opportunity-form" action={createGig}>
          <section className="create-form-section">
            <header><span>01</span><h2>Basic information</h2><small>Core project details</small></header>
            <div className="field"><label htmlFor="title">Opportunity title <b>*</b><small>Up to 100 characters</small></label><input id="title" name="title" maxLength={100} placeholder="e.g. Need final mix &amp; master for a 4-track indie EP" required /><span className="field-hint">A clear title helps musicians quickly understand what you need.</span></div>
            <div className="field"><label htmlFor="description">Brief project description <b>*</b><small>Shown on the opportunity card</small></label><textarea id="description" name="description" rows={3} maxLength={4000} placeholder="Give a concise overview of the music project, its sound, and what you are making." required /></div>
            <div className="field"><label htmlFor="expectations">Expectations and responsibilities <b>*</b><small>What the contributor will do</small></label><textarea id="expectations" name="expectations" rows={4} maxLength={4000} placeholder={"Describe the contribution and requirements. For example:\n• Deliverables or session responsibilities\n• File format or tools, if relevant\n• Revisions or handoff expectations"} required /><span className="field-hint">Be specific about the work and expected handoff.</span></div>
          </section>

          <section className="create-form-section">
            <header><span>02</span><h2>Required specialty</h2><small>One discipline per opportunity</small></header>
            <div className="field specialty-field"><label htmlFor="requiredSpecialty">Primary role specialty <b>*</b></label><select id="requiredSpecialty" name="requiredSpecialty" required defaultValue=""><option value="" disabled>Select exactly one specialty…</option><option>Vocalist / singer</option><option>Instrumentalist</option><option>Songwriter</option><option>Lyricist</option><option>Composer</option><option>Music producer</option><option>Sound engineer</option><option>Mixing engineer</option><option>Mastering engineer</option><option>Arranger</option><option>Beatmaker</option><option>DJ</option><option>Other</option></select><input className="other-entry" name="requiredSpecialtyOther" placeholder="If you chose Other, specify the specialty" /><p className="create-inline-note"><span aria-hidden="true">☷</span> Each opportunity has one specialty. You may accept multiple contributors for that role.</p></div>
          </section>

          <section className="create-form-section">
            <header><span>03</span><h2>Timeline and location</h2><small>Project logistics</small></header>
            <div className="form-grid create-timeline-grid">
              <div className="field"><label htmlFor="estimatedDuration">Estimated project duration <b>*</b></label><input id="estimatedDuration" name="estimatedDuration" placeholder="e.g. 2–3 weeks" required /><span className="field-hint">Expected project timeframe.</span></div>
              <div className="field"><label htmlFor="deadlineDate">Application deadline <b>*</b></label><input id="deadlineDate" name="deadlineDate" type="date" required /><span className="field-hint">Deadline time is India Standard Time.</span></div>
              <div className="field"><label htmlFor="deadlineTime">Deadline time (IST) <b>*</b></label><input id="deadlineTime" name="deadlineTime" type="time" defaultValue="23:59" required /></div>
            </div>
            <p className="create-inline-note create-deadline-note"><span aria-hidden="true">◷</span> Applications close automatically at the deadline. You can extend it before it closes if nobody has been accepted.</p>
            <div className="create-location-title"><div><strong>Target location</strong><span>Where the project will take place</span></div><label className="create-toggle"><input type="checkbox" name="remoteAllowed" /><span>Remote work allowed</span><i aria-hidden="true" /></label></div>
            <div className="form-grid location-grid">
              <div className="field"><label htmlFor="city">City <b>*</b></label><input id="city" name="city" placeholder="e.g. Mumbai" required /></div>
              <div className="field"><label htmlFor="state">State <b>*</b></label><input id="state" name="state" placeholder="e.g. Maharashtra" required /></div>
              <div className="field"><label htmlFor="country">Country <b>*</b></label><input id="country" name="country" defaultValue="India" required /></div>
            </div>
          </section>

          <section className="create-form-section">
            <header><span>04</span><h2>Opportunity type</h2><small>How this role is offered</small></header>
            <fieldset className="create-deal-options"><legend>Choose the engagement model <b>*</b></legend>
              <label className="create-deal-card"><input type="radio" name="kind" value="collaboration" defaultChecked /><span className="create-radio" /><span className="create-deal-copy"><strong>Collaboration</strong><small>Work together on a music project. Agree on contribution terms directly.</small><em>Collaborative project</em></span><span className="create-deal-icon" aria-hidden="true">♬</span></label>
              <label className="create-deal-card create-hiring-card"><input type="radio" name="kind" value="hiring" /><span className="create-radio" /><span className="create-deal-copy"><strong>Hiring</strong><small>Offer a fixed amount for the requested contribution.</small><em>Fixed amount in INR</em></span><span className="create-deal-icon" aria-hidden="true">₹</span></label>
            </fieldset>
            <div className="create-hiring-fields">
              <div className="field"><label htmlFor="paymentAmount">Fixed compensation amount (INR) <b>* for hiring</b><small>One fixed amount for the full engagement</small></label><div className="currency-input"><span>₹</span><input id="paymentAmount" name="paymentAmount" type="number" min="1" step="1" placeholder="Enter amount in rupees" /></div></div>
              <p className="create-inline-note"><span aria-hidden="true">ⓘ</span> For v1, payment is arranged directly between poster and contributor outside Muxics. The app does not process or hold funds.</p>
            </div>
          </section>

          <div className="create-form-actions"><Link href="/opportunities">Cancel</Link><button className="button button-primary" type="submit">Publish opportunity <span aria-hidden="true">→</span></button></div>
        </form>
      </section>
      <footer className="create-opportunity-footer"><span>● Muxics · Musician collaboration across India</span><span>All opportunity terms are set by the poster</span></footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities" aria-current="page"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
    </main>
  );
}
