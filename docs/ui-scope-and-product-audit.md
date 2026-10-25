# Muxics UI and Product Scope Audit

**Review date:** 26 October 2026  
**Purpose:** Compare the refreshed Stitch UI direction with the implemented product model, distinguish planned behavior from mockup-only additions, and recommend a rollout that keeps features truthful and compatible.

## Executive summary

The UI work has brought the known core routes into a more consistent, responsive Muxics visual system. The product underneath is already more than a set of mock screens: it supports musician discovery, gigs and applications, direct proposals with mutual acceptance, shared project workspaces, notifications, blocking, and basic profile management.

The important product boundary is that Muxics currently coordinates discovery, agreement, and collaboration. It does **not** process payments, hold escrow, verify delivery milestones, provide a DAW integration, or exchange audio files through proposal/project conversations. Hiring payments are explicitly arranged directly between musicians outside Muxics.

The Stitch screens add valuable ideas, especially clearer structured terms, richer musician/studio capability data, and more useful activity presentation. They also depict payment protection, detailed contracts, and media/DAW infrastructure that would require product decisions, schema and security work, and possibly external services. Keep those as proposed enhancements until deliberately scoped; do not let visual labels imply they already work.

## Review basis and limits

This review used the route tree, server actions, Supabase migrations, README, and the Stitch references shared in this conversation. There is no separate, approved implementation plan document in the repository, so “current plan” below means the implemented baseline described by the README and code—not an inferred commitment to every detail in a mockup.

This was a source review only. The README says the app has not yet been run against a live Supabase project. No live-service verification or test/build run was performed for this report.

## What is implemented and visually refreshed

| Area | Current capability | UI work represented in the shared references |
|---|---|---|
| Account access | Email/username sign-in, signup with profile setup and short demo, email verification, password reset | Sign-in, signup, and recovery screens |
| Discovery and profiles | Browse musicians by specialty/location, member-visible profiles, signed demo playback, profile editing | Explore/discovery, musician profile, profile settings |
| Gigs | Browse open gigs, create hiring/collaboration opportunities, apply, review applicants, accept/decline, withdraw, track status, extend/close deadlines | Gigs, create opportunity, applications, posted opportunities and applicant review |
| Proposals | Send direct collaboration/hiring proposals, exchange text replies, accept mutually, terminate, hide personal history | Proposals list, composer, proposal detail/thread |
| Shared projects | Project auto-creation after accepted application or mutual proposal acceptance; participant text feed; completion; leave/remove with private, response-capable exit history | Projects list and shared workspace |
| Notifications | In-app event feed, filters, mark one/all read, links to relevant records, deadline extension action | Notifications/feed |
| Privacy | Block/unblock accounts; block restrictions are enforced in profile/gig/demo discovery and proposal/application paths | Blocked accounts and confirmation state |

The main related routes are `/`, `/signup`, `/forgot-password`, `/reset-password`, `/discover`, `/profiles/[username]`, `/settings/profile`, `/settings/blocks`, `/opportunities`, `/opportunities/new`, `/opportunities/[id]`, `/my-opportunities`, `/my-opportunities/[id]`, `/applications`, `/proposals`, `/proposals/new`, `/proposals/[id]`, `/projects`, `/projects/[id]`, and `/notifications`.

## Stitch additions: benefits, costs, and recommendation

