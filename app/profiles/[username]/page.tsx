import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { blockUser } from "../../actions";

type Props = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Profiles</h1><p>Connect Supabase to view musician profiles.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("id,username,display_name,main_specialty,secondary_specialties,city,state,country,genres,bio,avatar_path,avatar_doodle").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
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
  return <main className="signup-layout detail-layout"><header className="signup-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/discover">← Discover musicians</Link></header><article className="detail-content profile-detail"><div className="profile-heading"><div className={`profile-doodle profile-doodle-large ${profile.avatar_doodle}`} aria-hidden="true">♫</div><div><span className="eyebrow">MUSICIAN PROFILE</span><h1>{profile.display_name}</h1><p className="detail-poster">@{profile.username} · {profile.city}, {profile.state}, {profile.country}</p></div></div><span className="gig-specialty">Main specialty · {profile.main_specialty}</span>{profile.secondary_specialties?.length > 0 && <section className="detail-section"><h2>Also do</h2><div className="person-tags">{profile.secondary_specialties.map((item: string) => <span key={item}>{item}</span>)}</div></section>}{profile.genres?.length > 0 && <section className="detail-section"><h2>Genres</h2><div className="person-tags">{profile.genres.map((item: string) => <span key={item}>{item}</span>)}</div></section>}{profile.bio && <section className="detail-section"><h2>About</h2><p>{profile.bio}</p></section>}<section className="detail-section"><h2>Demos</h2>{demoItems.length ? <div className="demo-list">{demoItems.map((demo) => <div className="demo-player" key={demo.id}><span>Demo {demo.position}</span>{demo.signedUrl ? <audio controls preload="none" src={demo.signedUrl}>Your browser doesn’t support audio playback.</audio> : <span className="field-hint">Demo unavailable</span>}</div>)}</div> : <p className="field-hint">No demos available.</p>}</section><section className="detail-section"><h2>Past work and links</h2>{links?.length ? <div className="portfolio-links">{links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.title} <span>↗</span></a>)}</div> : <p className="field-hint">No external work links added yet.</p>}</section>{!isOwn && <div className="profile-actions"><Link className="button button-primary" href={`/proposals/new?to=${profile.id}`}>Propose a project <span>→</span></Link>{!existingBlock && <form action={blockUser}><input type="hidden" name="blockedId" value={profile.id} /><button className="text-button" type="submit">Block this account</button></form>}</div>}{isOwn && <Link className="button button-secondary profile-edit-link" href="/settings/profile">Edit your profile <span>↗</span></Link>}</article></main>;
}
