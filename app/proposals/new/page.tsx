import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { createProposal } from "../../actions";

type Props = { searchParams: Promise<{ to?: string; error?: string }> };

export default async function NewProposalPage({ searchParams }: Props) {
  const { to, error } = await searchParams;
  if (!to || !/^[0-9a-f-]{36}$/i.test(to)) notFound();
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>New proposal</h1><p>Connect Supabase to send project proposals.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: recipient } = await supabase.from("profiles").select("id,display_name,username").eq("id", to).maybeSingle();
  if (!recipient || recipient.id === user.id) notFound();
  return <main className="signup-layout"><header className="signup-header"><Link className="brand" href={`/profiles/${recipient.username}`}><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href={`/profiles/${recipient.username}`}>← Back to profile</Link></header><section className="signup-content"><div className="signup-intro"><span className="eyebrow">START A CONVERSATION</span><h1>Propose a<br /><em>project.</em></h1><p>Writing to {recipient.display_name}. Keep the first note clear and specific.</p></div>{error && <p className="notice notice-error" role="alert">{error}</p>}<form className="signup-form" action={createProposal}><input type="hidden" name="recipientId" value={recipient.id} /><div className="field"><label htmlFor="kind">Proposal type</label><select id="kind" name="kind" required defaultValue="collaboration"><option value="collaboration">Collaboration</option><option value="hiring">Hiring</option></select></div><div className="field"><label htmlFor="topic">Topic</label><input id="topic" name="topic" maxLength={150} placeholder="A short subject for your idea" required /></div><div className="field"><label htmlFor="body">Message</label><textarea id="body" name="body" rows={7} maxLength={10000} placeholder="Describe the idea, the role, timing, and any other details you want to discuss." required /></div><p className="field-hint">You can both reply. The project is created only after you both accept. For hiring, include the fixed INR amount in your message.</p><button className="button button-primary signup-submit" type="submit">Send proposal <span aria-hidden="true">→</span></button></form></section></main>;
}
