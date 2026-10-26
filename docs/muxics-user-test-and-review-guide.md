# Muxics User Test & Review Guide

## Welcome

Thank you for trying Muxics. This guide introduces the app step by step and asks for feedback as you use each feature. You do not need music-industry experience to complete the review; please tell us where wording, navigation, or expectations are unclear.

Muxics is a collaboration platform for musicians in India. Members can create a musician profile, discover people and opportunities, apply to gigs, send direct project proposals, and continue accepted work in a shared project space.

### Before you begin

- Use the test account credentials supplied separately, or create your own account with an email address you can access.
- The supplied demo accounts use reserved `example.com` addresses. They are already confirmed for sign-in, but cannot receive verification or password-reset emails.
- Once configured, email confirmation will be temporarily disabled so new accounts can use Muxics immediately. Use an email address you control; ownership will not be confirmed, and password recovery still depends on email delivery being configured.
- Immediate signup requires the app owner to turn off **Confirm email** in the Supabase Email provider settings. If it is still enabled, signup displays a setup message instead of leaving an unverified account behind.
- If creating an account, use a real email inbox and only upload audio and images you have permission to share. Signup requires an MP3 or M4A demo of 60 seconds or less and up to 15 MB.
- Use fictional test content. Do not enter private client information, real payment details, or confidential unreleased music.
- Actions such as publishing a gig, applying, sending/accepting a proposal, or blocking an account change shared test data. Coordinate with other testers if you share accounts.

### Important product behavior

- Hiring payments are arranged directly between musicians, outside Muxics. The app does not hold funds or provide escrow/payment processing.
- A gig application is reviewed by the person who posted that gig. If the poster accepts an application, Muxics creates a shared project space.
- A direct proposal is a separate person-to-person invitation. The recipient can reply in its thread; the shared project space is created only after both people accept.
- Project conversations currently support text. Profile demos are playable, but proposal/project messages do not provide file or stem uploads.
- Blocking limits discovery and new interactions. It does not erase existing project records or change project access rules.

## 1. Create an account

Skip this section if you are signing in with a supplied demo account.

1. Open the Muxics app and choose **Join Muxics** / **Create account**.
2. Enter your full name, a username (3–24 letters, numbers, or underscores), email, and password (at least 8 characters).
3. Add your city, state/region, and country.
4. Choose a primary specialty, add any secondary specialties and genres, and write a short musician bio.
5. Upload a profile photo if you want, then upload one MP3 or M4A demo (maximum 60 seconds and 15 MB).
6. Confirm that you are at least 18 and have permission to share the audio, then submit.
7. After submission, you should be signed in and taken to the gigs area without waiting for an email.

**Please review:** Were the required fields and audio limits clear? Did the app explain what happens after account creation? Did you arrive signed in? Did any validation message fail to explain how to fix the problem?

## 2. Sign in and recover access

1. Sign in using your email address or username and password.
2. Confirm that you arrive at the opportunities/gigs area and can find the main navigation.
3. Sign out, then try **Forgot password** only if you have access to the account email. Enter the email or username and follow the message sent to your inbox. Open the reset link and choose a new password. Email delivery must be configured for public addresses.

Do not test password reset with the supplied `example.com` demo account because it cannot receive email.

**Please review:** Was it obvious that either email or username works? Were errors understandable? Could you find sign-out and password recovery without help?

## 3. Complete and inspect your musician profile

1. Open **Profile** and review your public profile details.
2. Open profile settings and update your display name, location, primary specialty, skills, genres, and bio. Save changes.
3. Return to the public profile. Check that the changes appear and play your demo.
4. Review portfolio links and visibility information. Some fields shown in design references may not be editable in the current settings form; report any confusing or unavailable control.

**Please review:** Does the profile represent your music clearly? Is it easy to edit and save? Is the public/private visibility clear? Does audio playback work, and is its format/duration information useful?

## 4. Discover musicians

1. Open **Explore** / **Discover**.
2. Browse or filter musicians by specialty and location.
3. Open a musician profile, review their skills, genres, demo, and external work links.
4. If appropriate for your test, choose **Propose a project** to start a direct proposal (covered in section 8). Do not send unsolicited proposals to real users.

**Please review:** Were filters useful? Could you tell who a musician is and what they offer? Did the profile provide enough information to decide whether to collaborate?

## 5. Browse opportunities and apply

1. Open **Gigs** / **Opportunities** and browse open opportunities.
2. Open one opportunity and read its description, required specialty, expectations, location/remote status, deadline, and deal type.
3. For a test opportunity you are eligible for, submit a short application message.
4. Open **Applications** to track the application status. A poster can review applicants from **My Opportunities** and accept or decline them.
5. If your application is accepted, open the newly created shared project from **Projects** or the notification.

