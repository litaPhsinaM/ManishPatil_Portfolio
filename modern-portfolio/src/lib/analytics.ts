/**
 * First-party analytics.
 *
 * Writes straight to Supabase's REST layer with plain fetch, same as
 * leaderboard.ts — the tables are insert-only for anon and carry no select
 * policy, so this file can only ever add rows, never read them back. Reading
 * happens in the `insights` Edge Function.
 *
 * Everything degrades quietly. Missing environment variables, a blocked request,
 * a napping free tier: the site behaves exactly as if analytics did not exist.
 * Nothing here is ever allowed to throw into the page.
 *
 * What is deliberately NOT collected: no cookies, no IP addresses, no
 * fingerprinting, no names, nothing typed into any field. A session id lives in
 * sessionStorage and dies with the tab, which is why this needs no consent banner.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const SESSION_KEY = 'mp_session';
const OPTOUT_KEY = 'mp_notrack';

/** Flush cadence while the tab is open. Also flushed on hide and on pagehide. */
const FLUSH_INTERVAL_MS = 10_000;
/** How often the engagement pulse is queued. */
const PULSE_INTERVAL_MS = 15_000;
/** A queue this long means something is wrong; drop rather than grow forever. */
const MAX_QUEUE = 60;

type EventKind = 'section' | 'click' | 'game' | 'pulse';

interface QueuedEvent {
    session_id: string;
    kind: EventKind;
    label: string;
    value?: number;
}

const isBot = () => {
    if (typeof navigator === 'undefined') return true;
    if (navigator.webdriver) return true;
    return /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i.test(navigator.userAgent);
};

/**
 * Own visits would otherwise dominate every number on the dashboard. Hitting the
 * site once with ?notrack=1 sets this for good on that browser.
 */
const isOptedOut = () => {
    try {
        if (new URLSearchParams(window.location.search).get('notrack') !== null) {
            localStorage.setItem(OPTOUT_KEY, '1');
        }
        return localStorage.getItem(OPTOUT_KEY) === '1';
    } catch {
        return false; // Private mode with storage blocked: not an opt-out signal.
    }
};

const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let enabled = false;
let sessionId = '';
let queue: QueuedEvent[] = [];
let flushTimer: number | undefined;
let pulseTimer: number | undefined;

/** Active milliseconds only — time with the tab hidden does not count. */
let activeMs = 0;
let lastResume = 0;

const headers = () => ({
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    // Without this PostgREST echoes the inserted rows back, which we never read.
    Prefer: 'return=minimal',
});

const send = (table: string, body: unknown, keepalive: boolean) =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
        keepalive,
    });

/**
 * A napping free-tier project answers the first request after an idle period with
 * a 503 while it wakes. Observed in production on the very first visit insert.
 *
 * That matters more than it looks: the visit row is written once per session, so
 * a swallowed 503 does not lose an event, it loses the entire session from the
 * stats. One retry after a short pause covers the wake-up window.
 *
 * Skipped for keepalive sends — those happen as the tab is closing, where there
 * is no "later" to retry in.
 */
const post = async (table: string, body: unknown, keepalive = false) => {
    try {
        const response = await send(table, body, keepalive);
        if (response.ok || keepalive || response.status < 500) return;
    } catch {
        if (keepalive) return;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    await send(table, body, keepalive).catch(() => undefined);
};

const deviceClass = (): 'mobile' | 'tablet' | 'desktop' => {
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
};

/** Hostname only. Never the full referring URL, which can carry query strings. */
const referrerHost = (): string => {
    if (!document.referrer) return '';
    try {
        const host = new URL(document.referrer).hostname;
        return host === window.location.hostname ? '' : host.slice(0, 128);
    } catch {
        return '';
    }
};

const sessionIdFor = (): { id: string; fresh: boolean } => {
    try {
        const existing = sessionStorage.getItem(SESSION_KEY);
        if (existing) return { id: existing, fresh: false };
        const id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, id);
        return { id, fresh: true };
    } catch {
        // Storage blocked: still track, just as a one-off session.
        return { id: crypto.randomUUID(), fresh: true };
    }
};

const accumulate = () => {
    if (lastResume) {
        activeMs += Date.now() - lastResume;
        lastResume = document.visibilityState === 'visible' ? Date.now() : 0;
    }
};

