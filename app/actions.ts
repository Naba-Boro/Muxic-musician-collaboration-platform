"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase server secret is not configured.");
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function genericAuthError() {
  return "We couldn’t sign you in with those details. Check them and try again.";
}

function appSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const fallbackUrl = process.env.NODE_ENV === "production"
    ? "https://muxic-musician-collaboration-platform.onrender.com"
    : "http://localhost:3000";
  return (configuredUrl || fallbackUrl).replace(/\/+$/, "");
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/?error=Supabase+is+not+connected+yet.+Set+up+the+project+credentials+in+.env.local.");

  const identifier = clean(formData.get("identifier")).toLowerCase();
  const password = clean(formData.get("password"));
  if (!identifier || !password) redirect("/?error=Enter+your+email+or+username+and+password.");

  let email = identifier;
  if (!identifier.includes("@")) {
    try {
      const admin = adminClient();
      const { data, error } = await admin
        .from("login_aliases")
        .select("email")
        .eq("normalized_username", identifier)
        .maybeSingle();
      if (error || !data?.email) redirect(`/?error=${encodeURIComponent(genericAuthError())}`);
      email = data.email;
    } catch {
      redirect(`/?error=${encodeURIComponent(genericAuthError())}`);
    }
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/?error=${encodeURIComponent(genericAuthError())}`);
  redirect("/opportunities");
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/signup?error=Supabase+is+not+connected+yet.+Set+up+the+project+credentials+in+.env.local.");

  const email = clean(formData.get("email")).toLowerCase();
  const username = clean(formData.get("username")).toLowerCase();
  const fullName = clean(formData.get("fullName"));
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state"));
  const country = clean(formData.get("country"));
  const specialtyChoice = clean(formData.get("mainSpecialty"));
  const mainSpecialty = specialtyChoice === "Other" ? clean(formData.get("mainSpecialtyOther")) : specialtyChoice;
  const genreChoices = formData.getAll("genre").map((item) => clean(item)).filter(Boolean);
  const genres = [...new Set(genreChoices.map((item) => item === "Other" ? clean(formData.get("genreOther")) : item).filter(Boolean))];
  const selectedSecondarySpecialties = formData.getAll("secondarySpecialty").map((item) => clean(item)).filter(Boolean);
  const additionalSpecialty = clean(formData.get("secondarySpecialtiesOther"));
  const secondarySpecialties = [...new Set(selectedSecondarySpecialties.map((item) => item === "Other" ? additionalSpecialty : item).filter(Boolean))];
  const additionalGenre = clean(formData.get("genreOther"));
  const password = clean(formData.get("password"));
  const demo = formData.get("demo");
  const avatarValue = formData.get("avatar");
  const avatar = avatarValue instanceof File && avatarValue.size > 0 ? avatarValue : null;
  const bio = clean(formData.get("bio"));
  const durationSeconds = Number(clean(formData.get("demoDuration")));
  const isAdult = formData.get("ageConfirmed") === "on";

  if (!email || !username || !fullName || !city || !state || !country || !mainSpecialty || !genres.length || password.length < 8 || !(demo instanceof File) || !demo.size || !isAdult) {
    redirect("/signup?error=Complete+all+required+fields+and+upload+one+demo.");
  }
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    redirect("/signup?error=Choose+a+username+with+3%E2%80%9324+letters%2C+numbers%2C+or+underscores.");
  }
  if (secondarySpecialties.length > 6 || new Set(secondarySpecialties).size !== secondarySpecialties.length) {
    redirect("/signup?error=Choose+up+to+6+different+secondary+specialties.");
  }
  if ((selectedSecondarySpecialties.includes("Other") && !additionalSpecialty) || (genreChoices.includes("Other") && !additionalGenre) || additionalSpecialty.length > 80 || additionalGenre.length > 80) {
    redirect("/signup?error=Complete+your+custom+specialty+or+genre.");
  }
  const allowedSpecialties = new Set(["Vocalist / singer", "Instrumentalist", "Songwriter", "Lyricist", "Composer", "Music producer", "Sound engineer", "Mixing engineer", "Mastering engineer", "Arranger", "Beatmaker", "DJ", "Other"]);
  const allowedGenres = new Set(["Pop", "Rock", "Indie", "Hip-hop", "Electronic", "Classical", "Jazz", "Folk", "Film music", "Other"]);
  if (!allowedSpecialties.has(specialtyChoice) || selectedSecondarySpecialties.some((item) => !allowedSpecialties.has(item)) || genreChoices.some((item) => !allowedGenres.has(item))) {
    redirect("/signup?error=Choose+your+specialties+and+genres+from+the+available+options.");
  }
  if (bio.length > 1200) redirect("/signup?error=Keep+your+musician+bio+under+1%2C200+characters.");
  const allowedTypes = new Set(["audio/mpeg", "audio/mp4", "audio/x-m4a"]);
  if (!allowedTypes.has(demo.type) || demo.size > 15 * 1024 * 1024) {
    redirect("/signup?error=Upload+an+MP3+or+M4A+demo+up+to+15+MB.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 60) {
    redirect("/signup?error=Your+demo+must+be+60+seconds+or+less.");
  }
  if (avatar && (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type) || avatar.size > 256 * 1024)) {
    redirect("/signup?error=Upload+a+JPG%2C+PNG%2C+or+WebP+profile+photo+up+to+256+KB.");
  }

  let admin: ReturnType<typeof adminClient>;
  try {
    admin = adminClient();
  } catch {
    redirect("/signup?error=Supabase+server+credentials+are+not+set+up+yet.");
  }

  const supabase = await createServerClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName },
      emailRedirectTo: `${appSiteUrl()}/auth/confirm-signup`,
    },
  });
  const userId = signUpData.user?.id;
  if (signUpError || !userId || !signUpData.user?.identities?.length) {
    redirect("/signup?error=We+couldn%E2%80%99t+create+your+account.+Check+your+details+or+try+signing+in.");
  }
  const extension = demo.type === "audio/mpeg" ? "mp3" : "m4a";
  const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const avatarPath = avatar ? `${userId}/${crypto.randomUUID()}.${avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg"}` : null;
  const { error: uploadError } = await admin.storage.from("demos").upload(objectPath, demo, {
    contentType: demo.type,
    upsert: false,
  });
  if (uploadError) {
    await admin.auth.admin.deleteUser(userId);
    redirect("/signup?error=We+couldn%E2%80%99t+save+that+demo.+Please+try+again.");
  }
  if (avatar && avatarPath) {
    const { error: avatarUploadError } = await admin.storage.from("avatars").upload(avatarPath, avatar, {
      contentType: avatar.type,
      upsert: false,
    });
    if (avatarUploadError) {
      await admin.storage.from("demos").remove([objectPath]);
      await admin.auth.admin.deleteUser(userId);
      redirect("/signup?error=We+couldn%E2%80%99t+save+your+profile+photo.+Please+try+again.");
    }
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    auth_user_id: userId,
    username,
    display_name: fullName,
    city,
    state,
    country,
    main_specialty: mainSpecialty,
    secondary_specialties: secondarySpecialties,
    genres,
    bio,
    avatar_path: avatarPath,
    avatar_doodle: ["note-1", "note-2", "note-3", "note-4"][crypto.getRandomValues(new Uint32Array(1))[0] % 4],
    onboarding_completed: Boolean(signUpData.session),
  });
  if (profileError) {
    await admin.storage.from("demos").remove([objectPath]);
    if (avatarPath) await admin.storage.from("avatars").remove([avatarPath]);
    await admin.auth.admin.deleteUser(userId);
    const message = profileError.code === "23505" ? "That+username+is+already+taken." : "We+couldn%E2%80%99t+save+your+profile.+Please+try+again.";
    redirect(`/signup?error=${message}`);
  }

  const { error: demoError } = await admin.from("demos").insert({
    user_id: userId,
    object_path: objectPath,
    duration_seconds: durationSeconds,
    mime_type: demo.type,
    byte_size: demo.size,
    position: 1,
  });
  if (demoError) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.storage.from("demos").remove([objectPath]);
    if (avatarPath) await admin.storage.from("avatars").remove([avatarPath]);
    await admin.auth.admin.deleteUser(userId);
    redirect("/signup?error=We+couldn%E2%80%99t+save+your+demo.+Please+try+again.");
  }

  const { error: aliasError } = await admin.from("login_aliases").insert({
    user_id: userId,
    normalized_username: username,
    email,
  });
  if (aliasError) {
    await admin.from("demos").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.storage.from("demos").remove([objectPath]);
    if (avatarPath) await admin.storage.from("avatars").remove([avatarPath]);
    await admin.auth.admin.deleteUser(userId);
    redirect("/signup?error=That+username+is+already+taken.");
  }

  if (!signUpData.session) {
    redirect("/signup/check-email");
  }
  redirect("/opportunities");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function markNotificationsRead(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const notificationId = clean(formData.get("notificationId"));
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  if (notificationId) query = query.eq("id", notificationId);
  const { error } = await query;
  if (error) redirect("/notifications?error=We+couldn%E2%80%99t+update+that+notification.");
  redirect("/notifications");
}

