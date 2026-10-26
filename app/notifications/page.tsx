import Link from "next/link";
import { ProfileMenu } from "@/app/profile-menu";
import { redirect } from "next/navigation";
import { extendGigDeadline, markNotificationsRead } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Notification = { id: string; event_type: string; reference_type: string | null; reference_id: string | null; body: string; read_at: string | null; created_at: string };
type Filter = "all" | "unread" | "proposals" | "applications" | "projects";

const filterLabels: Record<Filter, string> = { all: "All", unread: "Unread", proposals: "Proposals", applications: "Applications", projects: "Projects" };

function categoryOf(item: Notification): Exclude<Filter, "all" | "unread"> {
  if (item.reference_type === "proposal") return "proposals";
  if (item.reference_type === "project") return "projects";
  return "applications";
}

function notificationHref(item: Notification, ownerIds: Set<string>, userId: string) {
  if (!item.reference_id) return "/notifications";
  if (item.reference_type === "project") return `/projects/${item.reference_id}`;
  if (item.reference_type === "proposal") return `/proposals/${item.reference_id}`;
  if (item.reference_type === "gig") return ownerIds.has(item.reference_id) ? `/my-opportunities/${item.reference_id}` : "/applications";
  return `/profiles/${userId}`;
}

function eventLabel(event: string) {
  const labels: Record<string, string> = {
    proposal_received: "New proposal",
    proposal_accepted_once: "Proposal accepted",
    application_accepted: "Application accepted",
    application_not_selected: "Application update",
    project_created: "Project workspace ready",
    gig_deadline_24h: "Opportunity closing soon",
    gig_closed_deadline: "Opportunity closed",
  };
  return labels[event] ?? event.replaceAll("_", " ");
}

function eventIcon(event: string) {
  if (event.startsWith("proposal")) return "▤";
  if (event.startsWith("application")) return "☑";
  if (event.startsWith("project")) return "♫";
  return "◷";
}

