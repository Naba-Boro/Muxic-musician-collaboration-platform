import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ProjectsHub, type ProjectListItem } from "./projects-hub";

export const instant = false;

export default async function ProjectsPage() {
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Projects</h1><p>Connect Supabase to see your shared projects.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: memberships } = await supabase.from("project_members").select("project_id,role,status,joined_at").eq("user_id", user.id).order("joined_at", { ascending: false });
  const memberRows = memberships ?? [];
  const ids = memberRows.map((item) => item.project_id);
  const { data: projects } = ids.length
    ? await supabase.from("projects").select("id,title,status,created_at,completed_at,owner_id,source_gig_id,source_proposal_id").in("id", ids).order("created_at", { ascending: false })
    : { data: [] };

  const projectRows = projects ?? [];
  const [messagesResult, participantResults] = await Promise.all([
    ids.length
      ? supabase.from("project_messages").select("id,project_id,sender_id,body,created_at").in("project_id", ids).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] }),
    Promise.all(projectRows.map((project) => supabase.rpc("project_participant_cards", { target_project: project.id }))),
  ]);
  const memberByProject = new Map(memberRows.map((member) => [member.project_id, member]));
  const latestMessageByProject = new Map<string, { id: string; project_id: string; sender_id: string; body: string; created_at: string }>();
  for (const message of messagesResult.data ?? []) {
    if (!latestMessageByProject.has(message.project_id)) latestMessageByProject.set(message.project_id, message);
  }

  const items: ProjectListItem[] = projectRows.map((project, index) => {
    const participants = participantResults[index]?.data ?? [];
    const latest = latestMessageByProject.get(project.id);
    const latestSender = latest ? participants.find((person) => person.user_id === latest.sender_id) : null;
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.created_at,
      completedAt: project.completed_at,
      ownerId: project.owner_id,
      currentRole: memberByProject.get(project.id)?.role ?? "collaborator",
      origin: project.source_gig_id ? "Opportunity" : "Mutual proposal",
      latestActivity: latest ? { body: latest.body, createdAt: latest.created_at, senderName: latestSender?.display_name ?? "Project participant" } : null,
      participants: participants.map((person: { user_id: string; display_name: string; member_status: string }) => ({
        id: person.user_id,
        name: person.display_name,
        status: person.member_status,
      })),
    };
  });

  return <main className="opportunities-shell projects-hub-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects" aria-current="page">Projects</Link><Link href="/settings/profile">Profile</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-label="Notifications">♧</Link><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></div></header>
    <ProjectsHub projects={items} currentUserId={user.id} renderedAt={new Date().toISOString()} />
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects" aria-current="page"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
