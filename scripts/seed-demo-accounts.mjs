import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const batch = "muxics-demo-five-2026-10";
const expectedProjectRef = "letelzhqenbyyibegayu";
const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(root, "demo-assets");
const profiles = [
  {
    username: "demo_ananya_rao", email: "muxics.demo.ananya.rao@example.com", name: "Ananya Rao",
    city: "Bengaluru", state: "Karnataka", specialty: "Vocalist / singer",
    secondary: ["Songwriter", "Lyricist", "Composer"], genres: ["Indie", "Classical", "Pop"], doodle: "note-1",
    bio: "Fictional Muxics demo profile. Bengaluru vocalist blending Hindustani classical phrasing with indie-pop songwriting. Profile details and the generated audio samples are placeholders for product walkthroughs.",
    avatar: "ananya-rao.jpg", demos: ["ananya_alaap_texture.m4a", "ananya_indie_hook.m4a"],
    credits: ["DEMO · Monsoon Raga Sessions", "DEMO · Paper Boats Indie EP"],
    gig: { title: "[DEMO] Lead vocal textures for an indie-folk single", description: "Looking for expressive lead vocals and a few layered harmonies for a fictional Bengaluru indie-folk production.", expectations: "Record a lead pass, two harmony layers, and dry 24-bit WAV stems. This is sample listing content for a Muxics walkthrough.", specialty: "Vocalist / singer", duration: "1 week", kind: "hiring", payment: 9000, remote: true },
  },
  {
    username: "demo_kabir_sen", email: "muxics.demo.kabir.sen@example.com", name: "Kabir Sen",
    city: "New Delhi", state: "Delhi", specialty: "Instrumentalist",
    secondary: ["Music producer", "Arranger"], genres: ["Indie", "Pop", "Jazz"], doodle: "note-2",
    bio: "Fictional Muxics demo profile. Delhi-based session bassist working across neo-soul, indie pop, and film cues. Profile details and the generated audio samples are placeholders for product walkthroughs.",
    avatar: "kabir-sen.jpg", demos: ["kabir_bass_groove.m4a", "kabir_live_room_take.m4a"],
    credits: ["DEMO · Blue Hour Bass Sessions", "DEMO · Sunday Room Live Takes"],
    gig: { title: "[DEMO] Bass session for a neo-soul pop track", description: "Seeking a melodic five-string bass performance for a fictional neo-soul Hindi pop arrangement.", expectations: "Track a verse and chorus bass part, include one alternate take, and deliver dry 24-bit WAV stems. Sample listing only.", specialty: "Instrumentalist", duration: "5 days", kind: "hiring", payment: 7500, remote: true },
  },
  {
    username: "demo_meera_iyer", email: "muxics.demo.meera.iyer@example.com", name: "Meera Iyer",
    city: "Chennai", state: "Tamil Nadu", specialty: "Mixing engineer",
    secondary: ["Sound engineer", "Music producer", "Mastering engineer"], genres: ["Electronic", "Indie", "Classical"], doodle: "note-3",
    bio: "Fictional Muxics demo profile. Chennai producer and mix engineer shaping spacious, detailed arrangements for independent artists. Profile details and the generated audio samples are placeholders for product walkthroughs.",
    avatar: "meera-iyer.jpg", demos: ["meera_ambient_pad.m4a", "meera_mix_reference.m4a"],
    credits: ["DEMO · Glass Garden Mix Notes", "DEMO · Salt Air Ambient Recordings"],
    gig: { title: "[DEMO] Mix and master a four-track indie EP", description: "A fictional four-song indie EP needs a warm, vocal-forward mix and a consistent master sequence.", expectations: "Prepare one mix per song, include two revision rounds, and deliver 24-bit WAV masters plus instrumental prints. Sample listing only.", specialty: "Mixing engineer", duration: "2 weeks", kind: "hiring", payment: 18000, remote: true },
  },
  {
    username: "demo_dhruv_sharma", email: "muxics.demo.dhruv.sharma@example.com", name: "Dhruv Sharma",
    city: "Mumbai", state: "Maharashtra", specialty: "Instrumentalist",
    secondary: ["Songwriter", "Composer", "Arranger"], genres: ["Folk", "Indie", "Classical"], doodle: "note-4",
    bio: "Fictional Muxics demo profile. Mumbai guitarist and songwriter bringing acoustic textures to folk, indie, and film-inspired music. Profile details and the generated audio samples are placeholders for product walkthroughs.",
    avatar: "dhruv-sharma.jpg", demos: ["dhruv_acoustic_riff.m4a", "dhruv_songwriter_demo.m4a"],
    credits: ["DEMO · Harbour Light Acoustic Cuts", "DEMO · Small Hours Songbook"],
    gig: { title: "[DEMO] Acoustic guitar layers for a folk single", description: "Looking for intimate fingerstyle and light strummed layers for a fictional Mumbai folk production.", expectations: "Record two complementary guitar parts and one alternate texture pass. Share clean, time-aligned 24-bit WAV stems. Sample listing only.", specialty: "Instrumentalist", duration: "1 week", kind: "collaboration", payment: null, remote: false },
  },
  {
    username: "demo_raghav_menon", email: "muxics.demo.raghav.menon@example.com", name: "Raghav Menon",
    city: "Pune", state: "Maharashtra", specialty: "Music producer",
    secondary: ["Mixing engineer", "Beatmaker", "Composer"], genres: ["Pop", "Electronic", "Folk"], doodle: "note-1",
    bio: "Fictional Muxics demo profile. Pune-based producer building organic electronic arrangements and polished independent releases. Profile details and the generated audio samples are placeholders for product walkthroughs.",
    avatar: "raghav-menon.jpg", demos: ["raghav_indie_production.m4a", "raghav_mix_print.m4a"],
    credits: ["DEMO · Amber Lines Production Work", "DEMO · City Window Mix Prints"],
    gig: { title: "[DEMO] Producer for an Indian classical fusion track", description: "A fictional fusion single needs an arrangement that leaves room for acoustic vocals and a live percussion part.", expectations: "Build a session arrangement, provide a rough mix and consolidated stems, and include two revision rounds. Sample listing only.", specialty: "Music producer", duration: "10 days", kind: "hiring", payment: 12000, remote: true },
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}; load the local environment before seeding.`);
  return value;
}

const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const secret = requiredEnv("SUPABASE_SECRET_KEY");
const ref = new URL(url).hostname.split(".")[0];
if (ref !== expectedProjectRef || process.argv[2] !== `--target-ref=${expectedProjectRef}`) {
  throw new Error(`Target mismatch. This seed is restricted to the reviewed project ${expectedProjectRef}; pass --target-ref=${expectedProjectRef}.`);
}

const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const demoPassword = `${randomBytes(24).toString("base64url")}aA7!`;

async function listUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) return users;
  }
}

async function assertOk(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const existingUsers = await listUsers();
const seeded = [];
for (const profile of profiles) {
  const existing = existingUsers.find((user) => user.email === profile.email);
  let user;
  if (existing && existing.app_metadata?.muxics_demo_batch !== batch) {
    throw new Error(`Refusing to reuse ${profile.email}; it exists but is not marked as this demo batch.`);
  }
  if (existing) {
    user = await assertOk(await supabase.auth.admin.updateUserById(existing.id, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, username: profile.username, full_name: profile.name },
    }), `Refresh demo login for ${profile.username}`);
  } else {
    user = await assertOk(await supabase.auth.admin.createUser({
      email: profile.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { username: profile.username, full_name: profile.name },
      app_metadata: { muxics_demo_batch: batch },
    }), `Create auth user for ${profile.username}`);
  }
  const userId = user.user?.id ?? user.id;
  if (!userId) throw new Error(`Supabase did not return an ID for ${profile.username}.`);
  seeded.push({ ...profile, id: userId });
}

for (const profile of seeded) {
  const avatarPath = `${profile.id}/demo-avatar.jpg`;
  const avatar = await readFile(path.join(assets, "avatars", profile.avatar));
  await assertOk(await supabase.storage.from("avatars").upload(avatarPath, avatar, { contentType: "image/jpeg", upsert: true }), `Upload avatar for ${profile.username}`);
  await assertOk(await supabase.from("profiles").upsert({
    id: profile.id, auth_user_id: profile.id, username: profile.username, display_name: profile.name,
    city: profile.city, state: profile.state, country: "India", main_specialty: profile.specialty,
    secondary_specialties: profile.secondary, genres: profile.genres, bio: profile.bio,
    avatar_path: avatarPath, avatar_doodle: profile.doodle, onboarding_completed: true,
  }, { onConflict: "id" }), `Save profile for ${profile.username}`);
  await assertOk(await supabase.from("login_aliases").upsert({
    user_id: profile.id, normalized_username: profile.username, email: profile.email,
  }, { onConflict: "user_id" }), `Save username login for ${profile.username}`);

  for (let index = 0; index < profile.demos.length; index += 1) {
    const filename = profile.demos[index];
    const objectPath = `${profile.id}/${filename}`;
    const audio = await readFile(path.join(assets, "audio", filename));
    await assertOk(await supabase.storage.from("demos").upload(objectPath, audio, { contentType: "audio/mp4", upsert: true }), `Upload ${filename}`);
    await assertOk(await supabase.from("demos").upsert({
      user_id: profile.id, object_path: objectPath, duration_seconds: 10, mime_type: "audio/mp4",
      byte_size: audio.byteLength, position: index + 1,
    }, { onConflict: "user_id,position" }), `Save demo metadata for ${profile.username}`);
  }

  const links = profile.credits.map((title, index) => ({
    user_id: profile.id, title, platform: "Fictional demo credit", position: index + 1,
    url: `https://example.com/muxics-demo/${profile.username}/work-${index + 1}`,
  }));
  await assertOk(await supabase.from("portfolio_links").delete().eq("user_id", profile.id).in("title", profile.credits), `Refresh demo credits for ${profile.username}`);
  await assertOk(await supabase.from("portfolio_links").insert(links), `Save demo credits for ${profile.username}`);

  const gig = profile.gig;
  const title = gig.title;
  const { data: priorGig, error: priorGigError } = await supabase.from("gigs").select("id").eq("poster_id", profile.id).eq("title", title).maybeSingle();
  if (priorGigError) throw new Error(`Check demo opportunity for ${profile.username}: ${priorGigError.message}`);
  if (!priorGig) {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await assertOk(await supabase.from("gigs").insert({
      poster_id: profile.id, title, description: gig.description, expectations: gig.expectations,
      required_specialty: gig.specialty, estimated_duration: gig.duration, kind: gig.kind,
      payment_amount_inr: gig.payment, city: profile.city, state: profile.state, country: "India",
      remote_allowed: gig.remote, deadline_at: deadline, status: "open",
    }), `Publish demo opportunity for ${profile.username}`);
  }
}

console.log(JSON.stringify({
  projectRef: ref,
  batch,
  accounts: seeded.map(({ username, email, name }) => ({ username, email, name })),
  password: demoPassword,
  note: "Fictional demo data; all profile images and audio samples are generated placeholders.",
}, null, 2));
