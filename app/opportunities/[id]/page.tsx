import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { applyToGig } from "../../actions";

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
  const canApply = !isPoster && gig.status === "open" && new Date(gig.deadline_at).getTime() > Date.now() && !application;
  return (
    <main className="signup-layout detail-layout">
      <header className="signup-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/opportunities">← All opportunities</Link></header>
      <article className="detail-content">
        <div className="detail-top"><span className="gig-type">{gig.kind}</span><span className="detail-state">{gig.status === "open" ? "Accepting applications" : "Closed"}</span></div>
        <h1>{gig.title}</h1>
        <p className="detail-poster">Posted by {poster?.display_name ?? "Music community member"} · {poster?.city ?? gig.city}, {poster?.state ?? gig.state}</p>
        <div className="detail-tags"><span className="gig-specialty">Looking for · {gig.required_specialty}</span>{gig.kind === "hiring" && <span className="gig-payment">₹{new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0)}</span>}</div>
        <section className="detail-section"><h2>About the project</h2><p>{gig.description}</p></section>
        <section className="detail-section"><h2>What the poster expects</h2><p>{gig.expectations}</p></section>
        <div className="detail-facts"><div><span>Estimated duration</span><strong>{gig.estimated_duration}</strong></div><div><span>Location</span><strong>{gig.city}, {gig.state}, {gig.country}{gig.remote_allowed ? " · Remote friendly" : ""}</strong></div><div><span>Apply by</span><strong>{new Date(gig.deadline_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</strong></div></div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        {application ? <div className="application-status-box">You applied · <strong>{application.status.replaceAll("_", " ")}</strong></div> : canApply ? <form className="apply-box" action={applyToGig}><input type="hidden" name="gigId" value={gig.id} /><label htmlFor="message">Introduce yourself to the poster</label><textarea id="message" name="message" rows={4} maxLength={2000} placeholder="Share why you’re a good fit for this project." required /><button className="button button-primary" type="submit">Apply to this opportunity <span aria-hidden="true">→</span></button></form> : isPoster ? <Link className="button button-primary manage-applicants" href={`/my-opportunities/${gig.id}`}>View applicants <span aria-hidden="true">→</span></Link> : <div className="application-status-box">This opportunity is no longer accepting applications.</div>}
      </article>
    </main>
  );
}
