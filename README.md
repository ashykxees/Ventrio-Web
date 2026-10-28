# Ventrio Web

**Build Better Together.** — the website for Ventrio, a community for young entrepreneurs ages 13–19 to learn business, build ideas, compete, connect, and grow in faith.

- **Stack:** Next.js 16 (App Router) · Auth.js v5 (Discord OAuth2) · Prisma 6 + SQLite · Tailwind CSS v4
- **Brand:** Charcoal `#0B0B0D`, Warm Gold `#D4AF6B`, Cream `#F5F5F0`, Slate `#9CA3AF`, Graphite `#374151`; Montserrat for headings, Inter for body text. Logo files live in `public/brand/`.

## Pages

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Brand intro, features, upcoming events, mission | Public |
| `/about` | Mission, vision, who we serve, values | Public |
| `/academy`, `/academy/[id]` | Lessons, classes, resources, coaching (filter by category/type) | Public; registration requires sign-in |
| `/events`, `/events/[id]` | Event listings (filter by type/date) and registration | Public; registration requires sign-in |
| `/competitions`, `/competitions/[id]` | How competitions work, details, submission form, private feedback | Public; submissions require sign-in |
| `/community` | Community overview, guidelines, Discord invite | Public |
| `/careers` | Become a Ventrio Coach: positions, expectations, Discord-gated application | Public; applying requires sign-in (open before launch) |
| `/login` | Sign in with Discord | Public |
| `/profile` | Edit member profile with live preview | Signed-in members |
| `/settings` | Privacy controls, sign out, delete account | Signed-in members |
| `/members/[handle]` | Public member profile (only if the member opts in) | Public |
| `/admin/*` | Manage events, lessons, competitions, submissions, announcements, coach applications | Admins only |
| `/privacy`, `/terms`, `/contact` | Placeholder policies and support | Public |

No events, lessons, competitions, prizes or testimonials are pre-filled. Every list shows a friendly empty state until an admin publishes real content.

## Run locally

```bash
npm install
cp .env.example .env        # then fill in the values below
npx prisma migrate dev      # creates prisma/dev.db
npm run dev                 # http://localhost:3000
```

Other scripts: `npm run build`, `npm start` (runs `prisma migrate deploy` first), `npm run lint`, `npm run format`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite file. Local: `file:./dev.db`. Railway: `file:/app/data/ventrio.db` |
| `AUTH_SECRET` | Yes | Session secret. Generate with `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_DISCORD_ID` | Yes | Discord application **Client ID** |
| `AUTH_DISCORD_SECRET` | Yes | Discord application **Client Secret** (server only) |
| `AUTH_URL` | Recommended | Public site URL, e.g. `https://ventrio.org` |
| `ADMIN_DISCORD_IDS` | Yes, for admin | Comma-separated Discord user IDs allowed into `/admin` |
| `DISCORD_INVITE_URL` | Optional | Discord invite used across the site. Defaults to `https://discord.gg/J5y9A8Asch` |
| `SITE_LAUNCHED` | Yes | `false` = teaser page only; `true` = full site + one-time launch DMs |
| `DISCORD_BOT_TOKEN` | Yes, for teaser | Bot token from the same Discord application (auto-join + launch DM) |
| `CALENDLY_URL` | Optional | Interview booking link for coach applicants. Defaults to `https://calendly.com/dev-jake317/30min` |
| `DISCORD_APPLICATIONS_WEBHOOK_URL` | Optional | Discord webhook URL that receives new coach applications |
| `COACH_ROLE_IDS` | Optional | Discord role IDs that unlock `/coach`. Defaults to `1560107594020814888,1560110258217558068,1560110027262525450` |
| `LEADERSHIP_ROLE_IDS` | Optional | Discord role IDs that also get the leadership area (`ADMIN_DISCORD_IDS` always do) |
| `DISCORD_GUILD_ID` | Optional | Discord server ID; looked up from the invite link when blank |
| `CONTACT_EMAIL` | Optional | Support email shown on `/contact` and in the footer |

Secrets are only read on the server. Nothing secret is exposed to the browser.

## Discord OAuth setup

1. Go to <https://discord.com/developers/applications> → **New Application** → name it "Ventrio".
2. Open **OAuth2** in the sidebar.
3. Copy **Client ID** → `AUTH_DISCORD_ID`. Click **Reset Secret**, copy it → `AUTH_DISCORD_SECRET`.
4. Under **Redirects**, add the callback URL for every environment and click **Save Changes**:
   - Local: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://<your-domain>/api/auth/callback/discord`
5. Set `AUTH_SECRET` and `AUTH_URL` and restart/redeploy.

Ventrio requests only the `identify` scope (username, display name, avatar). It never asks for email, servers, or a Discord token.

## Teaser & launch

Until `SITE_LAUNCHED=true`, visitors only see the teaser on `/` (plus `/login`, `/privacy`, `/terms`, `/contact`); every other page redirects to it. Admins see the full site with a preview banner.

Signing in on the teaser requests the `identify` and `guilds.join` scopes, adds the member to the Discord server, and puts them on the launch waitlist. When you set `SITE_LAUNCHED=true` and redeploy, the bot DMs every waitlisted member once (members can opt out on the teaser). `/admin` shows waitlist counts and a button to send any pending launch DMs.

