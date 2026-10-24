import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ProjectsPage() {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Projects</h1><p>Connect Supabase to see your shared projects.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: memberships } = await supabase.from("project_members").select("project_id,role,status,joined_at").eq("user_id", user.id).order("joined_at", { ascending: false });
  const ids = (memberships ?? []).map((item) => item.project_id);
  const { data: projects } = ids.length ? await supabase.from("projects").select("id,title,status,created_at,completed_at,owner_id").in("id", ids).order("created_at", { ascending: false }) : { data: [] };
  const projectsById = new Map((projects ?? []).map((project) => [project.id, project]));
  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover">Discover people</Link><Link href="/applications">Applications</Link><Link href="/proposals">Proposals</Link><Link href="/projects" aria-current="page">Projects</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header><section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">MAKE SOMETHING TOGETHER</span><h1>Your projects.</h1><p>Shared spaces for the work you’ve agreed to make.</p></div></div>{projects?.length ? <div className="application-list">{projects.map((project) => <article className="application-card" key={project.id}><div className="gig-card-top"><span className="gig-type">{project.owner_id === user.id ? "Poster" : "Contributor"}</span><span className={`status-pill ${project.status === "active" ? "status-accepted" : "status-gig_closed"}`}>{project.status}</span></div><h2><Link href={`/projects/${project.id}`}>{project.title}</Link></h2><div className="application-card-bottom"><span>Started {new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span><Link className="small-link" href={`/projects/${project.id}`}>Open project →</Link></div></article>)}</div> : <div className="empty-state"><strong>No projects yet.</strong><p>Projects appear here when you’re accepted for a gig or both people accept a proposal.</p><Link href="/opportunities">Explore opportunities ↗</Link></div>}</section></main>;
}