function shortTime(date: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function notificationCard(item: Notification, ownerIds: Set<string>, userId: string, gig: { id: string; status: string } | undefined) {
  const isUnread = !item.read_at;
  const href = notificationHref(item, ownerIds, userId);
  return <article className={`studio-notification-card ${isUnread ? "is-unread" : "is-read"}`} key={item.id}>
    <div className="studio-notification-icon" aria-hidden="true">{eventIcon(item.event_type)}</div>
    <div className="studio-notification-content">
      <div className="studio-notification-top"><span className="studio-notification-type">{eventLabel(item.event_type)}</span>{isUnread && <span className="studio-unread-dot" aria-label="Unread" />}<time>{shortTime(item.created_at)}</time></div>
      <p>{item.body}</p>
      <div className="studio-notification-bottom"><span>{item.reference_type ? `${item.reference_type} update` : "Muxics activity"} · {new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span><span className="studio-notification-actions"><Link href={href}>{item.event_type === "project_created" || item.event_type === "application_accepted" ? "Open project" : item.reference_type === "proposal" ? "View proposal" : "View update"} →</Link>{isUnread && <form action={markNotificationsRead}><input type="hidden" name="notificationId" value={item.id} /><button type="submit">Mark read</button></form>}</span></div>
      {item.event_type === "gig_deadline_24h" && ownerIds.has(item.reference_id ?? "") && gig?.status === "open" && <form action={extendGigDeadline} className="deadline-extend-form"><input type="hidden" name="gigId" value={gig.id} /><label><span>New deadline</span><input type="date" name="deadlineDate" required /><input type="time" name="deadlineTime" defaultValue="23:59" required /></label><button className="button button-secondary" type="submit">Extend deadline</button></form>}
    </div>
  </article>;
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; filter?: string }> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/">♫ Muxics.</Link><section className="simple-auth-card"><h1>Notifications</h1><p>Connect Supabase to view your notifications.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: rows } = await supabase.from("notifications").select("id,event_type,reference_type,reference_id,body,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100);
  const notifications = (rows ?? []) as Notification[];
  const filter = (Object.keys(filterLabels).includes(query.filter ?? "") ? query.filter : "all") as Filter;
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const counts: Record<Filter, number> = {
    all: notifications.length,
    unread: unreadCount,
    proposals: notifications.filter((item) => categoryOf(item) === "proposals").length,
    applications: notifications.filter((item) => categoryOf(item) === "applications").length,
    projects: notifications.filter((item) => categoryOf(item) === "projects").length,
  };
  const filtered = notifications.filter((item) => filter === "unread" ? !item.read_at : filter === "all" ? true : categoryOf(item) === filter);
  const gigIds = [...new Set(notifications.filter((item) => item.reference_type === "gig" && item.reference_id).map((item) => item.reference_id!))];
  const { data: ownedGigs } = gigIds.length ? await supabase.from("gigs").select("id,status").eq("poster_id", user.id).in("id", gigIds) : { data: [] };
  const ownedGigIds = new Set((ownedGigs ?? []).map((gig) => gig.id));
  const ownedGigById = new Map((ownedGigs ?? []).map((gig) => [gig.id, gig] as const));
  const unreadNotifications = filtered.filter((item) => !item.read_at);
  const readNotifications = filtered.filter((item) => Boolean(item.read_at));

  return <main className="opportunities-shell studio-notifications-page">
    <header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/discover">Explore</Link><Link href="/opportunities">Gigs</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/proposals">Proposals</Link></nav><div className="app-header-actions"><Link className="icon-link" href="/notifications" aria-current="page" aria-label="Notifications">♧{unreadCount > 0 && <i className="notification-header-dot" />}</Link><ProfileMenu /></div></header>

    <div className="studio-notifications-wrap">
      <div className="studio-notifications-kicker"><span>CONSOLE / ROUTING / <b>INCOMING TELEMETRY &amp; FEED</b></span><span>ACTIVITY FEED · IST</span></div>
      <header className="studio-notifications-heading"><div><h1>Studio notifications &amp; feed</h1><p>Track updates on proposals, applications, and active project spaces.</p></div><div className="studio-notifications-head-actions"><form action={markNotificationsRead}><button type="submit" className="studio-mark-all" disabled={!unreadCount}>✓ Mark all as read</button></form><Link href="/settings/blocks" className="studio-notifications-settings">Privacy &amp; blocks</Link></div></header>
      {query.error && <p className="notice notice-error" role="alert">{query.error}</p>}{query.message && <p className="notice notice-success" role="status">{query.message}</p>}

      <nav className="studio-notification-filters" aria-label="Filter notifications">{(Object.keys(filterLabels) as Filter[]).map((key) => <Link key={key} href={key === "all" ? "/notifications" : `/notifications?filter=${key}`} aria-current={filter === key ? "page" : undefined}>{filterLabels[key]} <b>{counts[key]}</b></Link>)}</nav>
      <div className="studio-notifications-grid">
        <section className="studio-notification-feed" aria-label="Notification feed">
          {unreadNotifications.length > 0 && <><div className="studio-feed-section-heading"><span>TODAY / UNREAD ALERTS</span><i /><b>{unreadNotifications.length} UNREAD</b></div><div className="studio-notification-list">{unreadNotifications.map((item) => notificationCard(item, ownedGigIds, user.id, item.reference_id ? ownedGigById.get(item.reference_id) : undefined))}</div></>}
          {readNotifications.length > 0 && <><div className="studio-feed-section-heading"><span>{unreadNotifications.length ? "EARLIER / READ NOTIFICATIONS" : "READ NOTIFICATIONS"}</span><i /><b>{readNotifications.length} READ</b></div><div className="studio-notification-list">{readNotifications.map((item) => notificationCard(item, ownedGigIds, user.id, item.reference_id ? ownedGigById.get(item.reference_id) : undefined))}</div></>}
          {!filtered.length && <section className="studio-notifications-empty"><span aria-hidden="true">♧</span><h2>{filter === "unread" ? "No unread notifications" : "Nothing in this feed yet"}</h2><p>{filter === "unread" ? "You’re caught up. New updates will appear here." : "Updates on proposals, applications, and projects will appear here."}</p><Link href="/opportunities">Explore open gigs and calls →</Link></section>}
        </section>

        <aside className="studio-notifications-sidebar">
          <section className="studio-feed-monitor"><div className="studio-side-kicker">FEED STATUS MONITOR <i /></div><div className="studio-feed-monitor-screen"><span aria-hidden="true">♫</span><h2>{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All caught up!"}</h2><p>{unreadCount ? "Review new activity from your proposals, applications, and projects." : "You have no unread updates. Check back when there’s new activity."}</p><Link href="/opportunities">Explore open opportunities</Link></div><div className="studio-monitor-foot"><span>Feed sorted by<br /><b>Newest activity</b></span><span>Loaded<br /><b>{notifications.length} recent</b></span></div></section>
          <section className="studio-activity-summary"><div className="studio-side-kicker">ACTIVITY SUMMARY <i>IST</i></div><h2>Updates by channel</h2><div><span>Proposals</span><b>{counts.proposals}</b></div><div><span>Applications &amp; opportunities</span><b>{counts.applications}</b></div><div><span>Project spaces</span><b>{counts.projects}</b></div><small>Counts reflect the latest {notifications.length} notifications in this feed.</small></section>
          <section className="studio-notification-help"><span aria-hidden="true">ⓘ</span><p><b>Need a quieter feed?</b><br />Mark updates as read when you’ve reviewed them. Use the tabs to focus on one activity type.</p></section>
        </aside>
      </div>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/discover"><span>◎</span>Explore</Link><Link href="/opportunities"><span>▢</span>Gigs</Link><Link href="/applications"><span>▤</span>Applications</Link><Link href="/projects"><span>◉</span>Projects</Link><Link href="/settings/profile"><span>♙</span>Profile</Link></nav>
  </main>;
}
