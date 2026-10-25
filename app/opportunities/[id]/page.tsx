import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { applyToGig } from "../../actions";

export const instant = false;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function OpportunityDetailPage({ params, searchParams }: Props) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Supabase isn’t connected yet</h1><p>Connect the project to view opportunity details.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: gig } = await supabase.from("gigs").select("*").eq("id", id).maybeSingle();
  if (!gig) notFound();
  const [{ data: poster }, { data: application }] = await Promise.all([
    supabase.from("profiles").select("display_name,username,city,state").eq("id", gig.poster_id).maybeSingle(),
    supabase.from("applications").select("status").eq("gig_id", id).eq("applicant_id", user.id).maybeSingle(),
  ]);
  const isPoster = gig.poster_id === user.id;
  const isAccepting = gig.status === "open" && new Date(gig.deadline_at).getTime() > Date.now();
  const canApply = !isPoster && isAccepting && !application;
  const deadline = new Date(gig.deadline_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="signup-layout detail-layout opportunity-detail-page">
      <header className="signup-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/opportunities">← Back to opportunities</Link></header>
      <div className="opportunity-detail-breadcrumb"><Link href="/opportunities">Opportunities</Link><span>/</span><span>{gig.required_specialty}</span><span>/</span><span>Opportunity details</span></div>
      <div className="opportunity-detail-grid">
        <div className="opportunity-detail-main">
          <section className="opportunity-detail-intro">
            <div className="opportunity-detail-labels"><span className="opportunity-detail-id">Opportunity · {gig.id.slice(0, 8).toUpperCase()}</span><span className={gig.kind === "hiring" ? "opportunity-type opportunity-type-hiring" : "opportunity-type"}><i aria-hidden="true" />{gig.kind === "hiring" ? "Hiring" : "Collaboration"}</span><span className={isAccepting ? "detail-open-status" : "detail-closed-status"}>{isAccepting ? "Application window open" : "Closed"}</span></div>
            <h1>{gig.title}</h1>
            <div className="opportunity-detail-poster"><span className="opportunity-avatar" aria-hidden="true">{(poster?.display_name ?? "M").slice(0, 1).toUpperCase()}</span><div><strong>{poster?.display_name ?? "Music community member"}</strong><span>{poster?.city ?? gig.city}, {poster?.state ?? gig.state}{poster?.username && <> · <Link href={`/profiles/${poster.username}`}>View profile ↗</Link></>}</span></div></div>
          </section>

          <section className="opportunity-fact-grid" aria-label="Opportunity details">
            <div><span className="opportunity-fact-icon" aria-hidden="true">☷</span><p>Role needed</p><strong>{gig.required_specialty}</strong></div>
            <div><span className="opportunity-fact-icon" aria-hidden="true">◷</span><p>Estimated duration</p><strong>{gig.estimated_duration}</strong></div>
            <div><span className="opportunity-fact-icon" aria-hidden="true">⌖</span><p>Location</p><strong>{gig.city}, {gig.state}, {gig.country}{gig.remote_allowed ? " · Remote possible" : ""}</strong></div>
            <div><span className="opportunity-fact-icon" aria-hidden="true">▦</span><p>Apply by</p><strong>{deadline} IST</strong></div>
          </section>

          <section className="opportunity-detail-copy"><span className="opportunity-detail-eyebrow">Project brief</span><h2>About this project</h2><p>{gig.description}</p></section>
          <section className="opportunity-detail-copy"><span className="opportunity-detail-eyebrow">Contribution</span><h2>What the poster expects</h2><p>{gig.expectations}</p></section>
        </div>

        <aside className="opportunity-application-column">
          <section className="opportunity-compensation-card">
            <span className="opportunity-detail-eyebrow">{gig.kind === "hiring" ? "Hiring opportunity" : "Collaboration opportunity"}</span>
            {gig.kind === "hiring" ? <><p className="opportunity-budget-label">Fixed amount offered</p><strong className="opportunity-budget">₹{new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0)} <small>INR</small></strong><p className="opportunity-payment-note">Payment is arranged directly between the poster and contributor in this version of Muxics.</p></> : <><h2>Collaborate on this project</h2><p className="opportunity-payment-note">This is an unpaid collaboration opportunity. Discuss the project terms with the poster before accepting.</p></>}
          </section>
          <section className="opportunity-application-card">
            <div className="opportunity-application-heading"><div><h2>{isPoster ? "Your opportunity" : application ? "Your application" : "Apply to this opportunity"}</h2><p>{isPoster ? "Review the musicians who have applied." : "Send a short introduction to the poster."}</p></div></div>
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            {application ? <div className="application-status-box">Application status <strong>{application.status.replaceAll("_", " ")}</strong></div> : canApply ? <form className="apply-box opportunity-application-form" action={applyToGig}><input type="hidden" name="gigId" value={gig.id} /><label htmlFor="message">Your message</label><textarea id="message" name="message" rows={5} maxLength={2000} placeholder="Introduce yourself and explain why you’re a good fit." required /><p>Your profile and demo help the poster learn about your work.</p><button className="button button-primary" type="submit">Send application <span aria-hidden="true">→</span></button></form> : isPoster ? <Link className="button button-primary manage-applicants" href={`/my-opportunities/${gig.id}`}>View applicants <span aria-hidden="true">→</span></Link> : <div className="application-status-box">This opportunity is no longer accepting applications.</div>}
          </section>
        </aside>
      </div>
    </main>
  );
}