| Stitch idea | Existing support | Merit | Demerit / conflict risk | Recommendation |
|---|---|---|---|---|
| **Structured proposal terms**: role, deliverables, deadline, key/tempo, format, revisions, compensation | Proposal records currently store type, topic, status, acceptances, and text messages. The composer collects recipient, type, topic, and an opening message. | Makes expectations visible, comparable, and easier to accept without searching a long thread. Reduces avoidable misunderstanding. | Binding terms need validation, change history, counter-term rules, and acceptance against a specific version. Adding fields to the screen alone would create false agreement. A proposal that changes after one party accepts must not be silently accepted on stale terms. | **Plan next as a scoped enhancement.** Define a versioned proposal terms object/snapshot, editable/countered states, and acceptance-lock rules before adding all fields. Start with a small useful set: role, scope/deliverables, due date, compensation model/amount, and notes. Treat BPM/key/file format as optional domain fields only if users validate the need. |
| **Counter-terms / negotiation actions** | Current proposals support shared text replies and accept/terminate; no structured counter-offer state exists. | Gives both sides a clear, auditable negotiation path and works naturally with structured terms. | Status complexity increases (pending, countered, accepted, declined, expired); requires notification and history semantics. Can conflict with the current simple mutual acceptance flow if mixed without a defined state machine. | Add together with structured terms, not as an isolated button. Preserve the current thread for conversation. |
| **Escrow, milestone verification, direct payment status** | Current code and UI state that hiring payment is settled outside Muxics; there is no payment provider, escrow ledger, payout, or milestone record. | Could increase trust, clarify payment timing, and support higher-value work. | High operational/legal/compliance burden, chargebacks/refunds, KYC, tax, payment-provider integration, dispute handling, and reconciliation. Mock labels like “escrow funded” or “milestone verified” would contradict current behavior and be especially misleading. | **Do not implement as a UI-only change.** Keep direct-settlement language consistent. First decide whether Muxics intends to become a payments intermediary; if yes, research provider/legal operations and make a separate product phase. |
| **Audio/stem attachments in proposals and project chat** | Private storage exists for profile demos. Proposal and project messages are text-only; no project asset/attachment table or upload policies are present. | Supports the actual music workflow, keeps references and handoffs in context, and reduces reliance on external links. | Large files, private access, retention/deletion, malware/content validation, quotas, signed URLs, auditability, and RLS must be designed. The profile demo bucket’s rules are not sufficient for project assets. | **Valuable follow-on.** Define an asset model and per-project access controls first; implement limited audio formats/size, upload/download audit, and retention before advertising “stem exchange” or “lossless delivery.” |
| **DAW/tempo/key telemetry, sync status, channel routing** | No DAW integration, BPM/key model, audio sync telemetry, or live channel routing is in the database/actions. Realtime currently applies to text messages. | Could make collaboration more music-specific and surface useful project context. | Requires actual DAW/plugin or file-analysis integrations and reliable source-of-truth rules. Decorative “48 kHz sync” or latency values can imply a connection that does not exist. | Defer. If demand is proven, start with manually entered project metadata; only show live sync/telemetry when a real integration supplies it. |
| **Richer musician dossier**: gear, DAW, availability, remote formats, multiple links/demos | Profiles store identity/location/specialties/genres/bio; demos support up to two records in the model, and portfolio links have a table. Signup currently uploads one demo; profile settings can display existing links/demos but do not expose all editing/upload management. No gear/availability fields exist. | Helps posters assess fit and reduces repetitive pre-proposal questions. Existing profile and link tables provide a starting point. | More fields increase onboarding and stale-data risk. Gear/availability claims need ownership, validation, edit/privacy controls, and discoverability decisions. | Stage it. First support portfolio link and demo management, then add optional availability/DAW/gear fields only if they materially improve matching. Clearly distinguish user-provided specs from verified facts. |
| **Notification preferences and email delivery** | A `notification_preferences.email_enabled` table and RLS exist, but there is no preferences screen or email delivery implementation. In-app notifications are implemented. | Lets users control channel volume and catch important events off-platform. | A toggle without delivery infrastructure is misleading. Email requires templates, unsubscribe/consent behavior, retries, suppression, and event-vs-preference policy. | Implement in-app preferences first only if there are real configurable categories. Add email controls when delivery exists end-to-end. |
| **Account & security settings** | Password reset exists. No dedicated security settings for sessions, MFA, account email change, account deletion/reactivation, or cleanup workflow. | Improves account control and safety. | Security settings need reliable auth-provider flows, recovery safeguards, and careful project/history retention. The README already flags account deletion/reactivation and scheduled cleanup as release gaps. | Separate account lifecycle/security phase. Prioritize deletion/reactivation policy and data retention before adding decorative security telemetry. |
| **Blocked-account privacy dashboard / confirmation** | Block/unblock and enforcement are implemented, with confirmation UI. | Makes privacy consequences clear and reduces accidental unblock/block actions. | Mock copy can overstate effects. Existing shared project history/access has distinct rules and should not be described as erased by blocking. | Keep current model and copy precise: blocking restricts new discovery/interactions; it does not rewrite existing project membership/history. |
| **Activity summaries, escrow telemetry, active session counts** | Notifications and actual gig/project/proposal data exist; no escrow ledger, active-session counter, cloud storage quota, or live sync metrics. | Helps users scan their workload when driven by real records. | Counts and status panels can look authoritative while being fabricated or derived from incomplete samples. | Keep data-backed counts only, label their time window/source, and remove unsupported operational telemetry. |

## Compatibility rules to keep features conflict-free