const flush = (keepalive = false) => {
    if (!enabled || queue.length === 0) return;
    const batch = queue;
    queue = [];
    post('events', batch, keepalive);
};

const scheduleFlush = () => {
    if (flushTimer !== undefined) return;
    flushTimer = window.setTimeout(() => {
        flushTimer = undefined;
        flush();
    }, FLUSH_INTERVAL_MS);
};

/** Queue one event. Safe to call before init and safe to call when disabled. */
export const track = (kind: EventKind, label: string, value?: number) => {
    if (!enabled) return;
    if (queue.length >= MAX_QUEUE) return;
    queue.push({ session_id: sessionId, kind, label: label.slice(0, 64), value });
    scheduleFlush();
};

/** Fired once per section per session by the observer below. */
const seenSections = new Set<string>();

const watchSections = () => {
    const sections = document.querySelectorAll<HTMLElement>('section[id]');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
        entries => {
            for (const entry of entries) {
                const id = entry.target.id;
                if (!entry.isIntersecting || seenSections.has(id)) continue;
                seenSections.add(id);
                track('section', id);
            }
        },
        // Half of it on screen, so a section flying past during a fast scroll to the
        // footer does not count as "they read this".
        { threshold: 0.5 }
    );
    sections.forEach(s => observer.observe(s));
};

/**
 * One delegated listener for the whole page. Elements opt in with data-track;
 * outbound links are labelled by hostname automatically so link clicks are
 * counted without having to annotate every anchor.
 */
const watchClicks = () => {
    document.addEventListener(
        'click',
        event => {
            const target = event.target as Element | null;
            if (!target?.closest) return;

            const tagged = target.closest<HTMLElement>('[data-track]');
            if (tagged?.dataset.track) {
                track('click', tagged.dataset.track);
                return;
            }

            const link = target.closest<HTMLAnchorElement>('a[href]');
            if (!link) return;
            const href = link.getAttribute('href') || '';
            if (href.startsWith('mailto:')) return track('click', 'contact:email');
            if (href.startsWith('tel:')) return track('click', 'contact:phone');
            if (href.startsWith('#') || href.startsWith('/')) return;
            try {
                track('click', `link:${new URL(href, window.location.href).hostname}`);
            } catch {
                /* not a URL we can label; skip rather than guess */
            }
        },
        { capture: true, passive: true }
    );
};

const watchEngagement = () => {
    lastResume = document.visibilityState === 'visible' ? Date.now() : 0;

    pulseTimer = window.setInterval(() => {
        accumulate();
        if (activeMs > 0) track('pulse', 'active', activeMs);
    }, PULSE_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            accumulate();
            lastResume = 0;
            if (activeMs > 0) track('pulse', 'active', activeMs);
            // The tab may never come back, so this batch goes out now. keepalive
            // lets the request outlive the page; a plain fetch would be cancelled.
            flush(true);
        } else {
            lastResume = Date.now();
        }
    });

    // Safari fires pagehide rather than a final visibilitychange in some flows.
    window.addEventListener('pagehide', () => {
        accumulate();
        if (activeMs > 0) track('pulse', 'active', activeMs);
        flush(true);
    });
};

/**
 * Call once, after first paint. Idempotent.
 */
export const initAnalytics = () => {
    if (enabled || !configured) return;
    if (isBot() || isOptedOut()) return;
    if (window.location.hostname === 'localhost') return;

    const { id, fresh } = sessionIdFor();
    sessionId = id;
    enabled = true;

    if (fresh) {
        post('visits', {
            session_id: sessionId,
            referrer: referrerHost() || null,
            landing_path: window.location.hash.slice(0, 128) || '/',
            device: deviceClass(),
            screen_w: window.innerWidth,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 64) ?? null,
            is_bot: false,
        });
    }

    watchSections();
    watchClicks();
    watchEngagement();
};

/** Used by the teardown path in tests and by hot reload; not needed in prod. */
export const stopAnalytics = () => {
    if (flushTimer !== undefined) clearTimeout(flushTimer);
    if (pulseTimer !== undefined) clearInterval(pulseTimer);
    flushTimer = pulseTimer = undefined;
    enabled = false;
};
