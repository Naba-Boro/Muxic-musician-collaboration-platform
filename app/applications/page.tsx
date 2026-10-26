import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
import { ApplicationsDashboard, type ApplicationItem } from "./applications-dashboard";

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function ApplicationsPage({ searchParams }: Props) {
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Applications</h1><p>Connect Supabase to view and track your applications.</p><Link className="small-link back-link" href="/">Back to sign in</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: applications } = await supabase.from("applications").select("id,gig_id,message,status,created_at").eq("applicant_id", user.id).order("created_at", { ascending: false });
  const applicationRows = applications ?? [];
  const gigIds = [...new Set(applicationRows.map((application) => application.gig_id))];
  const { data: gigs } = gigIds.length ? await supabase.from("gigs").select("id,title,kind,payment_amount_inr,city,state,deadline_at,status,poster_id").in("id", gigIds) : { data: [] };
  const gigRows = gigs ?? [];
  const posterIds = [...new Set(gigRows.map((gig) => gig.poster_id))];
  const [{ data: posters }, { data: projects }] = await Promise.all([
    posterIds.length ? supabase.from("profiles").select("id,display_name,city,state").in("id", posterIds) : Promise.resolve({ data: [] }),
    gigIds.length ? supabase.from("projects").select("id,title,status,source_gig_id").in("source_gig_id", gigIds) : Promise.resolve({ data: [] }),
  ]);
  const gigMap = new Map(gigRows.map((gig) => [gig.id, gig]));
  const posterMap = new Map((posters ?? []).map((poster) => [poster.id, poster]));
  const projectMap = new Map((projects ?? []).map((project) => [project.source_gig_id, project]));
  const items: ApplicationItem[] = applicationRows.map((application) => {
    const gig = gigMap.get(application.gig_id);
    const poster = gig ? posterMap.get(gig.poster_id) : null;
    return {
      id: application.id,
      gigId: application.gig_id,
      message: application.message,
      status: application.status,
      appliedAt: application.created_at,
      gig: gig ? {
        id: gig.id,
        title: gig.title,
        kind: gig.kind,
        payment: gig.payment_amount_inr,
        city: gig.city,
        state: gig.state,
        deadline: gig.deadline_at,
        status: gig.status,
      } : null,
      poster: poster ? { name: poster.display_name, city: poster.city, state: poster.state } : null,
      project: projectMap.get(application.gig_id) ? {
        id: projectMap.get(application.gig_id)!.id,
        title: projectMap.get(application.gig_id)!.title,
        status: projectMap.get(application.gig_id)!.status,
      } : null,
    };
  });

  return <main className="opportunities-shell applications-shell">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Discover</Link><Link href="/opportunities">Gigs</Link><Link href="/applications" aria-current="page">Applications</Link><Link href="/projects">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><ProfileMenu /></div></header>
    <section className="feed-wrap"><ApplicationsDashboard items={items} message={message} error={error} /></section>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span aria-hidden="true">◎</span>Explore</Link><Link href="/opportunities"><span aria-hidden="true">▢</span>Gigs</Link><Link href="/applications" aria-current="page"><span aria-hidden="true">▤</span>Applications</Link><Link href="/projects"><span aria-hidden="true">◉</span>Projects</Link><Link href="/settings/profile"><span aria-hidden="true">♙</span>Profile</Link></nav>
  </main>;
}
