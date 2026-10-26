# Muxics Project Plan and Working Reference

This document captures the product direction, decisions, work completed or attempted, unresolved issues, and a practical order of work for the Muxics musician collaboration platform. It is intended as a restart point for future sessions. Update the status sections as work is verified.

## 1. Product goal

Build a usable musician collaboration platform where artists can create profiles, find opportunities and collaborators, send and receive proposals, and continue accepted work in a shared project space. The Stitch-generated UI is the visual direction, while implementation must remain consistent with the app's actual data model and planned feature scope. New design ideas should be evaluated on their merits and integrated only when their behavior can be supported coherently; don't silently remove useful ideas or ship controls that imply behavior the app doesn't provide.

Primary product principles:

- Make core journeys understandable and reliable before adding secondary features.
- Keep typography readable across desktop and mobile; tiny console-like labels must not be used for ordinary navigation, body copy, metadata, or controls.
- Preserve a consistent shell, navigation, spacing, and interaction language across routes.
- Keep privacy and account security intact, especially around unverified accounts, profile visibility, blocks, and password recovery.
- Verify actual behavior in the deployed environment; a successful local change or build does not by itself prove the deployed auth flow works.

## 2. Current deployment and environment context

- Public test deployment URL selected for signup email testing: `https://muxic-musician-collaboration-platform.onrender.com`.
- A Vercel deployment was previously reported working at commit `3fca1f5`.
- A later Render build failed while prerendering `/profile` because Supabase public environment variables were absent during build. The profile route was changed to defer session-dependent work to a request. A later deployment was reported successful (commit `4954a4`), but this does not establish that every subsequent auth change is deployed.
- A subsequent Vercel build failed prerendering `/signup/check-email` because runtime data was accessed outside Suspense. The page was changed to avoid reading request search parameters and to remain a static confirmation page. A later Render/Vercel build log still showed this error on an older commit; verify the actual latest deployment before assuming it is resolved.
- Local build verification may be blocked in this environment by missing Apple/Xcode command line developer tools. Record that limitation rather than treating an unrun build as passing.
- Supabase project settings are managed outside the repository. Code changes alone cannot correct an incorrect Site URL, redirect allowlist, email template, SMTP setting, or a stale email link.

## 3. Decisions already made

### Account creation and email verification

- Keep Supabase email confirmation enabled.
- Do not require a purchased custom domain for the current test setup.
- Use the Render app URL as the test URL for other people; localhost is only for local development.
- The user has a personal Gmail account, completed Gmail 2-step verification, and selected it for SMTP setup. Supabase warned that personal email providers are designed for personal rather than transactional delivery. SMTP was reported as successfully updated. Deliverability limits remain possible; a dedicated transactional provider/domain can be considered if real testing shows delivery problems.
- After signup sends a verification email, close the account-creation form and show a clear “Check your email” / verify-email confirmation screen. Do not imply the account is ready to use until verified.
- Signup should retain the new auth account and submitted profile/demo while waiting for confirmation; don't delete the user's account merely because Supabase did not create an immediate session.
- Unverified profiles and their assets should not be publicly discoverable. The repository has a migration intended to gate visibility until the account is verified/onboarded; confirm the migration is applied in Supabase and verify its policies against the live schema.

### Password recovery (required behavior)

The intended flow is deliberately simple:

1. From Sign in, user selects **Forgot password?**.
2. The account recovery page asks for the account email and sends a recovery email.
3. The user opens the email link and lands directly on a dedicated **Set new password** page.
4. The user enters and confirms a new password, submits it, receives a success message, and can sign in with the new password.

The recovery request page should not show a stepper, “Set a new password” shortcut, support card, or any other link that bypasses the email link. The reset page is reached only through a valid recovery callback/session. A valid link must not land on signup, show a signup verification warning, or be treated as an email-confirmation link.

### Navigation, profile menu, and typography

