import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { decideApplication } from "../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };

export default async function ManageOpportunityPage({ params, searchParams }: Props) {
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Applicants</h1><p>Connect Supabase to manage applicants.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: gig } = await supabase.from("gigs").select("id,title,kind,status,deadline_at").eq("id", id).eq("poster_id", user.id).maybeSingle();
  if (!gig) notFound();
  const { data: applications } = await supabase.from("applications").select("id,applicant_id,message,status,created_at").eq("gig_id", gig.id).order("created_at", { ascending: true });
  const applicantIds = [...new Set((applications ?? []).map((application) => application.applicant_id))];
  const { data: profiles } = applicantIds.length ? await supabase.from("profiles").select("id,username,display_name,main_specialty,city,state").in("id", applicantIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/my-opportunities">← My posted gigs</Link><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header><section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">APPLICANT REVIEW</span><h1>{gig.title}</h1><p>{gig.status === "open" ? "Accept or decline each applicant for this role." : "This opportunity is closed."}</p></div><Link className="create-gig" href={`/opportunities/${gig.id}`}>View gig <span>↗</span></Link></div>{message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}{applications?.length ? <div className="application-list">{applications.map((application) => { const profile = profileMap.get(application.applicant_id); return <article className="application-card" key={application.id}><div className="gig-card-top"><span className="gig-type">Applied {new Date(application.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span><span className={`status-pill status-${application.status}`}>{application.status.replaceAll("_", " ")}</span></div><h2>{profile?.display_name ?? "Music community member"}</h2><p>{profile ? `${profile.main_specialty} · ${profile.city}, ${profile.state}` : "Profile is unavailable"}</p><p className="application-message">“{application.message}”</p>{application.status === "pending" && gig.status === "open" && <div className="decision-actions"><form action={decideApplication}><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="decision" value="accepted" /><button className="button button-primary" type="submit">Accept</button></form><form action={decideApplication}><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="gigId" value={gig.id} /><input type="hidden" name="decision" value="not_selected" /><button className="button button-secondary" type="submit">Not selected</button></form></div>}</article>; })}</div> : <div className="empty-state"><strong>No applicants yet.</strong><p>Applicants will appear here when musicians apply.</p></div>}</section></main>;
}
