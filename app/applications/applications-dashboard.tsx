"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { withdrawApplication } from "../actions";

type Status = "pending" | "accepted" | "not_selected" | "withdrawn" | "gig_closed" | string;
type Gig = { id: string; title: string; kind: "collaboration" | "hiring"; payment: number | null; city: string; state: string; deadline: string; status: string };
type Poster = { name: string; city: string; state: string };
type Project = { id: string; title: string; status: string };

export type ApplicationItem = {
  id: string;
  gigId: string;
  message: string;
  status: Status;
  appliedAt: string;
  gig: Gig | null;
  poster: Poster | null;
  project: Project | null;
};

const statusLabels: Record<string, string> = {
  pending: "Pending review",
  accepted: "Accepted",
  not_selected: "Not selected",
  withdrawn: "Withdrawn",
  gig_closed: "Opportunity closed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function ApplicationsDashboard({ items, message, error }: { items: ApplicationItem[]; message?: string; error?: string }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    accepted: items.filter((item) => item.status === "accepted").length,
    not_selected: items.filter((item) => item.status === "not_selected").length,
    closed: items.filter((item) => item.status === "withdrawn" || item.status === "gig_closed").length,
  }), [items]);
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "all" || (statusFilter === "closed" ? item.status === "withdrawn" || item.status === "gig_closed" : item.status === statusFilter);
    const matchesKind = kindFilter === "all" || item.gig?.kind === kindFilter;
    return matchesStatus && matchesKind;
  }).sort((a, b) => sortOrder === "newest"
    ? new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    : new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());

  return <>
    <div className="applications-heading"><div><span className="applications-kicker"><i /> Tracking status · live pipeline</span><h1>Your applications</h1><p>Track the status of opportunities you’ve applied to across India.</p></div><div className="applications-summary"><span>Submitted<strong>{counts.all.toString().padStart(2, "0")} total</strong></span><span>Active review<strong>{counts.pending.toString().padStart(2, "0")} {counts.pending === 1 ? "application" : "applications"}</strong></span></div></div>
    {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
    <div className="applications-filter-row"><div className="applications-status-tabs" role="group" aria-label="Filter by application status">
      {([["all", "All", counts.all], ["pending", "Pending review", counts.pending], ["accepted", "Accepted", counts.accepted], ["not_selected", "Not selected", counts.not_selected], ["closed", "Withdrawn / closed", counts.closed]] as const).map(([value, label, count]) => <button key={value} type="button" className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}><i aria-hidden="true" />{label}<b>{count}</b></button>)}
    </div><div className="applications-extra-filters"><label>Type<select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}><option value="all">All types</option><option value="hiring">Hiring</option><option value="collaboration">Collaboration</option></select></label><label>Sort by<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Latest applied</option><option value="oldest">Earliest applied</option></select></label></div></div>

    <div className="applications-layout">
      <section className="applications-results" aria-label="Your applications">
        {filteredItems.length ? <div className="applications-cards">{filteredItems.map((item) => {
          const gig = item.gig;
          const statusLabel = statusLabels[item.status] ?? item.status.replaceAll("_", " ");
          return <article className={`application-card-v2 application-${item.status}`} key={item.id}>
            <header className="application-v2-header"><span className={`application-v2-status application-v2-status-${item.status}`}><i aria-hidden="true" />{statusLabel}</span><span>Applied {formatDate(item.appliedAt)}</span></header>
            <div className="application-v2-body">
              {!gig ? <><h2>Opportunity no longer available</h2><p className="application-closure-note">This opportunity may have been removed or is no longer visible.</p></> : <>
                <div className="application-compensation-line">{gig.kind === "hiring" ? <span className="application-fixed-amount">₹{new Intl.NumberFormat("en-IN").format(Number(gig.payment ?? 0))} INR · Fixed</span> : <span className="application-collab-label">Collaboration · unpaid</span>}</div>
                <h2><Link href={`/opportunities/${gig.id}`}>{gig.title}</Link></h2>
                <p className="application-poster-line"><span aria-hidden="true">♙</span><strong>{item.poster?.name ?? "Music community member"}</strong><span>·</span><span>{item.poster ? `${item.poster.city}, ${item.poster.state}` : `${gig.city}, ${gig.state}`}</span></p>
                {item.status === "pending" && <><blockquote className="application-pitch">“{item.message}”</blockquote><div className="application-deadline-line"><span>Application deadline</span><strong>{formatDate(gig.deadline)}</strong></div></>}
                {item.status === "accepted" && <div className="application-project-ready"><strong><span aria-hidden="true">♫</span> You’ve been accepted</strong><p>{item.project?.status === "complete" ? "The poster marked this project complete. You can still view its history." : item.project ? "Your shared project space is ready. Continue the conversation with the poster there." : "Your application was accepted."}</p></div>}
                {item.status === "not_selected" && <p className="application-closure-note">The poster did not select this application.</p>}
                {item.status === "withdrawn" && <p className="application-closure-note">You withdrew this application.</p>}
                {item.status === "gig_closed" && <p className="application-closure-note">The opportunity closed before your application was accepted.</p>}
                <footer className="application-v2-footer">
                  {item.status === "pending" && <form action={withdrawApplication}><input type="hidden" name="applicationId" value={item.id} /><button className="text-button" type="submit">Withdraw application</button></form>}
                  {item.status === "accepted" && item.project ? <Link className="application-project-link" href={`/projects/${item.project.id}`}>{item.project.status === "complete" ? "View project history" : "Go to shared project"} <span aria-hidden="true">→</span></Link> : gig && <Link className="application-brief-link" href={`/opportunities/${gig.id}`}>{item.status === "pending" ? "View opportunity brief" : "View opportunity"} <span aria-hidden="true">↗</span></Link>}
                </footer>
              </>}
            </div>
          </article>;
        })}</div> : <div className="empty-state"><strong>{items.length ? "No applications in this view." : "No applications yet."}</strong><p>{items.length ? "Choose another status or opportunity type." : "When you find the right project, apply and track its progress here."}</p>{items.length ? <button className="opportunity-reset-link" type="button" onClick={() => { setStatusFilter("all"); setKindFilter("all"); }}>Show all applications</button> : <Link href="/opportunities">Explore opportunities ↗</Link>}</div>}
      </section>
      <aside className="applications-side-panel"><section className="applications-side-card"><span className="applications-side-kicker">Make your profile count</span><h2>Your profile helps posters decide.</h2><p>Keep your specialties, location, bio, and music demos current so posters can review what you bring to a project.</p><Link href="/settings/profile">Edit your profile <span>→</span></Link></section><section className="applications-side-card applications-process-card"><span className="applications-side-kicker">What happens next</span><ol><li>The poster reviews your introduction and public profile.</li><li>If accepted, a shared project space opens for the project team.</li><li>Hiring payments are arranged directly in v1, outside Muxics.</li></ol></section></aside>
    </div>
  </>;
}
