import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { acceptProposal, deleteProposalHistory, replyToProposal, terminateProposal } from "../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };

export default async function ProposalThreadPage({ params, searchParams }: Props) {
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Proposal</h1><p>Connect Supabase to open the conversation.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  if (!proposal) notFound();
  const otherId = proposal.creator_id === user.id ? proposal.recipient_id : proposal.creator_id;
  const [{ data: person }, { data: messages }, { data: existingProject }] = await Promise.all([
    supabase.from("profiles").select("display_name,username").eq("id", otherId).maybeSingle(),
    supabase.from("proposal_messages").select("id,sender_id,body,created_at").eq("proposal_id", id).order("created_at"),
    proposal.status === "accepted" ? supabase.from("projects").select("id").eq("source_proposal_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const myAccepted = proposal.creator_id === user.id ? proposal.creator_accepted_at : proposal.recipient_accepted_at;
  const otherAccepted = proposal.creator_id === user.id ? proposal.recipient_accepted_at : proposal.creator_accepted_at;
  const messageSenderIds = [...new Set((messages ?? []).map((item) => item.sender_id))];
  const { data: senders } = messageSenderIds.length ? await supabase.from("profiles").select("id,display_name").in("id", messageSenderIds) : { data: [] };
  const senderMap = new Map((senders ?? []).map((sender) => [sender.id, sender.display_name]));
  return <main className="signup-layout"><header className="signup-header"><Link className="brand" href="/proposals"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/proposals">← Proposal history</Link></header><section className="thread-content"><div className="thread-heading"><div><span className="eyebrow">{proposal.kind.toUpperCase()} PROPOSAL</span><h1>{proposal.topic}</h1><p>Conversation with {person?.display_name ?? "Member"}{person ? ` · @${person.username}` : ""}</p></div><span className={`status-pill status-${proposal.status}`}>{proposal.status}</span></div>{message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}<div className="thread-messages">{messages?.map((item) => <article className={`thread-message ${item.sender_id === user.id ? "thread-message-mine" : ""}`} key={item.id}><div className="thread-message-meta"><strong>{item.sender_id === user.id ? "You" : senderMap.get(item.sender_id) ?? "Member"}</strong><span>{new Date(item.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div><p>{item.body}</p></article>)}</div>{proposal.status === "open" && <><form className="thread-reply" action={replyToProposal}><input type="hidden" name="proposalId" value={id} /><label htmlFor="replyBody">Reply</label><textarea id="replyBody" name="body" rows={3} maxLength={10000} placeholder="Continue the conversation" required /><button className="button button-secondary" type="submit">Send reply <span>→</span></button></form><div className="proposal-actions"><div><strong>{myAccepted ? "You accepted" : otherAccepted ? "The other person accepted" : "Interested?"}</strong><p>{myAccepted ? "Waiting for the other person to accept." : otherAccepted ? "Accept too to create the shared project." : "Both people must accept before a project is created."}</p></div><div className="proposal-action-buttons">{!myAccepted && <form action={acceptProposal}><input type="hidden" name="proposalId" value={id} /><button className="button button-primary" type="submit">Accept proposal <span>→</span></button></form>}<form action={terminateProposal}><input type="hidden" name="proposalId" value={id} /><button className="text-button" type="submit">Terminate proposal</button></form></div></div></>}{proposal.status === "accepted" && <div className="proposal-actions"><div><strong>Proposal accepted</strong><p>You can continue in the shared project.</p></div>{existingProject?.id && <Link className="button button-primary" href={`/projects/${existingProject.id}`}>Open project <span>→</span></Link>}</div>}{proposal.status === "terminated" && <div className="proposal-actions"><div><strong>This proposal was terminated.</strong><p>It remains in your history until you remove your copy.</p></div></div>}<form action={deleteProposalHistory} className="delete-history-form"><input type="hidden" name="proposalId" value={id} /><button className="text-button" type="submit">Delete from my proposal history</button></form></section></main>;
}
