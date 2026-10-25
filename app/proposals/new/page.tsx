import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createProposal } from "../../actions";

export const instant = false;

type Props = { searchParams: Promise<{ to?: string; error?: string }> };

export default async function NewProposalPage({ searchParams }: Props) {
  const { to, error } = await searchParams;
  if (!to || !/^[0-9a-f-]{36}$/i.test(to)) notFound();
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>New proposal</h1><p>Connect Supabase to send project proposals.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: recipient } = await supabase.from("profiles").select("id,username,display_name,main_specialty,secondary_specialties,genres,city,state,country,avatar_path,avatar_doodle").eq("id", to).maybeSingle();
  if (!recipient || recipient.id === user.id) notFound();
  const { data: signedAvatar } = recipient.avatar_path ? await supabase.storage.from("avatars").createSignedUrl(recipient.avatar_path, 600) : { data: null };
  const avatarUrl = signedAvatar?.signedUrl ?? null;
  const location = [recipient.city, recipient.state].filter(Boolean).join(", ");

  return <main className="opportunities-shell proposal-create-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals" aria-current="page">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></div></header>

    <div className="proposal-create-wrap">
      <div className="proposal-create-back"><Link href={`/profiles/${recipient.username}`}>← Back to musician profile</Link><span>DIRECT COLLABORATION DISPATCH · INDIA</span></div>
      <header className="proposal-create-heading"><div><span className="eyebrow">NEW PROJECT PROPOSAL</span><h1>Start a collaboration</h1><p>Send a focused project idea to {recipient.display_name}. You can discuss details in the proposal thread.</p></div><span className="proposal-create-status"><i /> DIRECT SETTLEMENT · V1</span></header>

      <aside className="proposal-protocol-banner"><span aria-hidden="true">♧</span><div><strong>Direct musician-to-musician settlement</strong><p>Payment terms are arranged between musicians outside Muxics. If both people accept, Muxics creates a shared project space for the work.</p></div><span className="proposal-protocol-tag">NO PLATFORM COMMISSION</span></aside>

      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className="proposal-create-grid">
        <form className="proposal-create-form" action={createProposal}>
          <input type="hidden" name="recipientId" value={recipient.id} />

          <section className="proposal-create-section recipient-select-section">
            <header><span><i>01</i> Recipient musician</span><Link href="/discover">Browse musicians</Link></header>
            <Link className="proposal-recipient-card" href={`/profiles/${recipient.username}`}>
              <span className={`proposal-recipient-avatar profile-doodle ${recipient.avatar_doodle}`}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <span aria-hidden="true">♫</span>}</span>
              <span className="proposal-recipient-info"><strong>{recipient.display_name} <span aria-label="verified">✓</span></strong><small>@{recipient.username} · {recipient.main_specialty}</small><small>⌖ {location}{recipient.country ? `, ${recipient.country}` : ""}</small></span>
              <span className="proposal-recipient-verified">PROFILE</span><span className="proposal-recipient-arrow" aria-hidden="true">↗</span>
            </Link>
            <p className="proposal-section-hint">Check their profile and audio demos before sending your idea.</p>
          </section>

          <section className="proposal-create-section">
            <header><label><i>02</i> Engagement model</label><span>CHOOSE ONE</span></header>
            <div className="proposal-kind-options">
              <label className="proposal-kind-option"><input type="radio" name="kind" value="hiring" /><span className="proposal-kind-icon" aria-hidden="true">₹</span><span className="proposal-kind-copy"><strong>Hiring</strong><small>Paid session or production work. Agree on compensation directly in your proposal.</small><em>DIRECT PAYMENT TERMS</em></span><span className="proposal-kind-radio" /></label>
              <label className="proposal-kind-option"><input type="radio" name="kind" value="collaboration" defaultChecked /><span className="proposal-kind-icon" aria-hidden="true">♫</span><span className="proposal-kind-copy"><strong>Collaboration</strong><small>Work together on a track, with creative and split terms discussed between you.</small><em>CREATIVE PARTNERSHIP</em></span><span className="proposal-kind-radio" /></label>
            </div>
          </section>

          <section className="proposal-create-section">
            <header><label htmlFor="proposal-topic"><i>03</i> Project topic</label><span>SHORT, CLEAR SUBJECT</span></header>
            <input className="proposal-create-input" id="proposal-topic" name="topic" maxLength={150} placeholder="e.g. Vocal stems for an indie fusion track" required />
            <p className="proposal-section-hint">This becomes the title of your proposal and shared project space.</p>
          </section>

          <section className="proposal-create-section proposal-message-section">
            <header><label htmlFor="proposal-body"><i>04</i> Opening studio note</label><span>UP TO 10,000 CHARACTERS</span></header>
            <p className="proposal-section-hint">Describe the role, deliverables, timeline, audio format, and any payment or collaboration terms you want to discuss.</p>
            <textarea className="proposal-create-textarea" id="proposal-body" name="body" rows={8} maxLength={10000} placeholder={`Hi ${recipient.display_name.split(" ")[0]},\n\nI’m working on…\n\nThe part I’d love your help with is…\n\nTimeline, deliverables, and terms…`} required />
          </section>

          <div className="proposal-create-actions"><Link className="proposal-cancel-button" href={`/profiles/${recipient.username}`}>Cancel</Link><button className="proposal-send-button" type="submit"><span aria-hidden="true">➤</span> Send proposal</button></div>
        </form>

        <aside className="proposal-create-sidebar">
          <section className="proposal-sidebar-card proposal-steps-card"><div className="proposal-sidebar-kicker">AFTER YOU SEND</div><h2>What happens next?</h2><ol><li><i>1</i><span><b>{recipient.display_name} gets your proposal</b><small>They can review it and reply in the proposal thread.</small></span></li><li><i>2</i><span><b>Discuss details together</b><small>Clarify the scope, timing, formats, and terms before accepting.</small></span></li><li><i>3</i><span><b>Accept to open a workspace</b><small>A shared project space is created once both people accept.</small></span></li></ol></section>
          <section className="proposal-sidebar-card proposal-dossier"><div className="proposal-sidebar-kicker">RECIPIENT DOSSIER <Link href={`/profiles/${recipient.username}`}>View profile ↗</Link></div><div className="proposal-dossier-person"><span className={`proposal-recipient-avatar profile-doodle ${recipient.avatar_doodle}`}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <span aria-hidden="true">♫</span>}</span><span><strong>{recipient.display_name}</strong><small>{recipient.main_specialty}</small><small>{location}{recipient.country ? ` · ${recipient.country}` : ""}</small></span></div><div className="proposal-dossier-tags">{(recipient.genres ?? []).slice(0, 4).map((genre: string) => <span key={genre}>{genre}</span>)}</div></section>
          <p className="proposal-private-note"><span aria-hidden="true">◇</span> Proposals are shared only with the two musicians. Muxics does not provide casual private DMs.</p>
        </aside>
      </div>
    </div>

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
