import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ProposalsHub, type ProposalListItem } from "./proposals-hub";

export const instant = false;

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function ProposalsPage({ searchParams }: Props) {
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Proposals</h1><p>Connect Supabase to manage project proposals.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: rawProposals }, { data: hiddenRows }] = await Promise.all([
    supabase.from("proposals").select("id,creator_id,recipient_id,kind,topic,status,creator_accepted_at,recipient_accepted_at,terminated_by,created_at,updated_at").or(`creator_id.eq.${user.id},recipient_id.eq.${user.id}`).order("updated_at", { ascending: false }),
    supabase.from("proposal_history_hidden").select("proposal_id").eq("user_id", user.id),
  ]);
  const hiddenIds = new Set((hiddenRows ?? []).map((row) => row.proposal_id));
  const proposals = (rawProposals ?? []).filter((proposal) => !hiddenIds.has(proposal.id));
  const proposalIds = proposals.map((proposal) => proposal.id);
  const acceptedProposalIds = proposals.filter((proposal) => proposal.status === "accepted").map((proposal) => proposal.id);
  const otherIds = [...new Set(proposals.map((proposal) => proposal.creator_id === user.id ? proposal.recipient_id : proposal.creator_id))];

  const [{ data: people }, { data: rawMessages }, { data: projectRows }] = await Promise.all([
    otherIds.length ? supabase.from("profiles").select("id,display_name,username").in("id", otherIds) : Promise.resolve({ data: [] }),
    proposalIds.length ? supabase.from("proposal_messages").select("id,proposal_id,sender_id,body,created_at").in("proposal_id", proposalIds).order("created_at", { ascending: false }).limit(1000) : Promise.resolve({ data: [] }),
    acceptedProposalIds.length ? supabase.from("projects").select("id,source_proposal_id").in("source_proposal_id", acceptedProposalIds) : Promise.resolve({ data: [] }),
  ]);
  const peopleById = new Map((people ?? []).map((person) => [person.id, person]));
  const projectByProposal = new Map((projectRows ?? []).map((project) => [project.source_proposal_id, project.id]));
  const latestByProposal = new Map<string, { sender_id: string; body: string; created_at: string }>();
  for (const item of rawMessages ?? []) if (!latestByProposal.has(item.proposal_id)) latestByProposal.set(item.proposal_id, item);

  const items: ProposalListItem[] = proposals.map((proposal) => {
    const otherId = proposal.creator_id === user.id ? proposal.recipient_id : proposal.creator_id;
    const person = peopleById.get(otherId);
    const latest = latestByProposal.get(proposal.id);
    const acceptedByMe = proposal.creator_id === user.id ? proposal.creator_accepted_at : proposal.recipient_accepted_at;
    const acceptedByOther = proposal.creator_id === user.id ? proposal.recipient_accepted_at : proposal.creator_accepted_at;
    return {
      id: proposal.id,
      creatorId: proposal.creator_id,
      otherName: person?.display_name ?? "Account unavailable",
      otherUsername: person?.username ?? null,
      kind: proposal.kind,
      topic: proposal.topic,
      status: proposal.status,
      acceptedByMe: Boolean(acceptedByMe),
      acceptedByOther: Boolean(acceptedByOther),
      terminatedByMe: proposal.terminated_by === user.id,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at,
      latestMessage: latest ? { senderId: latest.sender_id, body: latest.body, createdAt: latest.created_at, isMine: latest.sender_id === user.id } : null,
      projectId: projectByProposal.get(proposal.id) ?? null,
    };
  });

  return <main className="opportunities-shell proposals-hub-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals" aria-current="page">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <ProposalsHub proposals={items} currentUserId={user.id} message={message} error={error} renderedAt={new Date().toISOString()} />
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
