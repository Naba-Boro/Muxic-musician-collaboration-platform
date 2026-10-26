import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function MyProfileRedirect() {
  // This route depends on the current user's session, so defer Supabase access
  // until a real request instead of evaluating it during static prerendering.
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (!profile?.username) redirect("/settings/profile");
  redirect(`/profiles/${profile.username}`);
}
