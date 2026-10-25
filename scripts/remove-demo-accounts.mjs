import { createClient } from "@supabase/supabase-js";

const batch = "muxics-demo-five-2026-10";
const expectedProjectRef = "letelzhqenbyyibegayu";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Load NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before cleanup.");
const ref = new URL(url).hostname.split(".")[0];
if (ref !== expectedProjectRef || process.argv[2] !== `--target-ref=${expectedProjectRef}`) {
  throw new Error(`Target mismatch. Cleanup is restricted to ${expectedProjectRef}; pass --target-ref=${expectedProjectRef}.`);
}

const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
async function data(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const users = [];
for (let page = 1; ; page += 1) {
  const result = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  const pageUsers = await data(result, "List auth users");
  users.push(...pageUsers.users);
  if (pageUsers.users.length < 100) break;
}
const demoUsers = users.filter((user) => user.app_metadata?.muxics_demo_batch === batch);
if (demoUsers.length === 0) {
  console.log(`No accounts marked ${batch} exist in ${ref}.`);
  process.exit(0);
}
const ids = demoUsers.map((user) => user.id);

const profiles = await data(await supabase.from("profiles").select("id,avatar_path").in("id", ids), "Load demo profiles");
const gigs = await data(await supabase.from("gigs").select("id,poster_id").in("poster_id", ids), "Load demo opportunities");
const gigIds = gigs.map((gig) => gig.id);
const gigApplications = gigIds.length
  ? await data(await supabase.from("applications").select("id,applicant_id,gig_id").in("gig_id", gigIds), "Check demo gig applications")
  : [];
const demoApplications = await data(await supabase.from("applications").select("id,applicant_id,gig_id").in("applicant_id", ids), "Check demo applications");
const allApplicationGigIds = [...new Set(demoApplications.map((application) => application.gig_id))];
const externalApplicationGigs = allApplicationGigIds.length
  ? await data(await supabase.from("gigs").select("id,poster_id").in("id", allApplicationGigIds), "Check application owners")
  : [];
const proposals = await data(await supabase.from("proposals").select("id,creator_id,recipient_id").or(`creator_id.in.(${ids.join(",")}),recipient_id.in.(${ids.join(",")})`), "Check demo proposals");
const memberships = await data(await supabase.from("project_members").select("project_id,user_id").in("user_id", ids), "Check demo project memberships");
const projectIds = [...new Set(memberships.map((member) => member.project_id))];
const allMembers = projectIds.length
  ? await data(await supabase.from("project_members").select("project_id,user_id").in("project_id", projectIds), "Check project participants")
  : [];

const blockers = [];
if (gigApplications.some((application) => !ids.includes(application.applicant_id))) blockers.push("a demo-owned opportunity has an application from a non-demo account");
if (externalApplicationGigs.some((gig) => !ids.includes(gig.poster_id))) blockers.push("a demo account applied to an opportunity owned by a non-demo account");
if (proposals.some((proposal) => !ids.includes(proposal.creator_id) || !ids.includes(proposal.recipient_id))) blockers.push("a proposal includes a non-demo participant");
if (allMembers.some((member) => !ids.includes(member.user_id))) blockers.push("a shared project includes a non-demo participant");
if (blockers.length) {
  throw new Error(`Cleanup stopped without deleting anything because ${[...new Set(blockers)].join("; ")}. Resolve those demo interactions first.`);
}

const demoRows = await data(await supabase.from("demos").select("object_path").in("user_id", ids), "Load demo audio paths");
const avatarPaths = profiles.map((profile) => profile.avatar_path).filter(Boolean);
if (demoRows.length) await data(await supabase.storage.from("demos").remove(demoRows.map((row) => row.object_path)), "Remove demo audio files");
if (avatarPaths.length) await data(await supabase.storage.from("avatars").remove(avatarPaths), "Remove demo avatar files");

if (projectIds.length) await data(await supabase.from("projects").delete().in("id", projectIds), "Delete demo-only projects");
if (proposals.length) await data(await supabase.from("proposals").delete().in("id", proposals.map((proposal) => proposal.id)), "Delete demo-only proposals");
if (gigIds.length) await data(await supabase.from("gigs").delete().in("id", gigIds), "Delete demo opportunities");
if (demoApplications.length) await data(await supabase.from("applications").delete().in("id", demoApplications.map((application) => application.id)), "Delete demo applications");
await data(await supabase.from("portfolio_links").delete().in("user_id", ids), "Delete demo portfolio links");
await data(await supabase.from("profiles").delete().in("id", ids), "Delete demo profile records");
for (const user of demoUsers) await data(await supabase.auth.admin.deleteUser(user.id), `Delete demo login ${user.email}`);

console.log(JSON.stringify({ projectRef: ref, removedAccounts: demoUsers.map((user) => user.email), removedProjects: projectIds.length, removedOpportunities: gigIds.length }, null, 2));
