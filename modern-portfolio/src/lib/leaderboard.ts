/**
 * Snake leaderboard client.
 *
 * Talks to Supabase's REST layer with plain fetch rather than pulling in the
 * supabase-js SDK — two queries against one table does not justify the bundle.
 *
 * Everything here degrades quietly. If the environment variables are missing (local
 * dev, a fork, a build without secrets) or the request fails, the board reports
 * itself unavailable and the game falls back to the local high score. A napping free
 * tier must never make the site look broken.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const leaderboardEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Matches the CHECK constraints in supabase/schema.sql. */
export const MAX_SCORE = 3990;
export const INITIALS_PATTERN = /^[A-Z]{3}$/;

export interface ScoreRow {
    initials: string;
    score: number;
    created_at: string;
}

const REQUEST_TIMEOUT_MS = 8000;

const headers = () => ({
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
});

const withTimeout = async (input: string, init: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

export const fetchTopScores = async (limit = 10): Promise<ScoreRow[]> => {
    if (!leaderboardEnabled) return [];

    const query = new URLSearchParams({
        select: 'initials,score,created_at',
        order: 'score.desc,created_at.asc',
        limit: String(limit),
    });

    const response = await withTimeout(
        `${SUPABASE_URL}/rest/v1/snake_scores?${query}`,
        { method: 'GET', headers: headers() }
    );

    if (!response.ok) throw new Error(`leaderboard read failed (${response.status})`);
    return (await response.json()) as ScoreRow[];
};

export const submitScore = async (initials: string, score: number): Promise<void> => {
    if (!leaderboardEnabled) throw new Error('leaderboard disabled');

    const cleaned = initials.trim().toUpperCase();
    // Checked here as well as in the database so an obviously bad submission fails
    // instantly instead of costing a round trip.
    if (!INITIALS_PATTERN.test(cleaned)) throw new Error('initials must be three letters A-Z');
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) throw new Error('implausible score');

    const response = await withTimeout(`${SUPABASE_URL}/rest/v1/snake_scores`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({ initials: cleaned, score }),
    });

    if (!response.ok) throw new Error(`leaderboard write failed (${response.status})`);
};
