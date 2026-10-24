import Link from "next/link";
import { redirect } from "next/navigation";
import { extendGigDeadline, markNotificationsRead } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Notification = { id: string; event_type: string; reference_type: string | null; reference_id: string | null; body: string; read_at: string | null; created_at: string };

function notificationHref(item: Notification, ownerIds: Set<string>, userId: string) {
  if (!item.reference_id) return "/notifications";
  if (item.reference_type === "project") return `/projects/${item.reference_id}`;
  if (item.reference_type === "proposal") return `/proposals/${item.reference_id}`;
  if (item.reference_type === "gig") return ownerIds.has(item.reference_id) ? `/my-opportunities/${item.reference_id}` : "/applications";
  return `/profiles/${userId}`;
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/">♫ Muxics.</Link><section className="simple-auth-card"><h1>Notifications</h1><p>Connect Supabase to view your notifications.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: rows } = await supabase.from("notifications").select("id,event_type,reference_type,reference_id,body,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100);
  const notifications = (rows ?? []) as Notification[];
  const gigIds = [...new Set(notifications.filter((item) => item.event_type === "gig_deadline_24h" && item.reference_id).map((item) => item.reference_id!))];
  const { data: ownedGigs } = gigIds.length ? await supabase.from("gigs").select("id,deadline_at,status").eq("poster_id", user.id).in("id", gigIds) : { data: [] };
  const ownedGigIds = new Set((ownedGigs ?? []).map((gig) => gig.id));
  const ownedGigById = new Map((ownedGigs ?? []).map((gig) => [gig.id, gig]));
  return <main className="opportunities-shell"><header className="app-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><nav className="app-nav" aria-label="Main navigation"><Link href="/opportunities">Opportunities</Link><Link href="/discover">Discover people</Link><Link href="/applications">Applications</Link><Link href="/projects">Projects</Link><Link href="/notifications" aria-current="page">Notifications</Link></nav><Link className="app-user-dot" href="/settings/profile" aria-label="Profile settings">♫</Link></header>
    <section className="feed-wrap"><div className="feed-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h1>Notifications.</h1><p>Applications, proposals, projects, and deadline reminders.</p></div><form action={markNotificationsRead}><button className="button button-secondary" type="submit">Mark all as read</button></form></div>
      {query.error && <p className="notice notice-error" role="alert">{query.error}</p>}{query.message && <p className="notice notice-success" role="status">{query.message}</p>}
      {notifications.length ? <div className="notification-list">{notifications.map((item) => { const gig = item.reference_id ? ownedGigById.get(item.reference_id) : undefined; return <article className={`notification-card ${item.read_at ? "notification-read" : "notification-unread"}`} key={item.id}><div className="notification-content"><span className="eyebrow">{item.event_type.replaceAll("_", " ")}</span><p>{item.body}</p><time>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div><div className="notification-actions"><Link className="small-link" href={notificationHref(item, ownedGigIds, user.id)}>Open →</Link>{!item.read_at && <form action={markNotificationsRead}><input type="hidden" name="notificationId" value={item.id}/><button className="text-button" type="submit">Mark read</button></form>}</div>
        {item.event_type === "gig_deadline_24h" && ownedGigIds.has(item.reference_id ?? "") && gig?.status === "open" && <form action={extendGigDeadline} className="deadline-extend-form"><input type="hidden" name="gigId" value={gig.id}/><label><span>New deadline</span><input type="date" name="deadlineDate" required/><input type="time" name="deadlineTime" defaultValue="23:59" required/></label><button className="button button-secondary" type="submit">Extend deadline</button></form>}
      </article>; })}</div> : <div className="empty-state"><strong>You’re all caught up.</strong><p>Important updates will show up here.</p></div>}
    </section></main>;
}
