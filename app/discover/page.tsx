import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { PeopleDiscovery, type Musician } from "./people-discovery";

export default async function DiscoverPage() {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Discover musicians</h1><p>Connect Supabase to explore musicians in the community.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data } = await supabase.from("profiles").select("id,username,display_name,main_specialty,secondary_specialties,city,state,country,genres,bio,avatar_doodle,avatar_path").neq("id", user.id).eq("onboarding_completed", true).order("created_at", { ascending: false }).limit(100);
  const profiles = data ?? [];
  const profileIds = profiles.map((profile) => profile.id);
  const [{ data: demos }, signedAvatars] = await Promise.all([
    profileIds.length ? supabase.from("demos").select("id,user_id,object_path,duration_seconds,position").in("user_id", profileIds).order("position") : Promise.resolve({ data: [] }),
    Promise.all(profiles.map(async (profile) => {
      if (!profile.avatar_path) return [profile.id, null] as const;
      const { data: avatar } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 600);
      return [profile.id, avatar?.signedUrl ?? null] as const;
    })),
  ]);
  const avatarUrls = new Map(signedAvatars ?? []);
  const profileDemos = await Promise.all((demos ?? []).map(async (demo) => {
    const { data: signedDemo } = await supabase.storage.from("demos").createSignedUrl(demo.object_path, 600);
    return { ...demo, signedUrl: signedDemo?.signedUrl ?? null };
  }));
  const firstDemoByUser = new Map<string, (typeof profileDemos)[number]>();
  for (const demo of profileDemos) if (!firstDemoByUser.has(demo.user_id)) firstDemoByUser.set(demo.user_id, demo);

  const musicians: Musician[] = profiles.map((profile) => {
    const demo = firstDemoByUser.get(profile.id);
    return {
      id: profile.id,
      username: profile.username,
      name: profile.display_name,
      mainSpecialty: profile.main_specialty,
      specialties: profile.secondary_specialties ?? [],
      city: profile.city,
      state: profile.state,
      country: profile.country,
      genres: profile.genres ?? [],
      bio: profile.bio ?? "",
      doodle: profile.avatar_doodle,
      avatarUrl: avatarUrls.get(profile.id) ?? null,
      demoUrl: demo?.signedUrl ?? null,
      demoDuration: demo ? Number(demo.duration_seconds) : null,
    };
  });

  return <main className="opportunities-shell discover-shell">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover" aria-current="page">Discover</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></div></header>
    <section className="feed-wrap"><PeopleDiscovery musicians={musicians} /></section>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover" aria-current="page"><span aria-hidden="true">◎</span>Explore</Link><Link href="/opportunities"><span aria-hidden="true">▢</span>Gigs</Link><Link href="/applications"><span aria-hidden="true">▤</span>Applications</Link><Link href="/projects"><span aria-hidden="true">◉</span>Projects</Link><Link href="/settings/profile"><span aria-hidden="true">♙</span>Profile</Link></nav>
  </main>;
}
