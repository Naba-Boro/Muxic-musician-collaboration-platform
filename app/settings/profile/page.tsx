import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "../../actions";

export const instant = false;

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

function durationLabel(seconds: number) {
  const value = Math.floor(Number(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export default async function ProfileSettingsPage({ searchParams }: Props) {
  await connection();
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Profile settings</h1><p>Connect Supabase to edit your profile.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const [{ data: profile }, { data: demos }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("demos").select("id,object_path,duration_seconds,mime_type,position").eq("user_id", user.id).order("position"),
    supabase.from("portfolio_links").select("id,title,url,platform,position").eq("user_id", user.id).order("position"),
  ]);
  if (!profile) redirect("/signup?error=Complete+your+profile+to+continue.");
  const [{ data: signedAvatar }, demoItems] = await Promise.all([
    profile.avatar_path ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 600) : Promise.resolve({ data: null }),
    Promise.all((demos ?? []).map(async (demo) => {
      const { data } = await supabase.storage.from("demos").createSignedUrl(demo.object_path, 600);
      return { ...demo, signedUrl: data?.signedUrl ?? null };
    })),
  ]);
  const avatarUrl = signedAvatar?.signedUrl ?? null;
  const publicProfileUrl = `/profiles/${profile.username}`;

  return <main className="opportunities-shell profile-settings-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>

    <div className="profile-settings-wrap">
      <div className="profile-settings-breadcrumb"><Link href={publicProfileUrl}>← Back to profile</Link><span>STUDIO CONSOLE / PREFERENCES / PROFILE SETTINGS</span></div>
      <header className="profile-settings-heading"><div><span className="eyebrow">YOUR MUSICIAN IDENTITY</span><h1>Edit profile</h1><p>Keep your profile, specialties, and public portfolio up to date.</p></div><Link className="profile-view-public" href={publicProfileUrl}>View public profile ↗</Link></header>

      {message && <p className="profile-settings-message" role="status"><span aria-hidden="true">✓</span><b>Profile details saved.</b> Your musician profile has been updated.<Link href={publicProfileUrl}>View profile ↗</Link></p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}

      <div className="profile-settings-layout">
        <aside className="profile-settings-rail">
          <div className="profile-settings-rail-title">PROFILE SETTINGS <span>LIVE</span></div>
          <a href="#general-info" className="is-active"><span>♙</span>General info</a>
          <a href="#skills-audio"><span>♫</span>Skills &amp; audio</a>
          <a href="#visibility"><span>⊘</span>Privacy</a>
          <Link href="/settings/blocks"><span>♧</span>Blocked accounts <span className="rail-chevron">›</span></Link>
          <div className="profile-rail-note"><span className="profile-rail-dot" />PUBLIC PROFILE<p>Your profile is visible to signed-in members, except people you’ve blocked.</p></div>
        </aside>

        <form className="profile-editor-form" action={updateProfile}>
          <section className="profile-editor-card" id="general-info">
            <header className="profile-editor-section-heading"><span><i /> Section 1: Artist identity</span><small>CHANNEL 01 // CORE ID</small></header>
            <div className="profile-editor-body">
              <div className="profile-editor-avatar-row"><div className={`profile-editor-avatar profile-doodle ${profile.avatar_doodle}`}>{avatarUrl ? <img src={avatarUrl} alt={`${profile.display_name} profile`} /> : <span aria-hidden="true">♫</span>}</div><div><strong>{profile.display_name}</strong><p>{profile.main_specialty} · @{profile.username}</p><small>Your profile image is shown to musicians viewing your profile.</small></div></div>
              <div className="profile-editor-grid">
                <div className="profile-editor-field"><label htmlFor="displayName">Display name</label><input id="displayName" name="displayName" defaultValue={profile.display_name} maxLength={80} required /><small>This name appears on your public profile and proposals.</small></div>
                <div className="profile-editor-field"><label htmlFor="username">Username / handle</label><input id="username" value={`@${profile.username}`} readOnly /><small>Your profile URL: muxics.in/{profile.username}</small></div>
                <div className="profile-editor-field profile-editor-full"><label htmlFor="location">Location / base hub</label><div className="profile-location-grid"><input id="location" name="city" aria-label="City" defaultValue={profile.city} placeholder="City" required /><input name="state" aria-label="State" defaultValue={profile.state} placeholder="State" required /><input name="country" aria-label="Country" defaultValue={profile.country} placeholder="Country" required /></div><small>Use the city and state musicians should see on your profile.</small></div>
              </div>
            </div>
          </section>

          <section className="profile-editor-card" id="skills-audio">
            <header className="profile-editor-section-heading"><span><i /> Section 2: Musical specialties &amp; genres</span><small>CHANNEL 02 // ROUTING</small></header>
            <div className="profile-editor-body profile-editor-grid">
              <div className="profile-editor-field profile-editor-full"><label htmlFor="mainSpecialty">Primary specialty</label><input id="mainSpecialty" name="mainSpecialty" defaultValue={profile.main_specialty} maxLength={80} required /><small>Your main role shown first in musician discovery.</small></div>
              <div className="profile-editor-field profile-editor-full"><label htmlFor="secondarySpecialties">Secondary skills <span>UP TO 6 · SEPARATE WITH COMMAS</span></label><input id="secondarySpecialties" name="secondarySpecialties" defaultValue={(profile.secondary_specialties ?? []).join(", ")} placeholder="e.g. Guitar, songwriting, mixing" /><small>{(profile.secondary_specialties ?? []).length} of 6 skills currently listed.</small></div>
              <div className="profile-editor-field profile-editor-full"><label htmlFor="genres">Preferred genres</label><input id="genres" name="genres" defaultValue={(profile.genres ?? []).join(", ")} placeholder="e.g. Indie pop, Indian classical, ambient" required /><small>Add the styles people should use to find your work.</small></div>
              <div className="profile-editor-field profile-editor-full"><label>Audio demo portfolio <span>{demoItems.length} {demoItems.length === 1 ? "TRACK" : "TRACKS"}</span></label>
                {demoItems.length ? <div className="profile-audio-list">{demoItems.map((demo) => <article className="profile-audio-item" key={demo.id}><div className="profile-audio-meta"><span>♫ &nbsp; Profile demo {demo.position}</span><small>{durationLabel(Number(demo.duration_seconds))} · {demo.mime_type === "audio/mpeg" ? "MP3" : "M4A"}</small></div>{demo.signedUrl ? <audio controls preload="none" src={demo.signedUrl} aria-label={`Profile audio demo ${demo.position}`}>Your browser does not support audio playback.</audio> : <p>Audio preview is unavailable.</p>}</article>)}</div> : <p className="profile-editor-empty">No audio demos have been added to your profile yet.</p>}
                <small>These demos are currently read-only here; audio replacement isn’t available in this settings form.</small>
              </div>
            </div>
          </section>

          <section className="profile-editor-card" id="artist-bio">
            <header className="profile-editor-section-heading"><span><i /> Section 3: Artist bio &amp; external showcase</span><small>CHANNEL 03 // DISPATCH</small></header>
            <div className="profile-editor-body profile-editor-grid">
              <div className="profile-editor-field profile-editor-full"><label htmlFor="bio">Artist biography <span>UP TO 2,000 CHARACTERS</span></label><textarea id="bio" name="bio" rows={5} maxLength={2000} defaultValue={profile.bio} placeholder="Tell musicians about your sound, experience, and the work you want to do." /><small>Keep it direct and highlight the kind of projects you’re open to.</small></div>
              <div className="profile-editor-field profile-editor-full"><label>External portfolio links <span>{links?.length ?? 0} SAVED</span></label>
                {links?.length ? <div className="profile-link-list">{links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.id}><span aria-hidden="true">↗</span><span><b>{link.title}</b><small>{link.platform}</small></span><strong>Open link</strong></a>)}</div> : <p className="profile-editor-empty">No external portfolio links have been added to your profile yet.</p>}
                <small>External link editing isn’t available in this settings form.</small>
              </div>
            </div>
          </section>

          <section className="profile-editor-card" id="visibility">
            <header className="profile-editor-section-heading"><span><i /> Section 4: Visibility &amp; privacy</span><small>CHANNEL 04 // GATEWAYS</small></header>
            <div className="profile-editor-body profile-visibility-content">
              <div><span><b>Public musician profile</b><small>Visible to signed-in members in musician discovery, except accounts you block.</small></span><span className="profile-visibility-state"><i /> ON</span></div>
              <div><span><b>Receive project proposals</b><small>Other musicians can send you focused collaboration and hiring proposals.</small></span><span className="profile-visibility-state"><i /> ON</span></div>
              <Link href="/settings/blocks">Manage blocked accounts <span aria-hidden="true">→</span></Link>
            </div>
          </section>

          <div className="profile-editor-actions"><Link href={publicProfileUrl}>Cancel</Link><button type="submit"><span aria-hidden="true">▣</span> Save profile changes</button></div>
        </form>
      </div>
    </div>

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile" aria-current="page"><span>♙</span>Profile</Link></nav>
  </main>;
}
