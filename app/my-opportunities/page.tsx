import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function MyOpportunitiesPage() {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Your posted gigs</h1><p>Connect Supabase to view your opportunities and applicants.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: gigs } = await supabase.from("gigs").select("id,title,kind,status,city,state,deadline_at,created_at").eq("poster_id", user.id).order("created_at", { ascending: false });
  const gigIds = (gigs ?? []).map((gig) => gig.id);
  const { data: applications } = gigIds.length ? await supabase.from("applications").select("gig_id,status").in("gig_id", gigIds) : { data: [] };
  const pendingCounts = new Map<string, number>();
  const acceptedCounts = new Map<string, number>();
  for (const application of applications ?? []) {
    if (application.status === "pending") pendingCounts.set(application.gig_id, (pendingCounts.get(application.gig_id) ?? 0) + 1);
    if (application.status === "accepted") acceptedCounts.set(application.gig_id, (acceptedCounts.get(application.gig_id) ?? 0) + 1);
  }

  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover">Discover people</Link><Link href="/applications">Applications</Link><Link href="/proposals">Proposals</Link><Link href="/projects">Projects</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header><section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">YOUR PROJECTS</span><h1>Posted by you.</h1><p>Manage each gig and its applicants.</p></div><Link className="create-gig" href="/opportunities/new">Post an opportunity <span>+</span></Link></div>{gigs?.length ? <div className="application-list">{gigs.map((gig) => <article className="application-card" key={gig.id}><div className="gig-card-top"><span className="gig-type">{gig.kind}</span><span className={`status-pill ${gig.status === "open" ? "status-pending" : "status-gig_closed"}`}>{gig.status}</span></div><h2><Link href={`/my-opportunities/${gig.id}`}>{gig.title}</Link></h2><p>{gig.city}, {gig.state}</p><div className="application-card-bottom"><span>{pendingCounts.get(gig.id) ?? 0} pending · {acceptedCounts.get(gig.id) ?? 0} accepted</span><Link className="small-link" href={`/my-opportunities/${gig.id}`}>Review applicants →</Link></div></article>)}</div> : <div className="empty-state"><strong>You haven’t posted a gig yet.</strong><p>Describe the project and the kind of musician you need.</p><Link href="/opportunities/new">Post an opportunity ↗</Link></div>}</section></main>;
}
