import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { closeGig, decideApplication, extendGigDeadline } from "../../actions";

export const instant = false;
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };
const dateLabel = (value: string, options: Intl.DateTimeFormatOptions) => new Date(value).toLocaleString("en-IN", { ...options, timeZone: "Asia/Kolkata" });
const dateInput = (value: string, days = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(new Date(value).getTime() + days * 86400000));

export default async function ManageOpportunityPage({ params, searchParams }: Props) {
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/">♫ Muxics</Link><section className="simple-auth-card"><h1>Applicants</h1><p>Connect Supabase to manage applicants.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: gig } = await supabase.from("gigs").select("id,title,description,expectations,required_specialty,estimated_duration,kind,payment_amount_inr,city,state,country,remote_allowed,deadline_at,status").eq("id", id).eq("poster_id", user.id).maybeSingle();
  if (!gig) notFound();
  const { data: applications } = await supabase.from("applications").select("id,applicant_id,message,status,created_at").eq("gig_id", gig.id).order("created_at");
  const applicantIds = [...new Set((applications ?? []).map((application) => application.applicant_id))];
  const [profilesResult, demosResult] = applicantIds.length ? await Promise.all([
    supabase.from("profiles").select("id,username,display_name,main_specialty,city,state,avatar_path,avatar_doodle").in("id", applicantIds),
    supabase.from("demos").select("id,user_id,object_path,duration_seconds,position").in("user_id", applicantIds).order("position"),
  ]) : [{ data: [] }, { data: [] }];
  const profileMap = new Map(await Promise.all((profilesResult.data ?? []).map(async (p) => {
    const { data } = p.avatar_path ? await supabase.storage.from("avatars").createSignedUrl(p.avatar_path, 600) : { data: null };
    return [p.id, { ...p, avatarUrl: data?.signedUrl ?? null }] as const;
  })));
  const demoMap = new Map<string, Array<{ id: string; position: number; duration: number; url: string | null }>>();
  await Promise.all((demosResult.data ?? []).map(async (demo) => {
    const { data } = await supabase.storage.from("demos").createSignedUrl(demo.object_path, 600);
    const demos = demoMap.get(demo.user_id) ?? [];
    demos.push({ id: demo.id, position: demo.position, duration: Number(demo.duration_seconds), url: data?.signedUrl ?? null });
    demoMap.set(demo.user_id, demos);
  }));
  const accepted = (applications ?? []).filter((a) => a.status === "accepted").length;
  const pending = (applications ?? []).filter((a) => a.status === "pending").length;
  const open = gig.status === "open" && new Date(gig.deadline_at).getTime() > Date.now();
  const deadlineMin = dateInput(gig.deadline_at);
  const deadlineDate = dateInput(gig.deadline_at, 1);
  return <main className="opportunities-shell applicant-review-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Explore</Link><Link href="/opportunities" aria-current="page">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <section className="applicant-review-wrap">
      <div className="applicant-review-breadcrumb"><Link href="/my-opportunities">My opportunities</Link><span>›</span><Link href={"/opportunities/" + gig.id}>{gig.id.slice(0, 8).toUpperCase()}</Link><span>›</span><strong>Applicant review</strong></div>
      {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
      <section className="review-gig-summary">
        <div className="review-statusbar"><span className={open ? "review-open" : "review-closed"}><i />{open ? "Open for applications" : "Closed for applications"}</span><span>Opportunity · {gig.id.slice(0, 8).toUpperCase()}</span><div className="review-management-actions">
          {open && accepted === 0 && <details className="review-extend-details"><summary>Extend deadline</summary><form action={extendGigDeadline}><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="returnTo" value={"/my-opportunities/" + gig.id} /><label>New date<input type="date" name="deadlineDate" min={deadlineMin} defaultValue={deadlineDate} required /></label><label>Time (IST)<input type="time" name="deadlineTime" defaultValue="23:59" required /></label><button type="submit">Save extension</button></form></details>}
          {open && <form action={closeGig}><input type="hidden" name="gigId" value={gig.id} /><button className="review-close-button" type="submit">Close opportunity</button></form>}
        </div></div>
        <div className="review-gig-main"><div><div className="review-tags"><span>{gig.kind === "hiring" ? "Hiring" : "Collaboration"}</span><span>{gig.required_specialty}</span></div><h1>{gig.title}</h1></div>{gig.kind === "hiring" && <aside className="review-budget"><span>Fixed compensation</span><strong>₹{new Intl.NumberFormat("en-IN").format(gig.payment_amount_inr ?? 0)} <small>INR total</small></strong><p>Arranged directly between poster and contributor.</p></aside>}</div>
        <div className="review-facts"><div><span>Required specialty</span><strong>{gig.required_specialty}</strong></div><div><span>Application deadline</span><strong>{dateLabel(gig.deadline_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST</strong></div><div><span>Project estimate</span><strong>{gig.estimated_duration}</strong></div><div><span>Engagement</span><strong>{gig.kind === "hiring" ? "Hiring" : "Collaboration"} · Multiple contributors</strong></div></div>
        {accepted > 0 && <p className="review-lock-note"><span>ⓘ</span><span><strong>Opportunity terms are locked.</strong> Accepted contributors agreed to the posted terms, so they can no longer be edited.</span></p>}
        {open && <p className="review-helper-note">You can accept any number of applicants for this specialty. Each accepted person gets access to the shared project space.</p>}
      </section>
      <div className="review-list-heading"><div><h2>Applicants</h2><p>Listen to profile demos and review each introduction.</p></div><span>{applications?.length ?? 0} total · {pending} awaiting review · {accepted} accepted</span></div>
      {applications?.length ? <div className="review-applicant-list">{applications.map((application) => {
        const profile = profileMap.get(application.applicant_id);
        const demos = demoMap.get(application.applicant_id) ?? [];
        return <article className={"review-applicant-card " + (application.status === "accepted" ? "is-accepted" : "")} key={application.id}>
          <div className="review-applicant-content"><div className="review-applicant-identity"><div className={"review-avatar profile-doodle " + (profile?.avatar_doodle ?? "note-1")}>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : "♫"}</div><div><h3>{profile?.display_name ?? "Music community member"} {profile?.username && <span>@{profile.username}</span>}</h3><p>{profile ? profile.main_specialty + " · " + profile.city + ", " + profile.state : "Profile is unavailable"}<span> · Applied {dateLabel(application.created_at, { day: "numeric", month: "short", year: "numeric" })}</span></p></div></div>
            <blockquote><span>Introduction / pitch</span>{application.message}</blockquote>
            {demos.length ? <div className="review-demo-list"><span className="review-demo-heading">Profile demos</span>{demos.map((demo) => <div className="review-demo" key={demo.id}><span>♫ <strong>Demo {demo.position}</strong><small>{Math.floor(demo.duration / 60)}:{String(Math.floor(demo.duration % 60)).padStart(2, "0")}</small></span>{demo.url ? <audio controls preload="none" src={demo.url}>Your browser does not support audio playback.</audio> : <span className="review-demo-unavailable">Demo temporarily unavailable</span>}</div>)}</div> : <p className="review-no-demo">No profile demo available.</p>}
          </div>
          <aside className="review-applicant-actions"><span className={"review-applicant-status status-" + application.status}>{application.status.replaceAll("_", " ")}</span>{profile?.username && <Link href={"/profiles/" + profile.username}>View full profile ↗</Link>}{application.status === "pending" && open && <><form action={decideApplication}><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="decision" value="accepted" /><button className="review-accept-button" type="submit">✓ Accept contributor</button></form><form action={decideApplication}><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="decision" value="not_selected" /><button className="review-decline-button" type="submit">Decline applicant</button></form></>}</aside>
        </article>;
      })}</div> : <div className="empty-state"><strong>No applicants yet.</strong><p>Musicians who apply will appear here for review.</p></div>}
    </section>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities" aria-current="page"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
