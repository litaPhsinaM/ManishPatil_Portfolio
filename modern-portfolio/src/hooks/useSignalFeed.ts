import { useEffect, useMemo, useState } from 'react';

export type SignalTabId = 'security' | 'ai' | 'dev';

export interface FeedItem {
    id: string;
    title: string;
    url: string;
    source: string;
    date: string;
    summary: string;
    meta: string[];
    discussion?: string;
    flag?: string | null;
}

export interface LogEntry {
    t: string;
    level: 'info' | 'warn' | 'error';
    msg: string;
}

export interface FeedPayload {
    generatedAt: string;
    /* Written by scripts/fetch-feeds.mjs. Optional because a feeds.json produced
       before the log existed is still perfectly valid data, and the deployed file
       only gains a log on the next scheduled run. */
    log?: LogEntry[];
    feeds: Partial<Record<SignalTabId, FeedItem[]>>;
}

/* The workflow runs daily. If the newest data is older than this, something has
   broken upstream and the page says so instead of quietly showing stale news. */
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export const useSignalFeed = () => {
    const [payload, setPayload] = useState<FeedPayload | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    // Measured once, when the data lands. Reading the clock during render is impure
    // and would make the badge flicker between renders.
    const [isStale, setIsStale] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${import.meta.env.BASE_URL}data/feeds.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`feeds responded ${response.status}`);
                return response.json();
            })
            .then((data: FeedPayload) => {
                const generated = new Date(data.generatedAt).getTime();
                setIsStale(Number.isNaN(generated) || Date.now() - generated > STALE_AFTER_MS);
                setPayload(data);
                setStatus('ready');
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setStatus('error');
            });

        return () => controller.abort();
    }, []);

    const totalItems = useMemo(
        () => Object.values(payload?.feeds ?? {}).reduce((sum, items) => sum + items.length, 0),
        [payload]
    );

    return { payload, status, totalItems, isStale };
};
