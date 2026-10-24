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
  const { data } = await supabase.from("profiles").select("id,username,display_name,main_specialty,secondary_specialties,city,state,country,genres,avatar_doodle").neq("id", user.id).eq("onboarding_completed", true).order("created_at", { ascending: false }).limit(100);
  const musicians: Musician[] = (data ?? []).map((profile) => ({
    id: profile.id,
    username: profile.username,
    name: profile.display_name,
    mainSpecialty: profile.main_specialty,
    specialties: profile.secondary_specialties ?? [],
    city: profile.city,
    state: profile.state,
    country: profile.country,
    genres: profile.genres ?? [],
    doodle: profile.avatar_doodle,
  }));
  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover" aria-current="page">Discover people</Link><Link href="/applications">Applications</Link><Link href="/proposals">Proposals</Link><Link href="/projects">Projects</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header><section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">GOOD PEOPLE MAKE GOOD MUSIC</span><h1>Find your sound.</h1><p>Meet musicians by specialty and location, or take a chance on someone new.</p></div><Link className="create-gig" href="/settings/profile">Your profile <span>↗</span></Link></div><PeopleDiscovery musicians={musicians} /></section></main>;
}
