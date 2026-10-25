# Demo account seed

This seed creates five clearly labeled fictional musician accounts in the reviewed Supabase project. It uploads generated profile photos and synthetic M4A audio, adds two fictional portfolio credits per profile, and posts one `[DEMO]` opportunity per profile. All uploads use the existing private `avatars` and `demos` buckets.

## Seed or refresh

From the repository root, run:

```bash
node --env-file=.env.local scripts/seed-demo-accounts.mjs --target-ref=letelzhqenbyyibegayu
```

The script is restricted to that Supabase project reference. It prints a newly generated shared password after completion. The password is not stored in this repository. Rerunning the seed refreshes the five demo passwords and safely reuses the marked demo accounts.

## Demo login names

- `demo_ananya_rao` — vocalist / singer
- `demo_kabir_sen` — instrumentalist / bassist
- `demo_meera_iyer` — mixing engineer
- `demo_dhruv_sharma` — instrumentalist / guitarist
- `demo_raghav_menon` — music producer

Use each username or its `muxics.demo.*@example.com` address with the password printed by the seed command. `example.com` is reserved for examples; these accounts do not have working inboxes.

## Remove the demo batch

```bash
node --env-file=.env.local scripts/remove-demo-accounts.mjs --target-ref=letelzhqenbyyibegayu
```

Cleanup is limited to users marked with this batch ID and is restricted to the same Supabase project. It removes profiles, demo media, credits, gigs, and demo-only workflow records. It stops before deleting if a demo account has interacted with a non-demo account through applications, proposals, or a shared project, so no real participant history is silently removed.

All profile details, portfolio credits, and audio are fictional placeholders for product demos. Hiring opportunities continue to use Muxics’ direct-settlement model; no escrow or payment processing is enabled.
