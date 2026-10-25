"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ProposalListItem = {
  id: string;
  creatorId: string;
  otherName: string;
  otherUsername: string | null;
  kind: string;
  topic: string;
  status: "open" | "accepted" | "terminated";
  acceptedByMe: boolean;
  acceptedByOther: boolean;
  terminatedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  latestMessage: { senderId: string; body: string; createdAt: string; isMine: boolean } | null;
  projectId: string | null;
};

type StatusFilter = "all" | "open" | "accepted" | "terminated";
type ScopeFilter = "received" | "sent";

const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const timeLabel = (value: string) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const agoLabel = (value: string, renderedAt: string) => {
  const minutes = Math.max(0, Math.floor((new Date(renderedAt).getTime() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : dateLabel(value);
};

export function ProposalsHub({ proposals, currentUserId, message, error, renderedAt }: {
  proposals: ProposalListItem[];
  currentUserId: string;
  message?: string;
  error?: string;
  renderedAt: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("received");
  const scoped = useMemo(() => proposals.filter((proposal) => scopeFilter === "sent" ? proposal.creatorId === currentUserId : proposal.creatorId !== currentUserId), [currentUserId, proposals, scopeFilter]);
  const counts = {
    all: scoped.length,
    open: scoped.filter((proposal) => proposal.status === "open").length,
    accepted: scoped.filter((proposal) => proposal.status === "accepted").length,
    terminated: scoped.filter((proposal) => proposal.status === "terminated").length,
  };
  const filtered = useMemo(() => scoped.filter((proposal) => statusFilter === "all" || proposal.status === statusFilter), [scoped, statusFilter]);

  return <section className="proposals-hub-wrap">
    <div className="proposals-hub-eyebrow"><i /> PROPOSAL INBOX · DIRECT COLLABORATION</div>
    <div className="proposals-hub-heading"><div><h1>Proposals &amp; Pitches</h1><p>One-to-one collaboration ideas and project agreements before a shared workspace begins.</p></div><Link className="proposals-new-button" href="/discover">＋ New proposal <span>↗</span></Link></div>
    {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}

    <div className="proposals-filterbar"><div className="proposal-status-filters" aria-label="Filter proposals by status">
      {(["all", "open", "accepted", "terminated"] as StatusFilter[]).map((status) => <button type="button" key={status} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{status === "all" ? "All" : status === "open" ? "Awaiting response" : status === "accepted" ? "Accepted" : "Closed"}<span>{counts[status]}</span></button>)}
    </div><div className="proposal-scope-switch" aria-label="Proposal direction">{(["received", "sent"] as ScopeFilter[]).map((scope) => <button type="button" key={scope} aria-pressed={scopeFilter === scope} onClick={() => setScopeFilter(scope)}>{scope === "received" ? "Received" : "Sent by me"}<span>{proposals.filter((proposal) => scope === "sent" ? proposal.creatorId === currentUserId : proposal.creatorId !== currentUserId).length}</span></button>)}</div></div>

    {filtered.length ? <div className="proposals-hub-list">{filtered.map((proposal) => {
      const isMine = proposal.creatorId === currentUserId;
      const isAccepted = proposal.status === "accepted";
      const isClosed = proposal.status === "terminated";
      const direction = isMine ? `Sent to ${proposal.otherName}` : `From ${proposal.otherName}`;
      const stateLabel = isAccepted ? "Accepted · Workspace ready" : isClosed ? proposal.terminatedByMe ? "Closed · You ended this proposal" : "Closed" : proposal.acceptedByMe ? "You accepted · Waiting for their acceptance" : proposal.acceptedByOther ? "They accepted · Your response needed" : isMine ? "Waiting for response" : "Awaiting your response";
      const cta = isAccepted && proposal.projectId ? "Open shared project" : isClosed ? "View proposal thread" : isMine && !proposal.acceptedByOther ? "View proposal" : "Review & respond";
      return <article className={`proposal-hub-card ${isAccepted ? "is-accepted" : ""} ${isClosed ? "is-closed" : ""}`} key={proposal.id}>
        <div className="proposal-hub-card-bar"><span className="proposal-hub-state"><i />{stateLabel}</span><span>{isMine ? "OUTBOUND PROPOSAL" : "INBOUND PROPOSAL"}</span><code>PRP-{proposal.id.slice(0, 6).toUpperCase()}</code></div>
        <div className="proposal-hub-card-body"><div className="proposal-hub-person-row"><span className="proposal-hub-avatar" aria-hidden="true">{proposal.otherName.slice(0, 1).toUpperCase()}</span><div><strong>{direction}</strong><small>{proposal.otherUsername ? `@${proposal.otherUsername}` : "Muxics member"} · {proposal.kind === "hiring" ? "Hiring" : "Collaboration"}</small></div><time>{agoLabel(proposal.updatedAt, renderedAt)}</time></div>
          <h2>{proposal.topic}</h2>
          {proposal.latestMessage && <div className="proposal-hub-message"><span>{proposal.latestMessage.isMine ? "Your latest message" : "Latest message"} · {timeLabel(proposal.latestMessage.createdAt)}</span><p>{proposal.latestMessage.body}</p></div>}
          {isAccepted && <p className="proposal-hub-status-note">Both participants accepted. The proposal terms stay in this thread; continue project work in the shared workspace.</p>}
          {isClosed && <p className="proposal-hub-status-note">This proposal is closed. Its conversation remains available in your proposal history.</p>}
          <div className="proposal-hub-card-bottom"><span>Started {dateLabel(proposal.createdAt)}</span><div>{isAccepted && proposal.projectId && <Link className="proposal-hub-secondary-link" href={`/proposals/${proposal.id}`}>View proposal</Link>}<Link className={`proposal-hub-action ${isClosed ? "is-secondary" : ""}`} href={isAccepted && proposal.projectId ? `/projects/${proposal.projectId}` : `/proposals/${proposal.id}`}>{cta}<b aria-hidden="true">→</b></Link></div></div>
        </div>
      </article>;
    })}</div> : <section className="proposals-hub-empty"><span aria-hidden="true">♫</span><small>{statusFilter === "all" ? "PROPOSAL INBOX" : `${statusFilter === "open" ? "AWAITING RESPONSE" : statusFilter === "accepted" ? "ACCEPTED" : "CLOSED"} PROPOSALS`}</small><h2>{proposals.length ? "No proposals in this view" : "Start a collaboration conversation"}</h2><p>{proposals.length ? "Try another status or switch between proposals you received and sent." : "Find an Indian musician whose skills fit your project, then send a focused hiring or collaboration proposal from their profile."}</p><Link href="/discover">Discover musicians ↗</Link></section>}

    <section className="proposals-hub-guide"><span className="proposals-guide-icon" aria-hidden="true">♫</span><div><small>HOW PROPOSALS WORK</small><h2>Agree first, then make the work together.</h2><p>Proposal messages are visible to both participants. A shared project workspace is created only after both people accept. Hiring payments are arranged directly between participants outside Muxics.</p></div><Link href="/discover">Find musicians ↗</Link></section>
  </section>;
}
