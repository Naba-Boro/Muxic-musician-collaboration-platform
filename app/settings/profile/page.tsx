import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "../../actions";

export const instant = false;

type Props = { searchParams: Promise<{ message?: string; error?: string }> };

export default async function ProfileSettingsPage({ searchParams }: Props) {
  await connection();
  const { message, error } = await searchParams;
  if (!isSupabaseConfigured()) return <main className="simple-auth-page"><Link className="brand" href="/"><span className="brand-icon">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><section className="simple-auth-card"><h1>Profile settings</h1><p>Connect Supabase to edit your profile.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/signup?error=Complete+your+profile+to+continue.");
  return <main className="signup-layout"><header className="signup-header"><Link className="brand" href="/opportunities"><span className="brand-icon" aria-hidden="true">♫</span><span>Muxics<span className="brand-dot">.</span></span></Link><Link className="small-link" href="/settings/blocks">Manage blocked accounts →</Link></header><section className="signup-content"><div className="signup-intro"><span className="eyebrow">YOUR CORNER</span><h1>Profile<br /><em>settings.</em></h1><p>Your profile is visible to signed-in members, except people you’ve blocked.</p></div>{message && <p className="notice notice-success" role="status">{message}</p>}{error && <p className="notice notice-error" role="alert">{error}</p>}<form className="signup-form" action={updateProfile}><div className="profile-settings-head"><div className={`profile-doodle ${profile.avatar_doodle}`} aria-hidden="true">♫</div><div><strong>Your musical doodle</strong><p>You can add a profile picture in a later profile update.</p></div></div><div className="form-grid"><div className="field"><label htmlFor="displayName">Name</label><input id="displayName" name="displayName" defaultValue={profile.display_name} required /></div><div className="field"><label>Username</label><input value={profile.username} readOnly /></div><div className="field"><label htmlFor="city">City</label><input id="city" name="city" defaultValue={profile.city} required /></div><div className="field"><label htmlFor="state">State</label><input id="state" name="state" defaultValue={profile.state} required /></div><div className="field"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue={profile.country} required /></div><div className="field"><label htmlFor="mainSpecialty">Main specialty</label><input id="mainSpecialty" name="mainSpecialty" defaultValue={profile.main_specialty} required /></div></div><div className="field"><label htmlFor="secondarySpecialties">Secondary specialties <span className="optional">up to 6, comma separated</span></label><input id="secondarySpecialties" name="secondarySpecialties" defaultValue={(profile.secondary_specialties ?? []).join(", ")} /></div><div className="field"><label htmlFor="genres">Genres <span className="optional">comma separated</span></label><input id="genres" name="genres" defaultValue={(profile.genres ?? []).join(", ")} required /></div><div className="field"><label htmlFor="bio">About you <span className="optional">optional</span></label><textarea id="bio" name="bio" rows={4} maxLength={2000} defaultValue={profile.bio} /></div><button className="button button-primary signup-submit" type="submit">Save profile <span aria-hidden="true">→</span></button></form></section></main>;
}