- A user could not find Log out. The profile icon should open a menu with **Profile**, **Settings**, and **Log out**; it should not navigate directly to Profile on click. Verify keyboard/touch accessibility and sign-out behavior.
- Increase undersized text across the app to comfortable, ordinary reading sizes (the user compared the scale to LinkedIn). This includes global top navigation, notification and music/status controls, helper text, tags, and page-specific labels. Keep compact visual labels only where appropriate and adjust layout/wrapping so the larger type does not break cards or mobile screens.
- This typography request applies throughout the app, not just one page. Validate shared components and representative routes on desktop and mobile.

## 4. Work reported or present in the project

These items have been implemented or attempted in prior work, but must be checked against the current branch and deployed app before being called complete:

- Newer Stitch-inspired UI work has been applied to multiple areas. The conversation identified three distinct proposal views: the proposal list, a proposal review/response view, and a create-proposal view. Project list/detail and additional profile/settings/security/notification/auth screens were also designed or discussed. Treat each route as its own page and audit visually; do not infer that every screenshot is implemented just because related screens changed.
- Sign-in and sign-up were discussed as completed UI work, but their deployed behavior still needs end-to-end validation.
- Signup confirmation screen and signup callback route have been added/adjusted.
- Password reset request, recovery callback, and reset-password page have been worked on. The recovery handler supports Supabase `token_hash` verification and the legacy `code` exchange path.
- The Supabase recovery email template was reviewed. A direct token-hash link was recommended to route to `/auth/recovery` with `token_hash` and `type=recovery`, followed by verification and redirect to `/reset-password`. This is not yet proven in production: the user most recently reported that clicking the email link still opens signup with a verification-failed warning.
- Signup and recovery redirect routes have been listed in Supabase's allowed Redirect URLs for Render and localhost. The user showed these entries in a screenshot. Recheck that Site URL and the exact link destination are correct; allowlist entries do not prove the email template is using the intended destination.
- A profile route prerender issue was addressed by making the route request-dependent.
- A profile-menu component and related typography changes were requested. Verify actual behavior and breadth rather than assuming the whole app has been updated.
- The migration `supabase/migrations/202610260001_gate_unverified_profiles.sql` was added to protect unverified profile data. It must be applied to the intended Supabase project before relying on it.

Relevant implementation areas to inspect when resuming:

- Signup and password actions: `app/actions.ts`
- Auth UI: `app/auth/`
- Signup confirmation screen: `app/signup/check-email/`
- Signup callback: `app/auth/confirm-signup/`
- Recovery callback: `app/auth/recovery/`
- Legacy auth callback: `app/auth/callback/`
- Recovery request page: `app/forgot-password/`
- Set-password page: `app/reset-password/`
- Shared navigation/profile menu: `app/profile-menu.tsx` and `app/layout.tsx`
- Global styling: `app/globals.css`
- Supabase migrations: `supabase/migrations/`

## 5. Unresolved blocker: recovery link lands on signup

The latest user report: clicking the password reset link received by email opens the signup page and displays a verification-failed warning. This is a release blocker for account recovery and the immediate priority.

Likely failure points to distinguish with evidence:

1. **Wrong email template/link target.** The recovery template may still point at `{{ .ConfirmationURL }}` or a confirmation/signup route, or the edited template may not have been saved. Inspect the actual URL in a newly received email (redact `token_hash`, `code`, and all tokens before sharing).
2. **Wrong redirect parameter.** The app's reset request must pass `/auth/recovery` as `redirectTo`; the recovery template must use the corresponding Supabase redirect value or construct the direct `token_hash` URL correctly. Verify the exact URL sent by the latest deployed version.
3. **Wrong token type.** Recovery links must be verified as `type=recovery`, not `signup`/`email`. The callback should route valid recovery sessions to `/reset-password`.
4. **Wrong deployed commit or host.** Confirm the email link host is the intended Render URL and that the currently deployed commit contains the recovery handler. Don't validate against an email sent before deployment/template save; issue a new request after changes are live.
5. **Token already consumed or expired.** Supabase links are one-time/short-lived. Always test using a fresh link once, promptly, and do not open it in multiple clients.
6. **Supabase configuration mismatch.** Check Site URL, allowed redirect URLs, Auth email template, and SMTP status in the same Supabase project used by Render. Redirect allowlist entries must match the host/path exactly.
7. **Callback error handling.** A malformed/expired token should return to the recovery request page with a recovery-specific message, never to signup with a generic signup verification error.

