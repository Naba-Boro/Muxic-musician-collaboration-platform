import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { acceptProposal, deleteProposalHistory, replyToProposal, terminateProposal } from "../../actions";

export const instant = false;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ProposalThreadPage({ params, searchParams }: Props) {
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Proposal</h1><p>Connect Supabase to open the conversation.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: proposal } = await supabase.from("proposals").select("id,creator_id,recipient_id,kind,topic,status,creator_accepted_at,recipient_accepted_at,terminated_by,created_at").eq("id", id).maybeSingle();
  if (!proposal) notFound();

  const partyIds = [...new Set([proposal.creator_id, proposal.recipient_id])];
  const [{ data: people }, { data: messages }, { data: existingProject }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,username,city,state").in("id", partyIds),
    supabase.from("proposal_messages").select("id,sender_id,body,created_at").eq("proposal_id", id).order("created_at"),
    proposal.status === "accepted" ? supabase.from("projects").select("id").eq("source_proposal_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const peopleById = new Map((people ?? []).map((person) => [person.id, person]));
  const me = peopleById.get(user.id);
  const otherId = proposal.creator_id === user.id ? proposal.recipient_id : proposal.creator_id;
  const other = peopleById.get(otherId);
  const creator = peopleById.get(proposal.creator_id);
  const recipient = peopleById.get(proposal.recipient_id);
  const acceptedByMe = proposal.creator_id === user.id ? proposal.creator_accepted_at : proposal.recipient_accepted_at;
  const acceptedByOther = proposal.creator_id === user.id ? proposal.recipient_accepted_at : proposal.creator_accepted_at;
  const isHiring = proposal.kind === "hiring";
  const isOpen = proposal.status === "open";
  const isAccepted = proposal.status === "accepted";
  const canAccept = isOpen && !acceptedByMe;
  const currentUserName = me?.display_name ?? "You";
  const otherName = other?.display_name ?? "Account unavailable";
  const statusLabel = isAccepted ? "Accepted · Shared project ready" : proposal.status === "terminated" ? "Closed proposal" : acceptedByMe ? "You accepted · Waiting for the other person" : acceptedByOther ? "They accepted · Your response needed" : proposal.creator_id === user.id ? `Awaiting response from ${otherName}` : `Awaiting your response`;

  return <main className="opportunities-shell proposal-detail-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals" aria-current="page">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <section className="proposal-detail-wrap">
      <div className="proposal-detail-topline"><Link href="/proposals">← Back to proposals</Link><span>PROPOSAL · {id.slice(0, 8).toUpperCase()}</span><time>Created {dateLabel(proposal.created_at)} IST</time></div>
      {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className={`proposal-detail-status ${isAccepted ? "is-accepted" : ""} ${proposal.status === "terminated" ? "is-closed" : ""}`}><i /><div><strong>{statusLabel}</strong><span>{isOpen ? acceptedByMe ? "Your acceptance is recorded. The shared workspace starts when the other person accepts." : acceptedByOther ? "Review the proposal and accept to create the shared workspace." : "Review the proposal terms and conversation before accepting." : isAccepted ? "Both people accepted. Continue project work in the shared workspace." : "This proposal is closed and remains in your history."}</span></div></div>

      <section className="proposal-detail-hero"><div className="proposal-detail-title"><span className={isHiring ? "proposal-kind-tag is-hiring" : "proposal-kind-tag"}>{isHiring ? "Hiring proposal" : "Direct collaboration"}</span><h1>{proposal.topic}</h1><div className="proposal-parties-line"><span>From <strong>{creator?.display_name ?? "Account unavailable"}</strong>{creator?.username ? ` · @${creator.username}` : ""}</span><b>→</b><span>To <strong>{recipient?.display_name ?? "Account unavailable"}</strong>{recipient?.username ? ` · @${recipient.username}` : ""}</span></div></div><div className="proposal-detail-kind-card"><small>PROPOSAL TYPE</small><strong>{isHiring ? "Hiring" : "Collaboration"}</strong><span>{isHiring ? "Paid work terms are discussed directly between participants." : "Agree on the collaboration terms in this thread."}</span></div></section>

      <div className="proposal-detail-grid">
        <aside className="proposal-detail-sidebar">
          <section className="proposal-detail-panel proposal-scope-panel"><header><span>01</span><h2>Proposal scope</h2><small>From this proposal</small></header><div className="proposal-scope-facts"><div><span>Type</span><strong>{isHiring ? "Hiring" : "Collaboration"}</strong></div><div><span>Topic</span><strong>{proposal.topic}</strong></div><div><span>Sent by</span><strong>{creator?.display_name ?? "Account unavailable"}</strong></div><div><span>Sent to</span><strong>{recipient?.display_name ?? "Account unavailable"}</strong></div><div><span>Created</span><strong>{dateLabel(proposal.created_at)} IST</strong></div></div><p className="proposal-scope-note">The proposal message thread contains the details you have discussed. Confirm role, timing, deliverables, and any compensation there before accepting.</p>{isHiring && <p className="proposal-settlement-note"><strong>Direct settlement:</strong> Any hiring payment is arranged between participants outside Muxics. Muxics does not process payment or escrow.</p>}<div className="proposal-workspace-note"><strong>What happens next</strong><span>When both participants accept, Muxics creates a shared project workspace for the collaboration.</span></div></section>

          {isOpen && <section className="proposal-detail-panel proposal-action-panel"><small>ACTION REQUIRED</small><strong>{acceptedByMe ? "Waiting for the other participant" : acceptedByOther ? "The other participant accepted" : "Review and respond"}</strong><p>{acceptedByMe ? "Your acceptance is recorded. You can continue discussing the proposal while you wait." : "Accept only when the scope and terms work for you."}</p><div className="proposal-detail-actions">{canAccept && <form action={acceptProposal}><input type="hidden" name="proposalId" value={id} /><button className="proposal-accept-button" type="submit">✓ {acceptedByOther ? "Accept & create project" : "Accept proposal"}</button></form>}<form action={terminateProposal}><input type="hidden" name="proposalId" value={id} /><button className="proposal-end-button" type="submit">End proposal</button></form></div></section>}

          {isAccepted && <section className="proposal-detail-panel proposal-action-panel is-accepted"><small>ACCEPTED BY BOTH</small><strong>Shared project is ready</strong><p>Continue the work and messages in your shared project workspace.</p>{existingProject?.id && <Link className="proposal-accept-button" href={`/projects/${existingProject.id}`}>Open shared project →</Link>}</section>}
          {proposal.status === "terminated" && <section className="proposal-detail-panel proposal-action-panel is-closed"><small>PROPOSAL CLOSED</small><strong>This thread is read-only.</strong><p>You can keep it in your history or remove your copy.</p></section>}
          <div className="proposal-delete-row"><form action={deleteProposalHistory}><input type="hidden" name="proposalId" value={id} /><button type="submit">Delete from my proposal history</button></form></div>
        </aside>

        <section className="proposal-thread-panel"><header className="proposal-thread-header"><div><h2>Proposal conversation</h2><p>Shared with {currentUserName} and {otherName}. No private one-to-one DMs.</p></div><span>{messages?.length ?? 0} message{messages?.length === 1 ? "" : "s"}</span></header>
          <div className="proposal-thread-messages">{messages?.length ? messages.map((item) => { const sender = peopleById.get(item.sender_id); const isMine = item.sender_id === user.id; return <article className={`proposal-thread-message ${isMine ? "is-mine" : ""}`} key={item.id}><div className="proposal-thread-message-meta"><strong>{isMine ? "You" : sender?.display_name ?? "Account unavailable"}</strong><time>{dateLabel(item.created_at)} IST</time></div><p>{item.body}</p></article>; }) : <div className="proposal-thread-empty"><span>♫</span><strong>Start the proposal conversation</strong><p>Share the project idea, expectations, timing, and any terms you want to agree on.</p></div>}</div>
          {isOpen ? <form className="proposal-thread-reply" action={replyToProposal}><input type="hidden" name="proposalId" value={id} /><label htmlFor="proposalReply">Reply to {otherName}</label><textarea id="proposalReply" name="body" rows={4} maxLength={10000} placeholder="Write a response or ask a question about the project terms…" required /><div><span>Keep proposal details in this shared thread.</span><button className="proposal-send-button" type="submit">Send response →</button></div></form> : <p className="proposal-thread-closed">{isAccepted ? "This proposal thread is read-only. Continue in the shared project workspace." : "This proposal is closed. The conversation remains available as history."}</p>}
        </section>
      </div>
    </section>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