**Bot setup (one time):**

1. In the same Discord application as `AUTH_DISCORD_ID`, open **Bot** → **Reset Token** → copy it into `DISCORD_BOT_TOKEN`.
2. Open **OAuth2 → URL Generator**, tick the **bot** scope, then the **Create Instant Invite** permission. Open the generated URL and add the bot to the Ventrio server.
3. Redeploy. Members who signed in before this change need to sign in again to grant `guilds.join`.

## Admin setup

1. In Discord: **User Settings → Advanced → Developer Mode** on.
2. Right-click your name → **Copy User ID**.
3. Add it to `ADMIN_DISCORD_IDS` (comma-separate multiple IDs) and redeploy.
4. Sign in, then open `/admin` (an **Admin** link appears in the header).

Admin access is checked on the server for every admin page and every admin action. It comes only from this env var, never from a profile field the user can edit.

## Coach Dashboard (`/coach`)

A private workspace for coaches: weekly sessions, requests, project payroll, lessons & resources, tasks, performance reviews, announcements, policies and in-app notifications. Leadership tools live under `/coach/leadership`.

- **Coach access** comes from Discord roles. The site reads the member's roles in the Ventrio server with `DISCORD_BOT_TOKEN` (the bot must be in the server) and lets in anyone holding one of `COACH_ROLE_IDS`. Roles are re-checked every 5 minutes, so removing the role removes access. Leadership can also deactivate a coach (records are kept).
- **Leadership access**: everyone in `ADMIN_DISCORD_IDS`, plus optional `LEADERSHIP_ROLE_IDS`.
- Works before launch (`SITE_LAUNCHED=false`); not linked from public pages and not indexed.
- Operational rules (session types, durations, platforms, deadlines, compensation details, rating scale…) are set at `/coach/leadership/settings`. Anything not established by the brief starts as "Not configured".
- Payroll is record-keeping only: approving work creates a pending record; marking it paid is a separate, confirmed, logged step. Nothing sends money.
- Materials and attachments are shared as links (e.g. Google Drive); there is no file upload yet. Notifications are in-app only.
- Rule tests: `npm test`.

## Deploy (Railway)

1. Create a service from this repo.
2. Add a **Volume** mounted at `/app/data` (keeps the SQLite database across deploys).
3. Set the environment variables above, with `DATABASE_URL=file:/app/data/ventrio.db` and `AUTH_URL=https://<your-domain>`.
4. Build command: `npm run build`. Start command: `npm start` (applies migrations, then starts Next.js on `$PORT`).
5. Add the production callback URL to the Discord application (see above).

## Database & access rules

Schema: `prisma/schema.prisma` · Migrations: `prisma/migrations/`.

| Table | Purpose |
| --- | --- |
| `User`, `Account`, `Session` | Auth.js tables. Sessions are stored in the database; the browser only holds an HTTP-only cookie. |
| `Profile` | One per member, linked to the stable Discord user ID. Editable fields plus per-field visibility flags. Private by default. |
| `Event` | Title, description, type, start/end (UTC) + timezone, format/location, capacity, registration mode/link, organizer, status |
| `Lesson` | Academy item: title, description, details, instructor, type, category, optional schedule, registration status, capacity, resource link |
| `Competition` | Details, eligibility, requirements, judging criteria, prizes (+ verified flag), dates, phase, admin-configured submission fields |
| `Submission` | One per member per competition; answers, status, score, feedback |
| `Registration` | A member's registration for an event or lesson (confirmed/cancelled) |
| `Announcement` | Admin announcements shown on Home and Community |

SQLite has no row-level security, so the equivalent rules are enforced in server code (`lib/session.ts`, `app/actions/*`):

- Members can only update their **own** profile, privacy settings, registrations and submissions — the user ID always comes from the server session, never from the form.
- Public profile pages return only profiles marked public, and only the fields the member chose to show. Discord IDs, internal IDs and account data are never rendered.
- Submission scores and feedback are shown only to the submitting member and admins.
- Prizes stay hidden until an admin marks them verified.
- Every admin page and action re-checks `ADMIN_DISCORD_IDS` on the server.

## Testing checklist

- [ ] Sign in with Discord → lands on `/profile`; a profile is created with your Discord name and avatar
- [ ] Cancel on the Discord consent screen → back on `/login` with a friendly message
- [ ] Sign out from the header or `/settings`
- [ ] Edit profile: validation errors show inline; Save and Cancel work; preview updates live
- [ ] Privacy: profile private by default → `/members/<handle>` returns 404; make it public → page loads with only the allowed fields
- [ ] Second account cannot see the first account's private profile or edit it
- [ ] Admin: non-admin gets 404 on `/admin`; admin can create, edit, publish, archive and delete events, lessons, competitions, announcements
- [ ] Events: register, see spots left, cancel; full events block registration; external links open
- [ ] Competitions: submit while Open, edit until review starts; admin sets status/score/feedback; member sees it, others don't
- [ ] Delete account in `/settings` removes the profile and related data

## Protecting younger members

Ventrio collects only Discord identity data and optional profile fields — no date of birth, email, address or school. Profiles are private by default. Review the placeholder `/privacy` and `/terms` pages against applicable child and teen privacy laws (e.g. COPPA) before launch.
