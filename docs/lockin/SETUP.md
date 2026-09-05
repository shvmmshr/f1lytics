# Lock In: production setup

Lock In (the predictions game) ships behind a feature flag. Every `/lockin` route shows
a "coming soon" state, the API routes answer 503, and the navbar hides the item until
the variables below exist. Nothing else on the site depends on them.

## 1. Neon (database)

The schema is already migrated. Two connection strings are needed:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the **pooled** connection string (host contains `-pooler`) |
| `DATABASE_URL_UNPOOLED` | the **direct** connection string (same host without `-pooler`); migrations only |

Rotate the password in the Neon console first (the original was pasted into a chat), then
copy both strings with the new password.

To apply future schema changes: `set -a; source .env.local; set +a; pnpm db:migrate`.

## 2. Better Auth

| Variable | Value |
| --- | --- |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://f1lytics.com` |

These two plus `DATABASE_URL` switch the game on.

## 3. Google sign-in (free)

1. Google Cloud console, APIs and Services, Credentials, Create credentials, OAuth client ID, type Web application.
2. Authorized JavaScript origins: `https://f1lytics.com`.
3. Authorized redirect URIs: `https://f1lytics.com/api/auth/callback/google` (and
   `http://localhost:3000/api/auth/callback/google` for local use).
4. OAuth consent screen: app name F1lytics, support email, privacy policy URL `https://f1lytics.com/privacy`,
   scopes email and profile only. Publish the app so any Google account can sign in.

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | from the client |
| `GOOGLE_CLIENT_SECRET` | from the client |

## 4. Magic link email through Resend (free tier: 3,000 a month, 100 a day)

1. Create a Resend account, add the domain `f1lytics.com` (or a subdomain such as `mail.f1lytics.com`).
2. Add the DNS records Resend shows (SPF, DKIM, and the return-path CNAME) at the registrar and wait for verification.
3. Create an API key with sending permission.

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | the key |
| `RESEND_FROM` | for example `F1lytics <lockin@mail.f1lytics.com>` |

Google alone is enough to launch; magic link can follow later.

## 5. Vercel

Project Settings, Environment Variables: add every variable above for Production (and Preview if
wanted). `REVALIDATION_SECRET` already exists and also protects `POST /api/lockin/settle`.
Redeploy after adding them: the navbar flag is baked at build time.

Check after the deploy:

- `https://f1lytics.com/lockin` shows the pick board for the open round.
- `https://f1lytics.com/api/lockin/summary` returns JSON with `"state":"open"`.
- Sign in with Google works and `/lockin/account` shows your display name.

## Operations

- **Settlement is automatic.** Viewing a round after its sessions end settles it from Jolpica. To force it:
  `curl -X POST -H "x-revalidate-secret: $REVALIDATION_SECRET" "https://f1lytics.com/api/lockin/settle?round=YYYY-MM-DD"`.
- **Deleting a player:** `delete from "user" where email = '...'` cascades to profile, picks, scores and league memberships.
- **Payments later:** the `profiles.tier` column (`free` | `supporter`) is the hook. Polar and Dodo Payments both ship
  Better Auth plugins; no Stripe code exists in the repo.