Recovery debugging procedure:

1. Confirm the latest deployment is healthy and identify its commit.
2. In Supabase, inspect the **Reset Password** email template and save the intended link format only after verifying it points to `/auth/recovery`.
3. Confirm `NEXT_PUBLIC_SITE_URL` on Render is `https://muxic-musician-collaboration-platform.onrender.com` (no trailing slash), then redeploy if it changed.
4. From the deployed sign-in page, request one new reset email.
5. Inspect the destination URL structure without exposing its token. It should use the Render host and recovery callback, not `/signup`, `/auth/confirm-signup`, or a signup template.
6. Click the fresh link once. Expected: recovery callback verifies the token and redirects to `/reset-password` with an authenticated recovery session.
7. Submit a new password; verify success and sign in using it.
8. If it fails, capture: deployed commit, visible destination path (remove query values), exact page/error text, and whether the server log reports token verification or session exchange failure. Never share the reset link, token hash, auth code, cookies, or passwords.

## 6. Product scope and feature review

Stitch mockups contain interface ideas and apparent features that may go beyond the current implementation plan. Preserve them as candidates and assess before adding them. For every proposed addition, record: user problem solved, data required, authorization/privacy implications, backend work, edge cases, maintenance cost, and whether it is needed for a coherent core journey.

Potential feature areas visible in the designs or discussed:

- Proposal status filters and received/sent scopes.
- Direct musician-to-musician settlement terms, paid gig vs collaboration models, compensation splits, escrow language, payout states, and milestone verification.
- Automatically provisioned Shared Project Spaces after mutual acceptance, participant-only project discussions, audio/stem exchange, download access, and project completion confirmation.
- Audio previews, waveform/player controls, DAW details, technical specs, and lossless audio metadata.
- Notifications/feed filters, read/unread states, activity history, and routing preferences.
- Profile discovery, specialties/genres, past work, demos, external streaming links, availability and privacy settings.
- Blocked accounts, unblocking, and discovery/contact restrictions.
- Profile/account settings, notification preferences, and credential recovery.

Do not present financial protections (escrow, guaranteed payout, verified settlement, or payment release) as operational unless a real payment/escrow integration and its policies exist. Direct settlement and platform escrow are distinct models and must have clear user-facing terms. Similarly, avoid showing working-looking “download”, “sync”, “hash verified”, “DAW integration”, or “live session” claims unless the corresponding functionality exists and has been verified.

## 7. Recommended execution plan

### Phase 0 — Establish a verified baseline

- Identify current branch, changed files, current deployed host/commit, and active Supabase project.
- Confirm required environment variables exist in Render without printing secret values.
- Confirm Supabase Site URL, redirect allowlist, email confirmation toggle, recovery template, and SMTP configuration.
- Apply pending migrations to the correct non-production/test Supabase project first; confirm RLS and storage policies.
- Maintain separate test accounts/data from real users. The requested five complete demo accounts should be seeded only in the intended test project, with fictional profiles, safe demo assets, history, and opportunities; keep their credentials out of this plan and avoid production user data.

### Phase 1 — Fix and prove account lifecycle (highest priority)

- Finish signup confirmation end to end: submit signup, persist profile/demo, show confirmation screen, receive email, verify, reach onboarding/app, and confirm unverified data remains private beforehand.
- Fix password recovery end to end using the procedure in Section 5.
- Verify normal sign-in, sign-out, expired/invalid links, duplicate signup, resend behavior (if supported), and password update.
- Ensure signup verification errors and password-recovery errors have separate, accurate destinations/messages.
- Add no unrequested tests unless the user asks; use focused manual verification and production logs where feasible.

### Phase 2 — Global usability and navigation