export async function extendGigDeadline(formData: FormData) {
  const gigId = clean(formData.get("gigId"));
  const date = clean(formData.get("deadlineDate"));
  const time = clean(formData.get("deadlineTime")) || "23:59";
  const returnTo = clean(formData.get("returnTo"));
  const destination = returnTo === "/my-opportunities" || (/^[0-9a-f-]{36}$/i.test(gigId) && returnTo === "/my-opportunities/" + gigId) ? returnTo : "/notifications";
  const deadlineAt = new Date(`${date}T${time}:00+05:30`);
  if (!isSupabaseConfigured()) redirect(destination + "?error=Connect+Supabase+before+extending+a+deadline.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (!Number.isFinite(deadlineAt.getTime()) || deadlineAt.getTime() <= Date.now()) redirect(destination + "?error=Choose+a+future+deadline.");
  const { error } = await supabase.rpc("extend_gig_deadline", { target_gig: gigId, new_deadline: deadlineAt.toISOString() });
  if (error) redirect(destination + "?error=This+gig+can%E2%80%99t+be+extended.+Its+deadline+may+have+passed+or+a+contributor+may+already+be+accepted.");
  redirect(destination + "?message=Gig+deadline+extended.");
}

export async function closeGig(formData: FormData) {
  const gigId = clean(formData.get("gigId"));
  const returnTo = clean(formData.get("returnTo"));
  const destination = returnTo === "/my-opportunities" ? returnTo : /^[0-9a-f-]{36}$/i.test(gigId) ? "/my-opportunities/" + gigId : "/my-opportunities";
  if (!isSupabaseConfigured()) redirect(destination + "?error=Connect+Supabase+before+closing+an+opportunity.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("close_gig", { target_gig: gigId });
  if (error) redirect(destination + "?error=This+opportunity+couldn%E2%80%99t+be+closed.");
  redirect(destination + "?message=Opportunity+closed.+Applicants+were+notified.");
}

export async function requestPasswordReset(formData: FormData) {
  const identifier = clean(formData.get("identifier")).toLowerCase();
  if (!identifier) redirect("/forgot-password?error=Enter+your+email+or+username.");
  if (!isSupabaseConfigured()) redirect("/forgot-password?error=Password+reset+is+temporarily+unavailable.+Try+again+later.");

  let email: string | null = null;
  let lookupFailed = false;
  try {
    const admin = adminClient();
    const lookup = admin.from("login_aliases").select("email");
    const { data, error: lookupError } = identifier.includes("@")
      ? await lookup.eq("email", identifier).maybeSingle()
      : await lookup.eq("normalized_username", identifier).maybeSingle();
    lookupFailed = Boolean(lookupError);
    email = data?.email ?? null;
  } catch {
    lookupFailed = true;
  }
  if (lookupFailed) redirect("/forgot-password?error=Password+reset+is+temporarily+unavailable.+Try+again+later.");
  if (!email) redirect("/forgot-password?message=If+an+account+matches+that+email+or+username%2C+we%E2%80%99ve+sent+a+reset+link.+Check+your+inbox+and+spam+folder.");

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appSiteUrl()}/auth/recovery`,
  });
  if (error) redirect("/forgot-password?error=We+couldn%E2%80%99t+send+a+reset+email.+Try+again+later.");
  redirect("/forgot-password?message=If+an+account+matches+that+email+or+username%2C+we%E2%80%99ve+sent+a+reset+link.+Check+your+inbox+and+spam+folder.");
}

export async function updatePassword(formData: FormData) {
  const password = clean(formData.get("password"));
  const confirmation = clean(formData.get("confirmPassword"));
  if (password.length < 8) redirect("/reset-password?error=Use+at+least+8+characters.");
  if (password !== confirmation) redirect("/reset-password?error=The+passwords+don%E2%80%99t+match.+Check+both+fields+and+try+again.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=Your+reset+link+has+expired.+Request+a+new+one+and+open+it+on+this+device.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/forgot-password?error=Your+reset+link+has+expired.+Request+a+new+one+and+open+it+on+this+device.");
  redirect("/?message=Your+password+has+been+updated.+Sign+in+to+continue.");
}

export async function createGig(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/opportunities/new?error=Connect+Supabase+before+posting+an+opportunity.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const kind = clean(formData.get("kind"));
  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const expectations = clean(formData.get("expectations"));
  const specialtyChoice = clean(formData.get("requiredSpecialty"));
  const requiredSpecialty = specialtyChoice === "Other" ? clean(formData.get("requiredSpecialtyOther")) : specialtyChoice;
  const estimatedDuration = clean(formData.get("estimatedDuration"));
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state"));
  const country = clean(formData.get("country")) || "India";
  const remoteAllowed = formData.get("remoteAllowed") === "on";
  const date = clean(formData.get("deadlineDate"));
  const time = clean(formData.get("deadlineTime")) || "23:59";
  const deadlineAt = new Date(`${date}T${time}:00+05:30`);
  const paymentRaw = clean(formData.get("paymentAmount"));
  const payment = kind === "hiring" ? Number(paymentRaw) : null;

  if (!title || !description || !expectations || !requiredSpecialty || !estimatedDuration || !city || !state || !date || !Number.isFinite(deadlineAt.getTime()) || deadlineAt.getTime() <= Date.now()) {
    redirect("/opportunities/new?error=Complete+the+required+fields+and+choose+a+future+deadline.");
  }
  if (kind !== "hiring" && kind !== "collaboration") redirect("/opportunities/new?error=Choose+collaboration+or+hiring.");
  if (kind === "hiring" && (!Number.isFinite(payment) || payment === null || payment <= 0)) {
    redirect("/opportunities/new?error=Enter+a+fixed+payment+amount+in+rupees+for+hiring.");
  }

  const { data, error } = await supabase.from("gigs").insert({
    poster_id: user.id,
    title,
    description,
    expectations,
    required_specialty: requiredSpecialty,
    estimated_duration: estimatedDuration,
    kind,
    payment_amount_inr: payment,
    city,
    state,
    country,
    remote_allowed: remoteAllowed,
    deadline_at: deadlineAt.toISOString(),
  }).select("id").single();
  if (error || !data) redirect("/opportunities/new?error=We+couldn%E2%80%99t+post+that+opportunity.+Please+check+your+details.");
  redirect(`/opportunities/${data.id}`);
}

export async function applyToGig(formData: FormData) {
  const gigId = clean(formData.get("gigId"));
  const message = clean(formData.get("message"));
  if (!isSupabaseConfigured()) redirect("/?error=Connect+Supabase+before+applying.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (!gigId || !message || message.length > 2000) redirect(`/opportunities/${gigId}?error=Write+a+short+application+message.`);
  const { error } = await supabase.from("applications").insert({ gig_id: gigId, applicant_id: user.id, message });
  if (error) redirect(`/opportunities/${gigId}?error=We+couldn%E2%80%99t+submit+your+application.+The+gig+may+be+closed+or+you+may+have+already+applied.`);
  redirect("/applications?message=Your+application+was+sent.");
}

export async function decideApplication(formData: FormData) {
  const applicationId = clean(formData.get("applicationId"));
  const gigId = clean(formData.get("gigId"));
  const decision = clean(formData.get("decision"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("decide_application", { target_application: applicationId, decision });
  const base = /^[0-9a-f-]{36}$/i.test(gigId) ? `/my-opportunities/${gigId}` : "/my-opportunities";
  if (error) redirect(`${base}?error=We+couldn%E2%80%99t+update+that+application.`);
  redirect(`${base}?message=Application+updated.`);
}

export async function withdrawApplication(formData: FormData) {
  const applicationId = clean(formData.get("applicationId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("withdraw_application", { target_application: applicationId });
  if (error) redirect("/applications?error=That+application+can%E2%80%99t+be+withdrawn.");
  redirect("/applications?message=Application+withdrawn.");
}

export async function blockUser(formData: FormData) {
  const blockedId = clean(formData.get("blockedId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (!blockedId || blockedId === user.id) redirect("/discover");
  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
  if (error) redirect("/settings/blocks?error=We+couldn%E2%80%99t+block+that+account.");
  redirect("/settings/blocks?message=Account+blocked.+Their+profile+and+gigs+are+hidden+from+you.");
}

export async function unblockUser(formData: FormData) {
  const blockedId = clean(formData.get("blockedId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
  if (error) redirect("/settings/blocks?error=We+couldn%E2%80%99t+unblock+that+account.");
  redirect("/settings/blocks?message=Account+unblocked.");
}

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const mainSpecialty = clean(formData.get("mainSpecialty"));
  const secondarySpecialties = clean(formData.get("secondarySpecialties")).split(",").map((item) => item.trim()).filter(Boolean);
  const genres = clean(formData.get("genres")).split(",").map((item) => item.trim()).filter(Boolean);
  const displayName = clean(formData.get("displayName"));
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state"));
  const country = clean(formData.get("country"));
  if (!displayName || !city || !state || !country || !mainSpecialty || !genres.length || secondarySpecialties.length > 6) redirect("/settings/profile?error=Complete+your+basic+profile+details+and+choose+up+to+6+secondary+specialties.");
  const { error } = await supabase.from("profiles").update({
    display_name: displayName,
    city,
    state,
    country,
    main_specialty: mainSpecialty,
    secondary_specialties: secondarySpecialties,
    genres,
    bio: clean(formData.get("bio")),
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) redirect("/settings/profile?error=We+couldn%E2%80%99t+save+your+profile.");
  redirect("/settings/profile?message=Profile+saved.");
}

export async function createProposal(formData: FormData) {
  const recipientId = clean(formData.get("recipientId"));
  const kind = clean(formData.get("kind"));
  const topic = clean(formData.get("topic"));
  const body = clean(formData.get("body"));
  if (!isSupabaseConfigured()) redirect("/proposals?error=Connect+Supabase+before+sending+a+proposal.");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (!/^[0-9a-f-]{36}$/i.test(recipientId)) redirect("/proposals?error=Choose+a+musician+before+sending+a+proposal.");
  const composePath = `/proposals/new?to=${encodeURIComponent(recipientId)}`;
  if (!["collaboration", "hiring"].includes(kind) || !topic || topic.length > 150 || !body || body.length > 10000) redirect(`${composePath}&error=Complete+the+required+fields+and+keep+the+topic+under+150+characters.`);
  const { data, error } = await supabase.rpc("create_proposal", {
    target_recipient: recipientId,
    proposal_kind: kind,
    proposal_topic: topic,
    opening_message: body,
  });
  if (error || !data) redirect(`${composePath}&error=We+couldn%E2%80%99t+send+that+proposal.+Review+the+details+and+try+again.`);
  redirect(`/proposals/${data}`);
}

export async function replyToProposal(formData: FormData) {
  const proposalId = clean(formData.get("proposalId"));
  const body = clean(formData.get("body"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("proposal_messages").insert({ proposal_id: proposalId, sender_id: user.id, body });
  if (error) redirect(`/proposals/${proposalId}?error=You+can%E2%80%99t+reply+to+this+proposal+right+now.`);
  redirect(`/proposals/${proposalId}`);
}

export async function acceptProposal(formData: FormData) {
  const proposalId = clean(formData.get("proposalId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data, error } = await supabase.rpc("accept_proposal", { target_proposal: proposalId });
  if (error) redirect(`/proposals/${proposalId}?error=We+couldn%E2%80%99t+accept+this+proposal.`);
  if (data) redirect(`/projects/${data}`);
  redirect(`/proposals/${proposalId}?message=Your+acceptance+is+recorded.+The+project+starts+when+the+other+person+also+accepts.`);
}

export async function terminateProposal(formData: FormData) {
  const proposalId = clean(formData.get("proposalId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("terminate_proposal", { target_proposal: proposalId });
  if (error) redirect(`/proposals/${proposalId}?error=This+proposal+can%E2%80%99t+be+terminated.`);
  redirect(`/proposals/${proposalId}?message=Proposal+terminated.`);
}

export async function deleteProposalHistory(formData: FormData) {
  const proposalId = clean(formData.get("proposalId"));
  if (!isSupabaseConfigured()) redirect("/proposals");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("proposal_history_hidden").insert({ proposal_id: proposalId, user_id: user.id });
  if (error) redirect(`/proposals/${proposalId}?error=This+proposal+history+couldn%E2%80%99t+be+deleted.`);
  redirect("/proposals?message=Deleted+from+your+proposal+history.");
}

export async function completeProject(formData: FormData) {
  const projectId = clean(formData.get("projectId"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("complete_project", { target_project: projectId });
  if (error) redirect(`/projects/${projectId}?error=Only+the+poster+can+complete+an+active+project.`);
  redirect(`/projects/${projectId}?message=Project+marked+complete.`);
}

export async function recordProjectExit(formData: FormData) {
  const projectId = clean(formData.get("projectId"));
  const targetUser = clean(formData.get("targetUser"));
  const category = clean(formData.get("category"));
  const reason = clean(formData.get("reason"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (reason.length < 100) redirect(`/projects/${projectId}?error=Please+provide+a+detailed+reason+of+at+least+100+characters.`);
  const { error } = await supabase.rpc("record_project_exit", {
    target_project: projectId,
    target_user: targetUser,
    reason_category: category,
    reason_details: reason,
  });
  if (error) redirect(`/projects/${projectId}?error=We+couldn%E2%80%99t+record+that+project+change.`);
  redirect(`/projects/${projectId}?message=Project+history+updated.`);
}

export async function respondToProjectExit(formData: FormData) {
  const projectId = clean(formData.get("projectId"));
  const recordId = clean(formData.get("recordId"));
  const response = clean(formData.get("response"));
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.rpc("respond_to_project_exit", { target_record: recordId, response_text: response });
  if (error) redirect(`/projects/${projectId}?error=We+couldn%E2%80%99t+save+your+response.`);
  redirect(`/projects/${projectId}?message=Your+response+was+saved.`);
}

export async function deleteProjectHistoryCopy(formData: FormData) {
  const projectId = clean(formData.get("projectId"));
  const recordId = clean(formData.get("recordId"));
  if (!isSupabaseConfigured()) redirect("/projects");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("project_exit_record_hidden").insert({ record_id: recordId, user_id: user.id });
  if (error) redirect(`/projects/${projectId}?error=We+couldn%E2%80%99t+remove+your+copy.`);
  redirect(`/projects/${projectId}?message=Removed+from+your+private+history.`);
}
