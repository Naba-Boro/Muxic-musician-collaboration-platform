"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ProjectPerson = { id: string; name: string; status: string };
type ProjectActivity = { body: string; createdAt: string; senderName: string } | null;
export type ProjectListItem = {
  id: string;
  title: string;
  status: "active" | "complete";
  createdAt: string;
  completedAt: string | null;
  ownerId: string;
  currentRole: string;
  origin: string;
  latestActivity: ProjectActivity;
  participants: ProjectPerson[];
};

type StatusFilter = "active" | "complete";
type RoleFilter = "all" | "poster" | "collaborator";

const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const timeLabel = (value: string) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const agoLabel = (value: string, renderedAt: string) => {
  const minutes = Math.max(0, Math.floor((new Date(renderedAt).getTime() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : dateLabel(value);
};

export function ProjectsHub({ projects, currentUserId, renderedAt }: { projects: ProjectListItem[]; currentUserId: string; renderedAt: string }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const activeCount = projects.filter((project) => project.status === "active").length;
  const completedCount = projects.length - activeCount;
  const filtered = useMemo(() => projects.filter((project) => {
    const correctStatus = project.status === statusFilter;
    const correctRole = roleFilter === "all" || project.currentRole === roleFilter;
    return correctStatus && correctRole;
  }), [projects, roleFilter, statusFilter]);

  return <section className="projects-hub-wrap">
    <div className="projects-hub-overline"><span>PROJECT HUB</span><span>Shared workspaces · India</span></div>
    <div className="projects-hub-heading"><div><h1>Projects</h1><p>Shared spaces with your collaborators across accepted opportunities and mutual proposals.</p></div><div className="projects-hub-summary"><span><i />{activeCount} active {activeCount === 1 ? "project" : "projects"}</span><span>{projects.length} total workspaces</span></div></div>

    <div className="projects-hub-controls">
      <div className="projects-status-tabs" aria-label="Project status">
        <button type="button" aria-pressed={statusFilter === "active"} onClick={() => setStatusFilter("active")}>Active projects <span>{activeCount}</span></button>
        <button type="button" aria-pressed={statusFilter === "complete"} onClick={() => setStatusFilter("complete")}>Completed projects <span>{completedCount}</span></button>
      </div>
      <div className="projects-role-filters" aria-label="Filter by your role">
        <span>Filter by</span>
        {(["all", "poster", "collaborator"] as RoleFilter[]).map((role) => <button type="button" key={role} aria-pressed={roleFilter === role} onClick={() => setRoleFilter(role)}>{role === "all" ? "All" : `Where I’m ${role === "poster" ? "poster" : "contributor"}`}</button>)}
      </div>
    </div>

    {filtered.length ? <div className="projects-hub-list">{filtered.map((project) => {
      const isPoster = project.ownerId === currentUserId;
      const activeParticipants = project.participants.filter((person) => person.status === "active");
      return <article className={`project-hub-card ${project.status === "complete" ? "is-complete" : ""}`} key={project.id}>
        <div className="project-hub-card-bar"><span className="project-hub-state"><i />{project.status === "active" ? `Active · Started ${dateLabel(project.createdAt)}` : `Completed · Finished ${project.completedAt ? dateLabel(project.completedAt) : dateLabel(project.createdAt)}`}</span><span className="project-hub-role">{isPoster ? "Poster / Project owner" : "Contributor"}</span><code>PRJ-{project.id.slice(0, 6).toUpperCase()}</code></div>
        <div className="project-hub-card-content"><div className="project-hub-card-main">
          <div className="project-hub-origin">Created from {project.origin} <span>{project.id.slice(0, 8).toUpperCase()}</span></div>
          <h2>{project.title}</h2>
          {project.status === "active" && project.latestActivity ? <div className="project-hub-activity"><span className="project-hub-activity-icon" aria-hidden="true">♫</span><span><small>Latest project message · {agoLabel(project.latestActivity.createdAt, renderedAt)}</small><strong>{project.latestActivity.senderName}: {project.latestActivity.body}</strong></span><time>{timeLabel(project.latestActivity.createdAt)}</time></div> : project.status === "complete" ? <p className="project-hub-complete-note">✓ Project confirmed complete{project.completedAt ? ` on ${dateLabel(project.completedAt)}` : ""}.</p> : <p className="project-hub-quiet-note">No messages yet. Open the workspace to get started with your collaborators.</p>}
          <div className="project-hub-participants"><span>{project.status === "active" ? "Participants" : "Project team"}</span><div>{(project.status === "active" ? activeParticipants : project.participants).map((person) => <span className="project-hub-person" key={person.id}><i>{person.name.slice(0, 1).toUpperCase()}</i>{person.name}{person.id === project.ownerId ? " (Poster)" : " (Contributor)"}</span>)}</div></div>
        </div><aside className="project-hub-card-side"><span>{project.status === "active" ? `${activeParticipants.length} active participant${activeParticipants.length === 1 ? "" : "s"}` : "Read-only project history"}</span><Link className={project.status === "active" ? "project-hub-open" : "project-hub-archive"} href={`/projects/${project.id}`}>{project.status === "active" ? "Open shared project space" : "View archived space"}<b aria-hidden="true">→</b></Link></aside></div>
      </article>;
    })}</div> : <section className="projects-hub-empty"><span className="projects-empty-icon" aria-hidden="true">♫</span><small>{statusFilter === "active" ? "ACTIVE WORKSPACES" : "COMPLETED WORKSPACES"}</small><h2>{projects.length ? "No projects in this view" : "Your project spaces will appear here"}</h2><p>{projects.length ? "Change the role filter or check the other project status tab." : "A shared workspace opens after a gig applicant is accepted or a proposal is mutually accepted."}</p><Link href="/opportunities">Explore open gigs and proposals ↗</Link></section>}

    <section className="projects-hub-protocol"><div className="projects-protocol-icon" aria-hidden="true">♫</div><div><small>PROJECT GUIDE · HOW SHARED SPACES WORK</small><h2>Make the work together</h2><p>Project conversations are visible to the participants in that workspace. The poster confirms completion, and project exits are recorded privately for the people involved.</p></div><div className="projects-protocol-points"><span>Shared conversation</span><span>Poster confirms completion</span><span>Private exit history</span></div></section>
    <footer className="projects-hub-footer"><span>Looking for a project or collaborator?</span><Link href="/opportunities">Explore open gigs and proposals ↗</Link></footer>
  </section>;
}