- Audit every shared text style and make ordinary text readable at desktop and mobile sizes.
- Fix top navigation and notification/music/status controls first because they appear on many pages.
- Confirm the profile icon opens a menu with Profile, Settings, and Log out; keyboard navigation, outside click, mobile interaction, and sign-out redirect all work.
- Review wrapping, overflow, button dimensions, and card density after font changes.

### Phase 3 — Route-by-route design and core journeys

Audit and reconcile the current UI with Stitch designs, one route at a time. Prioritize:

1. Sign in, sign up, check-email, forgot-password, reset-password.
2. Discover/opportunities feed and opportunity details.
3. Create proposal, proposals list, proposal detail/review/respond.
4. Applications and my opportunities.
5. Projects list, project workspace/detail/chat.
6. Public profile, edit profile, profile settings, blocked accounts, notification settings, notifications feed.

For each route, document: intended user, entry points, primary action, data states (loading/empty/error/success), permissions, responsive layout, and links to the next step. Keep mocked or unavailable features explicitly non-operational instead of presenting false status.

### Phase 4 — Evaluate additional Stitch features

- Compare each candidate in Section 6 against scope and implementation readiness.
- Group them into: required for core journey; valuable next iteration; future/needs backend or policy; visual-only/avoid until functional.
- Confirm domain entities, database constraints, RLS, storage, notifications, and acceptance rules before building new feature UI.
- Prioritize proposal acceptance and shared workspace creation as one coherent transaction; avoid partial states where an accepted proposal has no workspace or duplicate workspaces are created.
- Define clear settlement semantics before showing fees, escrow, milestones, guaranteed payouts, or monetary statuses.

### Phase 5 — Tester readiness and release

- Prepare five fictional demo accounts in a non-production/test environment with complete profiles, profile images, fictional past-work entries, demos, and opportunities. Use safe, licensed/generated placeholder media. Provide individual credentials only to the intended tester through an appropriate private channel; don't put passwords in `plan.md`, commits, or public logs.
- Give testers a guided checklist covering account creation/verification, profile, discovery, opportunities, proposals, applications, project space, notifications, settings/privacy/blocking, logout, and password recovery.
- Ask testers for feedback on clarity, missing states, readability, confusing labels, broken links, performance, and trust/safety concerns.
- Verify Render deployment from a clean build and perform smoke checks on desktop and mobile using fresh accounts.
- Keep a release checklist and record deployment commit plus known limitations.

## 8. Definition of done

The core release is ready when:

- A new user can register, receive and use a confirmation email, and reach the app only after verification.
- A user can request password recovery, land directly on the set-password screen through a valid email link, update the password, and sign in with it.
- Invalid or expired links produce a relevant message on the correct flow, never a misleading signup error.
- Users can find Profile, Settings, and Log out from the profile menu and can sign out successfully.
- Global and page text is comfortable to read, including navigation and small utility controls, without breaking responsive layouts.
- Profiles, proposals, opportunities, notifications, and project access follow actual permissions and RLS rules.
- Any UI that mentions payments, escrow, file verification, synchronization, or workspace provisioning corresponds to working, tested behavior or is clearly marked unavailable.
- The deployed build is healthy and a concise manual smoke test passes against the deployed URL.

## 9. Session handoff notes

- Immediate next task: resolve the reported password-reset link landing on signup with a verification-failed warning. Ask for only the evidence needed to tell whether the failure is in deployment, template configuration, or token verification. Redact query values from any link.
- The user is often following Supabase/Render instructions step by step. Provide one concrete action at a time when guiding console settings, then wait for their “done” or screenshot.
- The user has already reported completing Gmail 2-step verification and saving SMTP settings; don't send them through those setup steps again unless a specific error requires it.
- The Render URL and Supabase redirect entries were already shown in the conversation. Avoid asking the user to repeat known information; request a current screenshot only if configuration has changed or the exact current state is essential.
- Never claim a deployment or flow is fixed until the current deployed commit and a fresh end-to-end run establish it.
