# Analytics setup

Four steps. Nothing works until all four are done, and nothing breaks if you stop
halfway — the site treats missing analytics as "analytics does not exist".

## 1. Create the tables

Supabase Dashboard → SQL Editor → New query → paste `analytics.sql` → Run.
Safe to run more than once.

Check it worked:

```sql
select public.analytics_summary(30);
```

## 2. Pick a password

Long. This is the only thing in front of the data.

```
openssl rand -base64 24
```

## 3. Deploy the function and set the secret

```
supabase functions deploy insights --project-ref rpcfxakwidvfjyjlcyxj
supabase secrets set INSIGHTS_PASSWORD='<the password from step 2>'
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform — you
do not set those yourself.

**Leave "Verify JWT with legacy secret" ON** (Functions → insights → Settings).
The dashboard suggests turning it off when a function does its own auth, but the
client sends the anon key, so it works with the toggle on — and with it on, an
unauthenticated scanner is rejected at the platform edge and never costs an
invocation. It is not the security boundary (that key ships in the bundle); the
password is. It is free noise reduction.

## 4. Exclude yourself

Visit the live site once with `?notrack=1`:

```
https://litaphsinam.github.io/ManishPatil_Portfolio/?notrack=1
```

That sets a flag in that browser's localStorage for good. Do it on every browser
and device you use, or you will be your own top visitor. Clearing site data
resets it.

---

## Opening the dashboard

The **Help (`?`) button on the footer window** — "Resume & Contact Center". Eight
other Help buttons on the site do nothing; this one opens `insights.exe`.

## Adding a new tracked click

Put `data-track` on anything:

```tsx
<button data-track="interview:ask">Ask</button>
```

External links, `mailto:` and `tel:` are already tracked automatically by
hostname, so only same-origin elements need the attribute.

Game plays call `track('game', '<name>')` from `src/lib/analytics.ts` — not wired
into `Games.tsx` yet, so the "Games played" panel stays empty until you add it.

## Why the password is not checked in the browser

It cannot be. The bundle ships to the visitor, so any comparison in client code is
readable, and the anon key in that bundle could query the tables directly anyway.
So the tables have **no select policy at all** — the anon key can insert and
nothing else. The Edge Function holds the service role key, which bypasses RLS,
and refuses to use it until the password checks out. That is the whole security
model, and it is why the dashboard needs a server round trip to render.

## Housekeeping

No automatic cleanup — free-tier projects have no `pg_cron`. Trim by hand
whenever:

```sql
delete from public.events where at < now() - interval '180 days';
delete from public.visits where started_at < now() - interval '180 days';
```

## What is deliberately not collected

No cookies, no IP addresses, no fingerprinting, nothing typed into any field. The
session id lives in `sessionStorage` and dies with the tab. That is why there is
no consent banner.