1. **Use one payment truth everywhere.** Current policy is direct settlement outside Muxics; never display escrow-funded, escrow-protected, payout-ready, or milestone-verified states until those systems exist.
2. **Acceptance must match immutable terms.** If structured proposals are added, both acceptances must reference the same version. Any counter/change after an acceptance resets that acceptance.
3. **Separate opportunity applications from direct proposals.** Applications respond to a posted gig and poster decisions create a project. Direct proposals are person-to-person invitations and require both participants to accept. Keep their statuses and navigation distinct.
4. **Keep project access and privacy rules explicit.** Blocks should prevent new interactions according to existing policy; leaving/removal/completion and historical records remain governed by project rules.
5. **Only expose controls with working persistence.** Mockup-only sort/filter controls, upload actions, preferences, and telemetry should be hidden, disabled with a clear explanation, or implemented fully—not presented as live capabilities.
6. **Treat file assets as a security feature, not just a UI field.** Project-scoped authorization, private storage, safe type/size limits, signed delivery, and retention must precede attachments.
7. **Preserve the current mutual-acceptance model during expansion.** Add new negotiated terms around it rather than bypassing it with a single-sided “accept and launch” action.

## Recommended work plan

### Phase 0 — Stabilize and verify what already exists

- Run the complete app against a non-production Supabase project with the current migrations.
- Walk through signup/email verification/password reset, profile editing, gig create/apply/decision/withdraw/close/extend, proposal send/reply/mutual accept, project chat/exit/completion, notifications, and block enforcement as both participants.
- Verify Cron reminder and deadline closure behavior; document any service configuration needed.
- Review all refreshed UI copy against actual behavior, especially direct settlement, “verified,” realtime, and file-sharing language.
- Add automated coverage for the critical state transitions and access-control boundaries after the live setup is stable.

### Phase 1 — Close baseline release gaps

README/code review identifies these concrete items:

- Server-side validation of demo audio duration; do not trust a client-submitted duration value.
- User-facing avatar replacement/removal. Signup can accept an avatar, but profile editing does not currently manage it.
- Portfolio link creation/edit/delete in profile settings (the table and display path exist).
- Account deletion/reactivation and scheduled permanent-cleanup policy, including treatment of project history and storage objects.
- Notification preference UI and actual email delivery, if email notifications remain in the product scope.
- Confirm Supabase Cron is enabled and monitor deadline jobs before relying on automatic closure.

### Phase 2 — Improve agreement quality

- Interview musicians/posters about the minimum terms they need before committing.
- Design a versioned terms snapshot and explicit negotiation state machine.
- Implement structured role/scope/deliverables/deadline/compensation first, then add optional production specs.
- Preserve direct settlement and label compensation as a participant agreement, not a Muxics-held balance.

### Phase 3 — Build music-specific project delivery

- Define project assets, allowable formats/sizes, quotas, access policies, audit trail, retention, and deletion semantics.
- Add upload/download to the project workspace only after storage policies are tested for active members, former members, blocked pairs, and completed projects.
- Consider manually recorded DAW/BPM/key metadata before planning any live integration.

### Phase 4 — Revisit payments and advanced integrations

- Decide whether payments/escrow are strategically in scope. If yes, create a separate compliance, provider, dispute, and operations plan before UI or schema work.
- Evaluate DAW sync, verification, and operational telemetry only against real integrations and user demand.

## Suggested immediate priority

The highest-value next step is **Phase 0**, followed by the baseline release gaps in Phase 1. The Stitch additions should not delay validating the existing core transaction paths. After that, structured proposal terms are the strongest product enhancement because they reduce ambiguity without forcing Muxics into payment custody. Treat escrow and DAW telemetry as separate strategic decisions.

## Repository references

- Product overview and declared setup limits: [`README.md`](../README.md)
- Database schema, RLS, and workflow functions: [`supabase/migrations/202610250001_initial_schema.sql`](../supabase/migrations/202610250001_initial_schema.sql)
- Signup, gig, application, proposal, profile, notification, and project actions: [`app/actions.ts`](../app/actions.ts)
- Proposal composer: [`app/proposals/new/page.tsx`](../app/proposals/new/page.tsx)
- Proposal detail and text thread: [`app/proposals/[id]/page.tsx`](../app/proposals/%5Bid%5D/page.tsx)
- Project conversation: [`app/projects/project-chat.tsx`](../app/projects/project-chat.tsx)
- Profile settings: [`app/settings/profile/page.tsx`](../app/settings/profile/page.tsx)
- Notification feed: [`app/notifications/page.tsx`](../app/notifications/page.tsx)
