import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { signOut } from "../actions";
import { OpportunityFeed, type Opportunity } from "./opportunity-feed";

export default async function OpportunitiesPage() {
  let opportunities: Opportunity[] = [];
  let signedInName = "Musician";
  let connectionError = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const [{ data: profile }, { data: gigs, error }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      supabase.from("gigs").select("id,title,description,required_specialty,estimated_duration,kind,payment_amount_inr,city,state,country,remote_allowed,deadline_at,poster_id").eq("status", "open").gt("deadline_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(60),
    ]);
    signedInName = profile?.display_name?.split(" ")[0] ?? "Musician";
    connectionError = Boolean(error);

    if (gigs?.length) {
      const posterIds = [...new Set(gigs.map((gig) => gig.poster_id))];
      const { data: posters } = await supabase.from("profiles").select("id,display_name").in("id", posterIds);
      const names = new Map((posters ?? []).map((poster) => [poster.id, poster.display_name]));
      opportunities = gigs.map((gig) => ({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        specialty: gig.required_specialty,
        duration: gig.estimated_duration,
        kind: gig.kind,
        payment: gig.payment_amount_inr,
        location: gig.remote_allowed ? `${gig.city}, ${gig.state} · Remote friendly` : `${gig.city}, ${gig.state}`,
        deadline: gig.deadline_at,
        poster: names.get(gig.poster_id) ?? "Music community member",
      }));
    }
  }

  return (
    <main className="opportunities-shell">
      <header className="app-header">
        <Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link>
        <nav className="app-nav" aria-label="Main navigation">
          <Link href="/opportunities" aria-current="page">Opportunities</Link>
          <Link href="/discover">Discover people</Link>
          <Link href="/applications">Applications</Link>
          <Link href="/proposals">Proposals</Link>
          <Link href="/projects">Projects</Link>
        </nav>
        <div className="app-header-actions">
          <Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link>
          <Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">{signedInName.slice(0, 1).toUpperCase()}</Link>
          <form action={signOut}><button className="signout-button" type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="feed-wrap">
        <div className="feed-heading">
          <div>
            <span className="eyebrow">YOUR NEXT COLLABORATION</span>
            <h1>Find your people.</h1>
            <p>Good projects start with the right people in the room, {signedInName}.</p>
          </div>
          <Link className="create-gig" href="/opportunities/new">Post an opportunity <span aria-hidden="true">+</span></Link>
        </div>
        {!isSupabaseConfigured() && <p className="connection-note">Supabase isn’t connected yet, so opportunities will appear here after the project URL, publishable key, and database migration are set up.</p>}
        {connectionError && <p className="connection-note">We couldn’t load opportunities right now. Please refresh in a moment.</p>}
        <OpportunityFeed opportunities={opportunities} />
      </section>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/opportunities"><span aria-hidden="true">⌂</span>Explore</Link>
        <Link href="/discover"><span aria-hidden="true">♙</span>People</Link>
        <Link href="/applications"><span aria-hidden="true">▤</span>Applied</Link>
        <Link href="/projects"><span aria-hidden="true">♬</span>Projects</Link>
        <Link href="/settings/profile"><span aria-hidden="true">◉</span>Profile</Link>
      </nav>
    </main>
  );
}
