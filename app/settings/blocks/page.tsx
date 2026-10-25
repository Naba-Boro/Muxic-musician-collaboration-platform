import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { BlockedAccountsList, type BlockedAccount } from "./blocked-accounts-list";

export const instant = false;

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function BlockedAccountsPage({ searchParams }: Props) {
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Blocked accounts</h1><p>Connect Supabase to manage blocked accounts.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: blockRows } = await supabase.from("blocks").select("blocked_id,created_at").eq("blocker_id", user.id).order("created_at", { ascending: false });
  const ids = (blockRows ?? []).map((block) => block.blocked_id);
  let profilesById = new Map<string, { username: string; display_name: string; main_specialty: string; avatar_doodle: string }>();
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (ids.length && serviceKey && projectUrl) {
    try {
      const admin = createSupabaseAdminClient(projectUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data } = await admin.from("profiles").select("id,username,display_name,main_specialty,avatar_doodle").in("id", ids);
      profilesById = new Map((data ?? []).map((profile) => [profile.id, profile] as const));
    } catch {
      // The block list still works if profile labels are unavailable.
    }
  }
  const accounts: BlockedAccount[] = (blockRows ?? []).map((block) => {
    const profile = profilesById.get(block.blocked_id);
    return { id: block.blocked_id, username: profile?.username ?? null, displayName: profile?.display_name ?? null, specialty: profile?.main_specialty ?? null, avatarDoodle: profile?.avatar_doodle ?? null, createdAt: block.created_at };
  });

  return <main className="opportunities-shell blocked-settings-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></div></header>

    <div className="blocked-settings-wrap">
      <div className="blocked-breadcrumb"><span>CONSOLE &nbsp;›&nbsp; PREFERENCES &nbsp;›&nbsp; <b>PRIVACY &amp; BLOCKS</b></span><Link href="/settings/profile">← Profile settings</Link></div>
      <div className="blocked-settings-grid">
        <aside className="blocked-settings-rail"><small>ROUTING &amp; NODES</small><Link href="/settings/profile">♙ &nbsp; Profile details</Link><span>♢ &nbsp; Account &amp; security</span><span>♧ &nbsp; Notification settings</span><Link href="/settings/blocks" aria-current="page">⊘ &nbsp; Blocked accounts <b>{accounts.length} RESTRICTED</b></Link><div><i /> PRIVACY SETTINGS<p>Manage which members can discover you and interact with your profile.</p></div></aside>

        <section className="blocked-main-content">
          <header className="blocked-page-heading"><div><span className="eyebrow">◈ ACCESS PROTOCOLS</span><h1>Blocked accounts &amp; privacy restrictions</h1><p>Manage accounts you’ve blocked and review what that changes across Muxics.</p></div><span>{accounts.length} ACTIVE RESTRICTIONS</span></header>
          <section className="blocked-policy-card"><span className="blocked-policy-icon" aria-hidden="true">♢</span><div><h2>Blocking limits discovery and new interactions</h2><p>Blocked members can’t view your profile, public audio demos, or open opportunities. New applications and proposals between you are prevented. Existing records and shared project access are managed under their own rules.</p><div className="blocked-policy-tags"><span>◉ Profile visibility restricted</span><span>◈ Open gig discovery restricted</span><span>⊘ New interactions limited</span></div></div></section>
          {message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}
          <div className="blocked-list-heading"><span>REGISTERED RESTRICTIONS <b>({accounts.length} ACTIVE)</b></span><span>≡ FILTER: ALL POLICIES</span></div>
          <BlockedAccountsList accounts={accounts} />
        </section>
      </div>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile" aria-current="page"><span>♙</span>Profile</Link></nav>
  </main>;
}