For hiring gigs, the displayed amount is an agreement between the participants; Muxics does not collect or transfer the payment.

**Please review:** Were the opportunity terms and deadlines easy to understand? Did you know what information the poster would see? Was the application status clear? Did you understand what accepting meant and how payment works?

## 6. Post and manage an opportunity (poster flow)

1. Choose **Post Opportunity** / **Create Opportunity** from the gigs area.
2. Enter a clear title, brief description, and contributor expectations.
3. Choose one primary specialty, estimated duration, application deadline/time, location, and whether remote work is allowed.
4. Choose **Collaboration** or **Hiring**. For hiring, enter the fixed INR amount. Review the direct-settlement notice.
5. Publish the opportunity. Open **My Opportunities** to view it and incoming applications.
6. Review an applicant's profile and message, then accept or decline. Before any contributor is accepted, you can extend the deadline or close the opportunity where those controls are available.

**Please review:** Was creating a gig straightforward? Were collaboration and hiring distinct enough? Were deadline/location fields clear? Was it easy to compare applicants and understand the consequences of accepting, extending, or closing?

## 7. Review applications (applicant and poster)

1. As an applicant, open **Applications** and review the submitted opportunity, message, and status.
2. If withdrawal is available for a pending application, try it only on a test application.
3. As a poster, open **My Opportunities**, select an opportunity, and inspect the applicant list and their profiles/demos.
4. Accept or decline a test application. Verify the applicant's status and any notification. Acceptance should create a project space.

**Please review:** Did each status make sense? Were applicant and poster actions easy to distinguish? Did the app explain whether an action was final or reversible?

## 8. Send and respond to a direct proposal

1. Open another test musician's profile and choose **Propose a project**.
2. Choose **Hiring** or **Collaboration**, write a concise project topic and opening message, then send.
3. Sign in as the recipient (or ask another tester) and open **Proposals**. Read and reply in the proposal thread.
4. Review the terms together in the conversation. The current version does not provide structured binding fields for every detail; explicitly discuss scope, deliverables, timing, and compensation in the message thread.
5. Both participants must accept the same proposal before a shared project is created. If one person accepts first, the proposal remains pending until the other accepts. Use decline/withdraw only on a test proposal.

**Please review:** Was it clear how direct proposals differ from gig applications? Did the thread support a useful conversation? Was mutual acceptance understandable? Which project details should be structured fields rather than free text?

## 9. Work in a shared project space

1. Open **Projects** and select a project created by an accepted application or mutually accepted proposal.
2. Review the project origin, participants, and agreed scope shown on the page.
3. Post a text update in the shared feed. Confirm that the other participant can see it.
4. If this is a disposable test project, inspect the completion control as the project poster. Mark complete only when you intend to close that test project.
5. The project has leave/remove actions with a required reason and private history/response flow. Do not use them unless you are deliberately testing that flow with the other participant.

**Please review:** Was it clear who can see project messages? Could you find important project context? Did realtime updates work? Were completion and exit actions understandable? Did you expect audio/file attachments or DAW integration that were not available?

## 10. Notifications and privacy controls

1. Open **Notifications**. Filter by unread, proposals, applications, or projects; open a notification and mark it read. Try **Mark all as read** if there are test notifications.
2. Open **Blocked accounts** from profile/privacy settings. Review the blocking explanation. If testing, block and unblock only another demo account, and confirm the consequences before proceeding.

**Please review:** Did notifications take you to the right record? Were read/unread states useful? Was blocking's effect clear? Did any privacy wording imply that old project history or access was removed?

## 11. Final review

After exploring the features you have time for, please send feedback with:

- **Overall:** What were you trying to accomplish, and could you do it?
- **Best part:** Which feature felt most useful or polished?
- **Confusing point:** Where did you pause, backtrack, or need help? Include the page and what you expected.
- **Missing capability:** What did you expect to do that the app could not do?
- **Trust and safety:** Were payment, privacy, audio-sharing, and acceptance rules clear?
- **Visual usability:** Was text readable on your device? Were buttons, statuses, and forms easy to find and use?
- **Bugs:** What happened, what did you expect, and which device/browser were you using? A screenshot is helpful; please hide personal information.
- **Priority:** If we fixed one thing first, what should it be?

## Current-scope notes for reviewers

The following capabilities shown in some design concepts are not part of the current working flow: Muxics escrow/payment processing, verified delivery milestones, project stem/file uploads in proposal or project chat, DAW sync/telemetry, email notification delivery/preferences, and full account deletion/security management. Email confirmation is temporarily disabled; password reset still requires working email delivery. Please tell us if these other capabilities would be valuable, but distinguish that product feedback from a broken existing control.

## Session end

Please sign out when finished. If you created a new account, tell the app owner which test email/username you used so the account and uploaded demo can be cleaned up later. Do not delete or alter other testers' data.
