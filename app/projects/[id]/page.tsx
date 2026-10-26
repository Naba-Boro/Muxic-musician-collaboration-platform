import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { notFound, redirect } from "next/navigation";
import { completeProject, deleteProjectHistoryCopy, recordProjectExit, respondToProjectExit } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ProjectChat, type ProjectMessage } from "../project-chat";
import { PrintHistoryButton } from "../print-history-button";

export const instant = false;

type ExitRecord = { id: string; project_id: string; poster_id: string; collaborator_id: string; actor_id: string; category: string; reason: string; other_party_response: string | null; created_at: string };
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

export default async function ProjectDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/">♫ Muxics.</Link><section className="simple-auth-card"><h1>Project</h1><p>Connect Supabase to open your shared projects.</p></section></main>;
  const [{ id }, query] = await Promise.all([params, searchParams]);
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
  const projectMembers = members ?? [];
  const { data: cards } = await supabase.rpc("project_participant_cards", { target_project: id });
  const memberNames = Object.fromEntries((cards ?? []).map((card: { user_id: string; display_name: string }) => [card.user_id, card.display_name]));
  const avatarDoodles = Object.fromEntries((cards ?? []).map((card: { user_id: string; avatar_doodle: string }) => [card.user_id, card.avatar_doodle]));
  const memberStatuses = Object.fromEntries((cards ?? []).map((card: { user_id: string; member_status: string }) => [card.user_id, card.member_status]));
  const visibleRecords = ((rawRecords ?? []) as ExitRecord[]).filter((record) => !(hidden ?? []).some((item) => item.record_id === record.id));
  const isPoster = project.owner_id === user.id;
  const canSend = project.status === "active" && projectMembers.some((member) => member.user_id === user.id && member.status === "active");
  const activeCollaborators = projectMembers.filter((member) => member.role === "collaborator" && member.status === "active");
  let sourceGig: { kind: string; required_specialty: string; payment_amount_inr: number | null; estimated_duration: string; deadline_at: string; city: string; state: string } | null = null;
  let sourceProposal: { kind: string; topic: string } | null = null;
  if (project.source_gig_id) {
    const { data } = await supabase.from("gigs").select("kind,required_specialty,payment_amount_inr,estimated_duration,deadline_at,city,state").eq("id", project.source_gig_id).maybeSingle();
    sourceGig = data;
  }
  if (project.source_proposal_id) {
    const { data } = await supabase.from("proposals").select("kind,topic").eq("id", project.source_proposal_id).maybeSingle();
    sourceProposal = data;
  }
  const sourceKind = sourceGig?.kind ?? sourceProposal?.kind ?? "project";
  const activeMembers = projectMembers.filter((member) => member.status === "active");

  return <main className="opportunities-shell shared-project-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects" aria-current="page">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <section className="shared-project-wrap">
      <div className="shared-project-breadcrumb"><Link href="/projects">← Projects</Link><span>/</span><span>{project.title}</span><code>ID: PRJ-{id.slice(0, 6).toUpperCase()}</code></div>
      {query.error && <p className="notice notice-error" role="alert">{query.error}</p>}{query.message && <p className="notice notice-success" role="status">{query.message}</p>}
      <section className="shared-project-overview">
        <div className="shared-project-labels"><span className={project.status === "active" ? "shared-active-label" : "shared-complete-label"}><i />{project.status === "active" ? "Active workspace" : "Project complete"}</span><span>{sourceGig ? "Origin: Opportunity" : "Origin: Proposal"} · {sourceKind === "hiring" ? "Hiring" : sourceKind === "collaboration" ? "Collaboration" : "Project"}</span><span>Poster · {memberNames[project.owner_id] ?? "Account unavailable"}</span></div>
        <div className="shared-project-title-row"><div><h1>{project.title}</h1><p>{sourceGig ? sourceGig.required_specialty + " · " + sourceGig.estimated_duration + " · " + sourceGig.city + ", " + sourceGig.state : sourceProposal?.topic ?? "A shared Muxics project"}</p></div>{isPoster && project.status === "active" && <form action={completeProject}><input type="hidden" name="projectId" value={id} /><button className="shared-complete-button" type="submit">✓ Mark project complete</button></form>}</div>
        {isPoster && project.status === "active" && <p className="shared-complete-hint">Only the project poster can confirm completion.</p>}
        {project.status === "complete" && <p className="shared-complete-hint">Completed {project.completed_at ? dateLabel(project.completed_at) : ""}. Conversation is available as read-only history.</p>}
      </section>

      <div className="shared-project-grid">
        <aside className="shared-project-sidebar">
          <section className="shared-project-panel">
            <header className="shared-panel-heading"><h2>Origin and deal scope</h2><span>{sourceKind === "hiring" ? "Hiring" : "Collaboration"}</span></header>
            {sourceGig ? <div className="shared-scope-grid"><div><span>Required specialty</span><strong>{sourceGig.required_specialty}</strong></div>{sourceGig.kind === "hiring" && <div><span>Fixed compensation</span><strong>₹{new Intl.NumberFormat("en-IN").format(sourceGig.payment_amount_inr ?? 0)} INR</strong></div>}<div><span>Estimated duration</span><strong>{sourceGig.estimated_duration}</strong></div><div><span>Application deadline</span><strong>{dateLabel(sourceGig.deadline_at)}</strong></div><div className="shared-scope-wide"><span>Location</span><strong>{sourceGig.city}, {sourceGig.state} · India</strong></div>{sourceGig.kind === "hiring" && <div className="shared-scope-wide"><span>Payment arrangement</span><strong>Directly between participants, outside Muxics</strong></div>}</div> : <div className="shared-scope-grid"><div><span>Proposal type</span><strong>{sourceKind === "hiring" ? "Hiring" : "Collaboration"}</strong></div><div className="shared-scope-wide"><span>Proposal topic</span><strong>{sourceProposal?.topic ?? project.title}</strong></div></div>}
          </section>

          <section className="shared-project-panel">
            <header className="shared-panel-heading"><h2>Participants</h2><span>{activeMembers.length} active</span></header>
            <div className="shared-participant-list">{projectMembers.map((member) => <article className={"shared-participant " + (member.status !== "active" ? "is-ended" : "")} key={member.user_id}><span className={"shared-participant-avatar profile-doodle " + (avatarDoodles[member.user_id] ?? "note-1")}>♫</span><div><strong>{memberNames[member.user_id] ?? "Account unavailable"}</strong><p>{member.role === "poster" ? "Poster" : "Contributor"} · {memberStatuses[member.user_id] ?? member.status}</p></div>{member.role === "poster" && <small>Poster</small>}</article>)}</div>
          </section>

          <section className="shared-project-panel shared-contributor-management">
            <details><summary><span>Contributor management</span><small>Role actions &amp; fair exit protocol</small></summary>
              <p>A contributor may leave, or the poster may remove a contributor.</p>
              {isPoster && activeCollaborators.length > 0 && activeCollaborators.map((collaborator) => <details className="shared-exit-details" key={collaborator.user_id}><summary>Remove {memberNames[collaborator.user_id] ?? "contributor"}</summary><form action={recordProjectExit} className="project-exit-form project-exit-form-card"><input type="hidden" name="projectId" value={id} /><input type="hidden" name="targetUser" value={collaborator.user_id} /><label className="field"><span>Reason category</span><select name="category" required><option value="scope_change">Project scope changed</option><option value="availability">Availability or schedule</option><option value="work_quality">Work or expectations</option><option value="communication">Communication</option><option value="other">Other</option></select></label><label className="field"><span>Facts and details (at least 100 characters)</span><textarea name="reason" minLength={100} maxLength={10000} required placeholder="Describe what happened and relevant dates or agreed expectations." /></label><button className="button button-secondary" type="submit">Remove contributor and record history</button></form></details>)}
              {!isPoster && canSend && <details className="shared-exit-details"><summary>Leave this project</summary><form action={recordProjectExit} className="project-exit-form"><input type="hidden" name="projectId" value={id} /><input type="hidden" name="targetUser" value={user.id} /><label className="field"><span>Reason category</span><select name="category" required><option value="scope_change">Project scope changed</option><option value="availability">Availability or schedule</option><option value="work_quality">Work or expectations</option><option value="communication">Communication</option><option value="other">Other</option></select></label><label className="field"><span>Facts and details (at least 100 characters)</span><textarea name="reason" minLength={100} maxLength={10000} required placeholder="Describe what happened and relevant dates or agreed expectations." /></label><button className="button button-secondary" type="submit">Leave project and record history</button></form></details>}
              <p className="shared-exit-privacy">A detailed, factual reason is recorded as private history for the poster and the specific contributor. It does not appear on public profiles.</p>
            </details>
          </section>

          <section className="shared-project-panel shared-private-history">
            <details><summary><span>Private project history</span><small>{visibleRecords.length} record{visibleRecords.length === 1 ? "" : "s"}</small></summary>
              <div className="shared-history-tools"><p>Visible only to the poster and the named contributor.</p><PrintHistoryButton /></div>
              {visibleRecords.length ? <div className="project-history-list">{visibleRecords.map((record) => { const isParty = user.id === record.poster_id || user.id === record.collaborator_id; const canRespond = isParty && user.id !== record.actor_id && !record.other_party_response; return <article className="history-card" key={record.id}><div className="gig-card-top"><span className="gig-type">{record.category.replaceAll("_", " ")}</span><time>{dateLabel(record.created_at)}</time></div><p><strong>{memberNames[record.actor_id] ?? "Account unavailable"}</strong> {record.actor_id === record.collaborator_id ? "left the project" : "removed the contributor"}.</p><blockquote>{record.reason}</blockquote>{record.other_party_response && <div className="history-response"><strong>Other party’s response</strong><p>{record.other_party_response}</p></div>}{canRespond && <form action={respondToProjectExit} className="project-exit-form"><input type="hidden" name="projectId" value={id} /><input type="hidden" name="recordId" value={record.id} /><label className="field"><span>Add your response</span><textarea name="response" maxLength={10000} required placeholder="Your response will be visible to the other party." /></label><button className="button button-secondary" type="submit">Save response</button></form>}{isParty && <form action={deleteProjectHistoryCopy} className="history-delete-form"><input type="hidden" name="projectId" value={id} /><input type="hidden" name="recordId" value={record.id} /><button className="text-button" type="submit">Delete my copy</button></form>}</article>; })}</div> : <p className="shared-no-history">No private project history yet.</p>}
            </details>
          </section>
          <p className="shared-audio-note">Shared project messages are visible to project participants. No private one-to-one DMs.</p>
        </aside>

        <div className="shared-project-main"><ProjectChat projectId={id} currentUserId={user.id} initialMessages={(rawMessages ?? []) as ProjectMessage[]} senderNames={memberNames} canSend={canSend} /></div>
      </div>
    </section>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects" aria-current="page"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
