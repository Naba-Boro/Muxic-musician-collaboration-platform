import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { completeProject, deleteProjectHistoryCopy, recordProjectExit, respondToProjectExit } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { ProjectChat, type ProjectMessage } from "../project-chat";
import { PrintHistoryButton } from "../print-history-button";

type ExitRecord = {
  id: string; project_id: string; poster_id: string; collaborator_id: string;
  actor_id: string; category: string; reason: string; other_party_response: string | null; created_at: string;
};

export default async function ProjectDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/">♫ Muxics.</Link><section className="simple-auth-card"><h1>Project</h1><p>Connect Supabase to open your shared projects.</p></section></main>;
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: project } = await supabase.from("projects").select("id,title,status,created_at,completed_at,owner_id,source_gig_id,source_proposal_id").eq("id", id).maybeSingle();
  if (!project) notFound();
  const [{ data: members }, { data: rawMessages }, { data: rawRecords }, { data: hidden }] = await Promise.all([
    supabase.from("project_members").select("user_id,role,status,joined_at,ended_at").eq("project_id", id).order("joined_at"),
    supabase.from("project_messages").select("id,sender_id,body,created_at").eq("project_id", id).order("created_at").limit(500),
    supabase.from("project_exit_records").select("id,project_id,poster_id,collaborator_id,actor_id,category,reason,other_party_response,created_at").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_exit_record_hidden").select("record_id").eq("user_id", user.id),
  ]);
  if (!members?.some((member) => member.user_id === user.id)) notFound();
  const { data: cards } = await supabase.rpc("project_participant_cards", { target_project: id });
  const memberNames = Object.fromEntries((cards ?? []).map((card: { user_id: string; display_name: string }) => [card.user_id, card.display_name]));
  const avatarDoodles = Object.fromEntries((cards ?? []).map((card: { user_id: string; avatar_doodle: string }) => [card.user_id, card.avatar_doodle]));
  const visibleRecords = ((rawRecords ?? []) as ExitRecord[]).filter((record) => !(hidden ?? []).some((item) => item.record_id === record.id));
  const isPoster = project.owner_id === user.id;
  const canSend = project.status === "active" && (members ?? []).some((member) => member.user_id === user.id && member.status === "active");
  const activeCollaborators = (members ?? []).filter((member) => member.role === "collaborator" && member.status === "active");

  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover">Discover people</Link><Link href="/applications">Applications</Link><Link href="/proposals">Proposals</Link><Link href="/projects" aria-current="page">Projects</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header>
    <section className="feed-wrap project-page"><Link className="back-link" href="/projects">← All projects</Link>
      {query.error && <p className="notice notice-error" role="alert">{query.error}</p>}{query.message && <p className="notice notice-success" role="status">{query.message}</p>}
      <div className="project-title-row"><div><span className="eyebrow">SHARED PROJECT</span><h1>{project.title}</h1><p>Created {new Date(project.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })} · Led by {memberNames[project.owner_id] ?? "Account unavailable"}</p></div><span className={`status-pill ${project.status === "active" ? "status-accepted" : "status-gig_closed"}`}>{project.status}</span></div>
      <section className="project-members"><div className="project-section-heading"><div><h2>Project members</h2><p>Only people in this project can see this space.</p></div>{isPoster && project.status === "active" && <form action={completeProject}><input type="hidden" name="projectId" value={id}/><button className="button button-secondary" type="submit">Mark project complete <span>✓</span></button></form>}</div>
        <div className="project-member-list">{(members ?? []).map((member) => <article className="project-member-card" key={member.user_id}><span className={`profile-doodle ${avatarDoodles[member.user_id] ?? "note-1"}`} aria-hidden="true">♫</span><div><strong>{memberNames[member.user_id] ?? "Account unavailable"}</strong><p>{member.role === "poster" ? "Project poster" : "Contributor"} · {member.status}</p></div></article>)}</div>
      </section>
      {isPoster && activeCollaborators.length > 0 && project.status === "active" && <section className="project-section exit-form-section"><h2>End a contributor’s participation</h2><p>If a collaborator leaves or you remove them, give a factual explanation of at least 100 characters. It becomes private project history for you and that collaborator.</p>{activeCollaborators.map((collaborator) => <form action={recordProjectExit} className="project-exit-form project-exit-form-card" key={collaborator.user_id}><input type="hidden" name="projectId" value={id}/><input type="hidden" name="targetUser" value={collaborator.user_id}/><strong>Remove {memberNames[collaborator.user_id] ?? "Account unavailable"}</strong><label className="field"><span>Reason category</span><select name="category" required><option value="scope_change">Project scope changed</option><option value="availability">Availability or schedule</option><option value="work_quality">Work or expectations</option><option value="communication">Communication</option><option value="other">Other</option></select></label><label className="field"><span>Facts and details</span><textarea name="reason" minLength={100} maxLength={10000} required placeholder="Describe what happened and relevant dates or agreed expectations." /></label><button className="button button-secondary" type="submit">Remove collaborator and record history <span>→</span></button></form>)}</section>}
      {!isPoster && canSend && project.status === "active" && <section className="project-section exit-form-section"><h2>Leave this project</h2><p>Leaving ends your participation and records the reason for the poster and you.</p><form action={recordProjectExit} className="project-exit-form"><input type="hidden" name="projectId" value={id}/><input type="hidden" name="targetUser" value={user.id}/><label className="field"><span>Reason category</span><select name="category" required><option value="scope_change">Project scope changed</option><option value="availability">Availability or schedule</option><option value="work_quality">Work or expectations</option><option value="communication">Communication</option><option value="other">Other</option></select></label><label className="field"><span>Facts and details</span><textarea name="reason" minLength={100} maxLength={10000} required placeholder="Describe what happened and relevant dates or agreed expectations." /></label><button className="button button-secondary" type="submit">Leave project <span>→</span></button></form></section>}
      <ProjectChat projectId={id} currentUserId={user.id} initialMessages={(rawMessages ?? []) as ProjectMessage[]} senderNames={memberNames} canSend={canSend}/>
      <section className="project-history"><div className="project-section-heading"><div><h2>Private project history</h2><p>Exit records are visible only to the poster and the named collaborator.</p></div><PrintHistoryButton/></div>
        {visibleRecords.length ? <div className="project-history-list">{visibleRecords.map((record) => { const isParty = user.id === record.poster_id || user.id === record.collaborator_id; const canRespond = isParty && user.id !== record.actor_id && !record.other_party_response; return <article className="history-card" key={record.id}><div className="gig-card-top"><span className="gig-type">{record.category.replaceAll("_", " ")}</span><time>{new Date(record.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</time></div><p><strong>{memberNames[record.actor_id] ?? "Account unavailable"}</strong> {record.actor_id === record.collaborator_id ? "left the project" : "removed the collaborator"}.</p><blockquote>{record.reason}</blockquote>{record.other_party_response && <div className="history-response"><strong>Other party’s response</strong><p>{record.other_party_response}</p></div>}{canRespond && <form action={respondToProjectExit} className="project-exit-form"><input type="hidden" name="projectId" value={id}/><input type="hidden" name="recordId" value={record.id}/><label className="field"><span>Add your response</span><textarea name="response" maxLength={10000} required placeholder="Your response will be visible to the other party." /></label><button className="button button-secondary" type="submit">Save response <span>→</span></button></form>}{isParty && <form action={deleteProjectHistoryCopy} className="history-delete-form"><input type="hidden" name="projectId" value={id}/><input type="hidden" name="recordId" value={record.id}/><button className="text-button" type="submit">Delete my copy</button></form>}</article>; })}</div> : <div className="empty-state"><strong>No private history records.</strong><p>If the poster removes a collaborator or a collaborator leaves, the reason and response will appear here.</p></div>}
      </section>
    </section>
  </main>;
}
