import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { unblockUser } from "../../actions";

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function BlockedAccountsPage({ searchParams }: Props) {
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Blocked accounts</h1><p>Connect Supabase to manage blocked accounts.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: blocks } = await supabase.from("blocks").select("blocked_id,created_at").eq("blocker_id", user.id).order("created_at", { ascending: false });
  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/settings/profile">← Profile settings</Link></header><section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">YOUR SAFETY SETTINGS</span><h1>Blocked accounts.</h1><p>They won’t appear in your profile or opportunity discovery.</p></div></div>{message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}{blocks?.length ? <div className="application-list">{blocks.map((block) => <article className="application-card block-card" key={block.blocked_id}><div><strong>Blocked member</strong><p>Blocked {new Date(block.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div><form action={unblockUser}><input type="hidden" name="blockedId" value={block.blocked_id} /><button className="button button-secondary" type="submit">Unblock</button></form></article>)}</div> : <div className="empty-state"><strong>No blocked accounts.</strong><p>When you block a member, you can manage it here.</p><Link href="/discover">Discover musicians ↗</Link></div>}</section></main>;
}
