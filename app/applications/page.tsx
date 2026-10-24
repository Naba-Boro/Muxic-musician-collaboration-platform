import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { withdrawApplication } from "../actions";

export const instant = false;

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function ApplicationsPage({ searchParams }: Props) {
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Applications</h1><p>Connect Supabase to view and track your applications.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: applications } = await supabase.from("applications").select("id,gig_id,message,status,created_at").eq("applicant_id", user.id).order("created_at", { ascending: false });
  const gigIds = [...new Set((applications ?? []).map((application) => application.gig_id))];
  const { data: gigs } = gigIds.length ? await supabase.from("gigs").select("id,title,kind,payment_amount_inr,city,state,deadline_at").in("id", gigIds) : { data: [] };
  const gigMap = new Map((gigs ?? []).map((gig) => [gig.id, gig]));

  return (
    <main className="opportunities-shell">
      <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover">Discover people</Link><Link href="/applications" aria-current="page">Applications</Link><Link href="/proposals">Proposals</Link><Link href="/projects">Projects</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header>
      <section className="feed-wrap">
        <div className="feed-heading"><div><span className="eyebrow">YOUR OPPORTUNITY TRACKER</span><h1>Applications.</h1><p>See where each application stands.</p></div><Link className="create-gig" href="/my-opportunities">My posted gigs <span aria-hidden="true">→</span></Link></div>
        {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
        {applications?.length ? <div className="application-list">{applications.map((application) => {
          const gig = gigMap.get(application.gig_id);
          return <article className="application-card" key={application.id}>
            <div className="gig-card-top"><span className="gig-type">{gig?.kind ?? "Opportunity"}</span><span className={`status-pill status-${application.status}`}>{application.status.replaceAll("_", " ")}</span></div>
            <h2>{gig ? <Link href={`/opportunities/${gig.id}`}>{gig.title}</Link> : "Opportunity no longer available"}</h2>
            {gig && <p>{gig.city}, {gig.state} · {gig.kind === "hiring" ? `₹${new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0)}` : "Collaboration"}</p>}
            <p className="application-message">“{application.message}”</p>
            <div className="application-card-bottom"><span>Applied {new Date(application.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>{application.status === "pending" && <form action={withdrawApplication}><input type="hidden" name="applicationId" value={application.id} /><button className="text-button" type="submit">Withdraw application</button></form>}</div>
          </article>;
        })}</div> : <div className="empty-state"><strong>No applications yet.</strong><p>When you find the right project, apply and track its progress here.</p><Link href="/opportunities">Explore opportunities ↗</Link></div>}
      </section>
    </main>
  );
}
