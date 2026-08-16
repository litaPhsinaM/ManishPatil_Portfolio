/**
 * insights.exe — the read side of analytics.
 *
 * Runs on Supabase Edge Functions (Deno). It exists for one reason, the mirror of
 * the interview function's: the password and the service role key must never reach
 * the browser. A password checked in client JavaScript is decoration — anyone can
 * read the bundle, and anyone holding the anon key could query the tables directly.
 *
 * So the analytics tables carry no select policy at all (see analytics.sql). This
 * function is the only way in: it holds the service role key, which bypasses RLS,
 * and it will not use it until a password has been verified.
 *
 * Deploy:
 *
 *   supabase functions deploy insights --project-ref rpcfxakwidvfjyjlcyxj
 *   supabase secrets set INSIGHTS_PASSWORD='<something long>'
 *
 * Pick a long passphrase. It is the only thing standing in front of this data, and
 * the rate limiting below slows an attacker down rather than stopping one.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INSIGHTS_PASSWORD = Deno.env.get('INSIGHTS_PASSWORD') ?? '';

const ALLOWED_ORIGINS = new Set([
    'https://litaphsinam.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
]);

const corsFor = (origin: string | null) => ({
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://litaphsinam.github.io',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
});

const json = (body: unknown, status = 200, cors: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
    });

/**
 * Constant-time comparison over SHA-256 digests.
 *
 * Comparing with === leaks the length of the shared prefix through timing, which
 * is enough to recover a secret one character at a time. Hashing first makes both
 * sides a fixed 32 bytes, and the loop below never exits early.
 */
const passwordMatches = async (candidate: string): Promise<boolean> => {
    if (!INSIGHTS_PASSWORD) return false;
    const digest = async (s: string) =>
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
    const [a, b] = await Promise.all([digest(candidate), digest(INSIGHTS_PASSWORD)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
};

/**
 * Per-IP failure throttle.
 *
 * Edge function instances are ephemeral, so this is a speed bump rather than a
 * lock: a determined attacker can wait out an eviction. Combined with a long
 * passphrase that is the right trade — the alternative is a database round trip
 * on every unauthenticated request, which is a free way to run up the bill.
 */
const failures = new Map<string, { count: number; until: number }>();
const LOCKOUT_AFTER = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const clientIp = (req: Request) =>
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

const lockedOut = (ip: string) => {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (Date.now() > entry.until) {
        failures.delete(ip);
        return false;
    }
    return entry.count >= LOCKOUT_AFTER;
};

const noteFailure = (ip: string) => {
    const entry = failures.get(ip) ?? { count: 0, until: 0 };
    entry.count += 1;
    entry.until = Date.now() + LOCKOUT_MS;
    failures.set(ip, entry);
};

Deno.serve(async req => {
    const cors = corsFor(req.headers.get('origin'));

    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    const ip = clientIp(req);
    if (lockedOut(ip)) {
        return json({ error: 'Too many attempts. Try again later.' }, 429, cors);
    }

    let password = '';
    let days = 30;
    try {
        const body = await req.json();
        password = typeof body.password === 'string' ? body.password : '';
        if (Number.isFinite(body.days)) days = Math.min(365, Math.max(1, Math.trunc(body.days)));
    } catch {
        return json({ error: 'Bad request' }, 400, cors);
    }

    if (!(await passwordMatches(password))) {
        noteFailure(ip);
        // A uniform delay on failure, so response time cannot be used to tell
        // "wrong password" apart from "no password configured".
        await new Promise(r => setTimeout(r, 400));
        return json({ error: 'Incorrect password.' }, 401, cors);
    }

    failures.delete(ip);

    // Postgres does the aggregation; nothing raw crosses the wire.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/analytics_summary`, {
        method: 'POST',
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ window_days: days }),
    });

    if (!response.ok) {
        return json({ error: `Query failed (${response.status})` }, 502, cors);
    }

    return json(await response.json(), 200, cors);
});
