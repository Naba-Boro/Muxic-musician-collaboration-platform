import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { blockUser } from "../../actions";

type Props = { params: Promise<{ username: string }> };

function durationLabel(seconds: number) {
  const total = Math.floor(Number(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Musician profiles</h1><p>Connect Supabase to view musician profiles.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("id,username,display_name,main_specialty,secondary_specialties,city,state,country,genres,bio,avatar_path,avatar_doodle").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const { data: signedAvatar } = profile.avatar_path ? await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 600) : { data: null };
  const avatarUrl = signedAvatar?.signedUrl ?? null;
  const [{ data: demos }, { data: links }, { data: existingBlock }] = await Promise.all([
    supabase.from("demos").select("id,object_path,duration_seconds,position").eq("user_id", profile.id).order("position"),
    supabase.from("portfolio_links").select("id,title,url,platform,position").eq("user_id", profile.id).order("position"),
    supabase.from("blocks").select("blocker_id").eq("blocker_id", user.id).eq("blocked_id", profile.id).maybeSingle(),
  ]);
  const demoItems = await Promise.all((demos ?? []).map(async (demo) => {
    const { data } = await supabase.storage.from("demos").createSignedUrl(demo.object_path, 600);
    return { ...demo, signedUrl: data?.signedUrl ?? null };
  }));
  const isOwn = profile.id === user.id;
  const location = `${profile.city}, ${profile.state}, ${profile.country}`;

  return <main className="opportunities-shell public-profile-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Discover</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>

    <div className="public-profile-content">
      <div className="public-profile-kicker"><span><i /> Public musician profile</span><span>Location · {profile.country}</span></div>
      <section className="public-profile-hero">
        <div className={`public-profile-avatar profile-doodle ${profile.avatar_doodle}`}>{avatarUrl ? <img src={avatarUrl} alt={`${profile.display_name} profile`} /> : <span aria-hidden="true">♫</span>}</div>
        <div className="public-profile-identity"><h1>{profile.display_name}</h1><span className="public-profile-handle">@{profile.username}</span><p>{profile.main_specialty}{profile.genres?.length ? ` · ${profile.genres.slice(0, 2).join(" · ")}` : ""}</p><span className="public-profile-location">⌖ {location}</span></div>
        <div className="public-profile-actions">{isOwn ? <Link className="public-propose-button" href="/settings/profile">Edit profile <span aria-hidden="true">↗</span></Link> : <><Link className="public-propose-button" href={`/proposals/new?to=${profile.id}`}><span aria-hidden="true">♧</span> Propose a project</Link>{!existingBlock && <form action={blockUser}><input type="hidden" name="blockedId" value={profile.id} /><button className="public-block-button" type="submit" aria-label="Block this musician" title="Block this musician">⊘</button></form>}</>}</div>
        {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
        {!isOwn && <p className="public-profile-proposal-hint">Proposals are focused project discussions. Muxics has no casual DMs.</p>}
      </section>

      <div className="public-profile-grid">
        <div className="public-profile-main-column">
          <section className="public-profile-section public-demo-section"><header className="public-section-heading"><div><span className="public-section-kicker">♫ Audio portfolio</span><h2>Audio demos</h2></div><span className="public-section-count">{demoItems.length} {demoItems.length === 1 ? "demo" : "demos"}</span></header>
            {demoItems.length ? <div className="public-demo-list">{demoItems.map((demo) => <article className="public-demo-card" key={demo.id}><div className="public-demo-label"><span aria-hidden="true">♫</span><strong>Profile demo {demo.position}</strong><small>{durationLabel(Number(demo.duration_seconds))}</small></div>{demo.signedUrl ? <audio controls preload="none" aria-label={`${profile.display_name} profile demo ${demo.position}`} src={demo.signedUrl}>Your browser does not support audio playback.</audio> : <p className="public-demo-unavailable">This demo is currently unavailable.</p>}</article>)}</div> : <p className="public-profile-empty">No audio demos have been added yet.</p>}
            <p className="public-demo-note">Demos give you a quick listen to this musician’s work. Open a linked platform below for more.</p>
          </section>

          <section className="public-profile-section public-profile-skills"><div><span className="public-section-kicker">☷ Skills</span><h2>Specialties</h2>{profile.secondary_specialties?.length ? <div className="public-profile-tags">{profile.secondary_specialties.map((item: string) => <span key={item}>{item}</span>)}</div> : <p className="public-profile-empty">No additional specialties listed.</p>}</div><div><span className="public-section-kicker">♫ Style</span><h2>Genres</h2>{profile.genres?.length ? <div className="public-profile-tags public-profile-genres">{profile.genres.map((item: string) => <span key={item}>{item}</span>)}</div> : <p className="public-profile-empty">No genres listed.</p>}</div></section>

          <section className="public-profile-section public-links-section"><header className="public-section-heading"><div><span className="public-section-kicker">↗ Work beyond Muxics</span><h2>Past work & external links</h2></div></header>{links?.length ? <div className="public-work-links">{links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer"><span className="public-work-link-mark" aria-hidden="true">↗</span><span><strong>{link.title}</strong><small>{link.platform === "other" ? "External work link" : link.platform}</small></span><span className="public-work-link-arrow" aria-hidden="true">↗</span></a>)}</div> : <p className="public-profile-empty">No external work links have been added yet.</p>}</section>
        </div>

        <aside className="public-profile-side-column">
          <section className="public-profile-side-card public-collab-card"><span className="public-section-kicker">Work together</span><h2>Collaborate or hire</h2><p>Start a proposal with a clear project idea. Choose hiring or collaboration and discuss the details together.</p><ul><li>Share the role and project expectations.</li><li>Reply to each other in the proposal thread.</li><li>A shared project space opens after both accept.</li></ul>{!isOwn && <Link className="public-propose-button" href={`/proposals/new?to=${profile.id}`}>Propose a project <span aria-hidden="true">→</span></Link>}</section>
          <section className="public-profile-side-card public-profile-details"><span className="public-section-kicker">Profile details</span><dl><div><dt>Primary specialty</dt><dd>{profile.main_specialty}</dd></div><div><dt>Based in</dt><dd>{location}</dd></div><div><dt>Additional specialties</dt><dd>{profile.secondary_specialties?.length ? profile.secondary_specialties.length : "Not listed"}</dd></div><div><dt>Audio demos</dt><dd>{demoItems.length}</dd></div></dl></section>
          {!isOwn && <p className="public-block-note">Blocking someone hides each other’s profiles and prevents proposals. You may still see each other in a shared active project.</p>}
        </aside>
      </div>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span aria-hidden="true">◎</span>Explore</Link><Link href="/opportunities"><span aria-hidden="true">▢</span>Gigs</Link><Link href="/applications"><span aria-hidden="true">▤</span>Applications</Link><Link href="/projects"><span aria-hidden="true">◉</span>Projects</Link><Link href="/settings/profile" aria-current={isOwn ? "page" : undefined}><span aria-hidden="true">♙</span>Profile</Link></nav>
  </main>;
}
