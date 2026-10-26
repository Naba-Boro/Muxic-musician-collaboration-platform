import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { redirect } from "next/navigation";
import { closeGig, extendGigDeadline } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
type Props = { searchParams: Promise<{ status?: string; message?: string; error?: string }> };
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateInput = (value: string, days = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(new Date(value).getTime() + days * 86400000));

export default async function MyOpportunitiesPage({ searchParams }: Props) {
  const { status: selectedStatus = "all", message, error } = await searchParams;
  const statusFilter = ["all", "open", "closed"].includes(selectedStatus) ? selectedStatus : "all";
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Your posted opportunities</h1><p>Connect Supabase to view your opportunities and applicants.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: gigs } = await supabase.from("gigs").select("id,title,kind,status,required_specialty,payment_amount_inr,city,state,deadline_at,closed_at,created_at").eq("poster_id", user.id).order("created_at", { ascending: false });
  const gigIds = (gigs ?? []).map((gig) => gig.id);
  const [applicationsResult, projectsResult] = gigIds.length ? await Promise.all([
    supabase.from("applications").select("id,gig_id,status").in("gig_id", gigIds),
    supabase.from("projects").select("id,title,source_gig_id,status").eq("owner_id", user.id).in("source_gig_id", gigIds),
  ]) : [{ data: [] }, { data: [] }];
  const applicantCounts = new Map<string, number>();
  const pendingCounts = new Map<string, number>();
  const acceptedCounts = new Map<string, number>();
  for (const application of applicationsResult.data ?? []) {
    applicantCounts.set(application.gig_id, (applicantCounts.get(application.gig_id) ?? 0) + 1);
    if (application.status === "pending") pendingCounts.set(application.gig_id, (pendingCounts.get(application.gig_id) ?? 0) + 1);
    if (application.status === "accepted") acceptedCounts.set(application.gig_id, (acceptedCounts.get(application.gig_id) ?? 0) + 1);
  }
  const projectsByGig = new Map((projectsResult.data ?? []).map((project) => [project.source_gig_id, project]));
  const isOpen = (gig: NonNullable<typeof gigs>[number]) => gig.status === "open" && new Date(gig.deadline_at).getTime() > Date.now();
  const openCount = (gigs ?? []).filter(isOpen).length;
  const closedCount = (gigs ?? []).length - openCount;
  const activeProjectCount = (projectsResult.data ?? []).filter((project) => project.status === "active").length;
  const acceptedTotal = (applicationsResult.data ?? []).filter((application) => application.status === "accepted").length;
  const visibleGigs = (gigs ?? []).filter((gig) => statusFilter === "all" || (statusFilter === "open" ? isOpen(gig) : !isOpen(gig))).sort((a, b) => {
    if (isOpen(a) && isOpen(b)) return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
    if (isOpen(a)) return -1;
    if (isOpen(b)) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return <main className="opportunities-shell my-opportunities-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities" aria-current="page">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <section className="my-opportunities-wrap">
      <div className="my-opportunities-heading"><div><span className="eyebrow">STUDIO CONSOLE · IST +05:30</span><h1>My posted opportunities</h1><p>Manage your opportunities, deadlines, and incoming applicants.</p></div><Link className="my-post-button" href="/opportunities/new"><span aria-hidden="true">＋</span> Post new opportunity</Link></div>
      {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className="my-opportunities-stats" aria-label="Opportunity summary">
        <article><span>Open opportunities</span><strong>{String(openCount).padStart(2, "0")}</strong><small>Accepting applications</small><i aria-hidden="true">▣</i></article>
        <article><span>Total applicants</span><strong>{applicationsResult.data?.length ?? 0}</strong><small>Across {gigs?.length ?? 0} opportunities</small><i aria-hidden="true">♙</i></article>
        <article><span>Accepted contributors</span><strong>{acceptedTotal}</strong><small>Agreed to join projects</small><i aria-hidden="true">✓</i></article>
        <article><span>Active project spaces</span><strong>{String(activeProjectCount).padStart(2, "0")}</strong><small>Shared workspaces</small><i aria-hidden="true">▧</i></article>
      </div>
      <div className="my-opportunities-filterbar"><nav aria-label="Filter opportunities">{(["all", "open", "closed"] as const).map((filter) => <Link key={filter} href={filter === "all" ? "/my-opportunities" : "/my-opportunities?status=" + filter} aria-current={statusFilter === filter ? "page" : undefined}>{filter === "all" ? "All" : filter === "open" ? "Open" : "Closed"}<b>{filter === "all" ? gigs?.length ?? 0 : filter === "open" ? openCount : closedCount}</b></Link>)}</nav><span>Sorted by closing soon</span></div>
      {visibleGigs.length ? <div className="my-opportunity-list">{visibleGigs.map((gig) => {
        const open = isOpen(gig);
        const pending = pendingCounts.get(gig.id) ?? 0;
        const accepted = acceptedCounts.get(gig.id) ?? 0;
        const applicants = applicantCounts.get(gig.id) ?? 0;
        const project = projectsByGig.get(gig.id);
        const nearDeadline = open && new Date(gig.deadline_at).getTime() - Date.now() <= 3 * 86400000;
        return <article className={"my-opportunity-card " + (open ? "is-open" : "is-closed")} key={gig.id}>
          <div className="my-opportunity-card-bar"><span className={open ? (nearDeadline ? "my-opportunity-state is-urgent" : "my-opportunity-state") : "my-opportunity-state is-closed"}><i />{open ? nearDeadline ? "Open · Deadline soon" : "Open" : "Closed"}</span><span>REF-{gig.id.slice(0, 8).toUpperCase()}</span><span>Specialty: {gig.required_specialty}</span><strong>{gig.kind === "hiring" ? "₹" + new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0) + " INR fixed" : "Collaboration"}</strong></div>
          <div className="my-opportunity-card-body">
            <span className={gig.kind === "hiring" ? "my-opportunity-kind is-hiring" : "my-opportunity-kind"}>{gig.kind === "hiring" ? "Hiring" : "Collaboration"}{gig.kind === "hiring" && <> · ₹{new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0)} INR fixed</>}</span>
            <h2>{gig.title}</h2>
            <p className="my-opportunity-meta">◷ {open ? "Deadline: " + dateLabel(gig.deadline_at) + " IST" : "Closed: " + dateLabel(gig.closed_at ?? gig.deadline_at)} <span>·</span> ♙ {applicants} applicant{applicants === 1 ? "" : "s"} ({accepted} accepted{pending ? ", " + pending + " pending" : ""})</p>
            {accepted > 0 ? <p className="my-opportunity-locked"><span>▣</span><span><strong>Terms locked</strong> after the first contributor was accepted. Accepted collaborators continue together in the shared project space.</span></p> : nearDeadline ? <p className="my-opportunity-reminder"><span>◷</span><span>Deadline approaching. Extend before it closes if you still need applications.</span></p> : null}
            <div className="my-opportunity-actions">
              <Link className="my-review-link" href={"/my-opportunities/" + gig.id}>{open ? "Review applicants (" + applicants + ")" : "View applicant history"} <span aria-hidden="true">→</span></Link>
              {open && accepted === 0 && <details className="my-extend-details"><summary>Extend deadline</summary><form action={extendGigDeadline}><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="returnTo" value="/my-opportunities" /><label>New date<input type="date" name="deadlineDate" min={dateInput(gig.deadline_at)} defaultValue={dateInput(gig.deadline_at, 1)} required /></label><label>Time (IST)<input type="time" name="deadlineTime" defaultValue="23:59" required /></label><button type="submit">Save extension</button></form></details>}
              {open && <form action={closeGig}><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="returnTo" value="/my-opportunities" /><button className="my-close-link" type="submit">Close opportunity</button></form>}
              {project && <Link className="my-project-link" href={"/projects/" + project.id}>{project.status === "active" ? "Open project space →" : "View project history →"}</Link>}
              {!open && !project && <Link className="my-archive-link" href={"/opportunities/" + gig.id}>View opportunity ↗</Link>}
            </div>
          </div>
        </article>;
      })}</div> : gigs?.length ? <div className="my-opportunities-empty-filter"><strong>No {statusFilter} opportunities.</strong><p>Choose another status filter to see your posted opportunities.</p></div> : <div className="my-opportunities-empty"><span aria-hidden="true">♫</span><small>First-time poster guide</small><h2>No opportunities posted yet?</h2><p>Create your first collaboration or hiring opportunity to find musicians for your project.</p><Link href="/opportunities/new">＋ Create opportunity</Link></div>}
    </section>
    <footer className="my-opportunities-footer"><span>Muxics · Musician collaboration across India</span><span>Hiring payments are arranged directly between participants</span></footer>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities" aria-current="page"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
