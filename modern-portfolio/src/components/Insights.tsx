import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/Insights.css';

/**
 * insights.exe — the private analytics dashboard.
 *
 * Opened from the one Help button on the site that does anything (the footer's).
 * The password is checked by the `insights` Edge Function, never here: this
 * component holds it in React state only, sends it with each request, and never
 * writes it to storage. There is no client-side "is logged in" flag worth
 * forging, because every render of real data requires a server round trip.
 *
 * Every chart is a single series, so identity always comes from a row label and
 * never from color alone. One data hue (#1084d0, the Win98 active title bar
 * blue) on white sunken panels: validated at >= 3:1 against white, where the same
 * blue on the gray window chrome only reaches 2.21:1.
 */

const FUNCTION_URL =
    (import.meta.env.VITE_INSIGHTS_FUNCTION as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_URL
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights`
        : undefined);

/**
 * The function is deployed with "Verify JWT" on, so the platform drops any call
 * without a valid key before our code runs. That is not the security boundary —
 * this key ships in the bundle — it just means internet-wide scanners never cost
 * us an invocation. The password is still what actually guards the data.
 */
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

interface Summary {
    window_days: number;
    generated_at: string;
    totals: {
        visits: number;
        bots_filtered: number;
        engaged_visits: number;
        median_seconds: number;
        mean_seconds: number;
    };
    daily: { day: string; visits: number }[];
    referrers: { source: string; visits: number }[];
    devices: { device: string; visits: number }[];
    sections: { section: string; visits: number }[];
    clicks: { label: string; clicks: number; visits: number }[];
    games: { game: string; plays: number }[];
}

const formatSeconds = (s: number) => {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem ? `${m}m ${rem}s` : `${m}m`;
};

const formatDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Win98-styled hover tooltip: pale yellow, 1px black, exactly like a real one. */
const useTooltip = () => {
    const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
    const show = (event: React.MouseEvent, text: string) => {
        const host = event.currentTarget.closest('.insights-body') as HTMLElement | null;
        const box = host?.getBoundingClientRect();
        setTip({
            x: event.clientX - (box?.left ?? 0),
            y: event.clientY - (box?.top ?? 0),
            text,
        });
    };
    const hide = () => setTip(null);
    return { tip, show, hide };
};

interface StatProps {
    label: string;
    value: string;
    sub?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, sub }) => (
    <div className="insights-stat">
        <div className="insights-stat-label">{label}</div>
        <div className="insights-stat-value">{value}</div>
        {sub && <div className="insights-stat-sub">{sub}</div>}
    </div>
);

interface BarRowsProps {
    rows: { label: string; value: number; hint?: string }[];
    empty: string;
    unit?: string;
    onHover: (event: React.MouseEvent, text: string) => void;
    onLeave: () => void;
}

/** Ranked horizontal bars. Doubles as the table view: every row shows its value. */
const BarRows: React.FC<BarRowsProps> = ({ rows, empty, unit = '', onHover, onLeave }) => {
    if (!rows.length) return <p className="insights-empty">{empty}</p>;
    const max = Math.max(...rows.map(r => r.value), 1);
    return (
        <ul className="insights-bars">
            {rows.map(row => (
                <li
                    key={row.label}
                    className="insights-bar-row"
                    onMouseMove={e => onHover(e, row.hint ?? `${row.label}: ${row.value}${unit}`)}
                    onMouseLeave={onLeave}
                >
                    <span className="insights-bar-label" title={row.label}>{row.label}</span>
                    <span className="insights-bar-track">
                        <span
                            className="insights-bar-fill"
                            style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%` }}
                        />
                    </span>
                    <span className="insights-bar-value">{row.value}{unit}</span>
                </li>
            ))}
        </ul>
    );
};

interface DailyChartProps {
    data: { day: string; visits: number }[];
    onHover: (event: React.MouseEvent, text: string) => void;
    onLeave: () => void;
}

const DailyChart: React.FC<DailyChartProps> = ({ data, onHover, onLeave }) => {
    if (!data.length) return <p className="insights-empty">No visits recorded yet.</p>;
    const max = Math.max(...data.map(d => d.visits), 1);
    // Selective direct labels: the busiest day only, never a number on every bar.
    const peak = data.reduce((a, b) => (b.visits > a.visits ? b : a));
    return (
        <div className="insights-chart">
            <div className="insights-chart-plot" role="img" aria-label={`Visits per day. Peak ${peak.visits} on ${formatDay(peak.day)}.`}>
                {data.map(d => (
                    <div
                        key={d.day}
                        className="insights-col"
                        onMouseMove={e => onHover(e, `${formatDay(d.day)} — ${d.visits} visit${d.visits === 1 ? '' : 's'}`)}
                        onMouseLeave={onLeave}
                    >
                        {d.day === peak.day && d.visits > 0 && (
                            <span className="insights-col-label">{d.visits}</span>
                        )}
                        <div
                            className="insights-col-fill"
                            // Bars top out at 88% so the peak's direct label has room
                            // above it. At 100% the label sat on the fill and turned
                            // unreadable the moment the bar darkened on hover.
                            style={{ height: `${Math.max((d.visits / max) * 84, 2)}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="insights-chart-axis">
                <span>{formatDay(data[0].day)}</span>
                <span>{formatDay(data[data.length - 1].day)}</span>
            </div>
        </div>
    );
};

interface InsightsProps {
    open: boolean;
    onClose: () => void;
}

const Insights: React.FC<InsightsProps> = ({ open, onClose }) => {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [range, setRange] = useState<Range>(30);
    const [data, setData] = useState<Summary | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { tip, show, hide } = useTooltip();

    const load = useCallback(
        async (secret: string, days: Range) => {
            if (!FUNCTION_URL) {
                setError('Analytics is not configured in this build.');
                return;
            }
            setLoading(true);
            setError('');
            try {
                const response = await fetch(FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(ANON_KEY
                            ? { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
                            : {}),
                    },
                    body: JSON.stringify({ password: secret, days }),
                });
                const body = await response.json();
                if (!response.ok) {
                    setError(body?.error ?? `Request failed (${response.status})`);
                    if (response.status === 401) setAuthed(false);
                    return;
                }
                setData(body as Summary);
                setAuthed(true);
            } catch {
                setError('Could not reach the server.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const changeRange = (days: Range) => {
        setRange(days);
        if (authed) load(password, days);
    };

    const totals = data?.totals;
    const engagedPct = totals && totals.visits
        ? Math.round((totals.engaged_visits / totals.visits) * 100)
        : 0;

    return (
        <div className="insights-overlay" onClick={onClose}>
            <div
                className="window insights-window"
                role="dialog"
                aria-modal="true"
                aria-label="insights.exe"
                onClick={e => e.stopPropagation()}
            >
                <div className="title-bar">
                    <div className="title-bar-text">🔒 insights.exe</div>
                    <div className="title-bar-controls">
                        <button aria-label="Close" onClick={onClose} />
                    </div>
                </div>

                {!authed ? (
                    <div className="window-body insights-login">
                        <p className="insights-login-text">
                            This program is restricted. Enter the administrator password.
                        </p>
                        <form
                            className="insights-login-row"
                            onSubmit={e => { e.preventDefault(); load(password, range); }}
                        >
                            <label htmlFor="insights-password">Password</label>
                            <input
                                id="insights-password"
                                ref={inputRef}
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="off"
                            />
                            <button type="submit" className="btn" disabled={loading || !password}>
                                {loading ? 'Checking…' : 'OK'}
                            </button>
                        </form>
                        {error && <p className="insights-error">⚠ {error}</p>}
                    </div>
                ) : (
                    <>
                        <div className="win98-menubar insights-menubar">
                            <span>File</span>
                            <span>View</span>
                            <span>Help</span>
                            <div className="insights-ranges">
                                {RANGES.map(r => (
                                    <button
                                        key={r}
                                        className={`insights-range-btn${r === range ? ' is-active' : ''}`}
                                        onClick={() => changeRange(r)}
                                    >
                                        {r}d
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="window-body insights-body">
                            {loading && <div className="insights-loading">Loading…</div>}
                            {error && <p className="insights-error">⚠ {error}</p>}

                            {data && (
                                <>
                                    <div className="insights-stats">
                                        <Stat
                                            label="Visits"
                                            value={String(totals!.visits)}
                                            sub={`${totals!.bots_filtered} bots filtered`}
                                        />
                                        <Stat
                                            label="Median time"
                                            value={formatSeconds(totals!.median_seconds)}
                                            sub={`mean ${formatSeconds(totals!.mean_seconds)}`}
                                        />
                                        <Stat
                                            label="Scrolled in"
                                            value={`${engagedPct}%`}
                                            sub={`${totals!.engaged_visits} of ${totals!.visits}`}
                                        />
                                        <Stat
                                            label="Window"
                                            value={`${data.window_days}d`}
                                            sub={new Date(data.generated_at).toLocaleString()}
                                        />
                                    </div>

                                    <section className="insights-panel">
                                        <h3 className="insights-panel-title">Visits per day</h3>
                                        <DailyChart data={data.daily} onHover={show} onLeave={hide} />
                                    </section>

                                    <div className="insights-grid">
                                        <section className="insights-panel">
                                            <h3 className="insights-panel-title">Where they came from</h3>
                                            <BarRows
                                                rows={data.referrers.map(r => ({ label: r.source, value: r.visits }))}
                                                empty="No referrers yet."
                                                onHover={show}
                                                onLeave={hide}
                                            />
                                        </section>

                                        <section className="insights-panel">
                                            <h3 className="insights-panel-title">How far they got</h3>
                                            <BarRows
                                                rows={data.sections.map(s => ({ label: s.section, value: s.visits }))}
                                                empty="No sections reached yet."
                                                onHover={show}
                                                onLeave={hide}
                                            />
                                        </section>

                                        <section className="insights-panel">
                                            <h3 className="insights-panel-title">What they clicked</h3>
                                            <BarRows
                                                rows={data.clicks.map(c => ({
                                                    label: c.label,
                                                    value: c.clicks,
                                                    hint: `${c.label}: ${c.clicks} clicks from ${c.visits} visits`,
                                                }))}
                                                empty="No clicks recorded yet."
                                                onHover={show}
                                                onLeave={hide}
                                            />
                                        </section>

                                        <section className="insights-panel">
                                            <h3 className="insights-panel-title">Devices</h3>
                                            <BarRows
                                                rows={data.devices.map(d => ({ label: d.device, value: d.visits }))}
                                                empty="No devices recorded yet."
                                                onHover={show}
                                                onLeave={hide}
                                            />
                                            {data.games.length > 0 && (
                                                <>
                                                    <h3 className="insights-panel-title insights-panel-title-gap">Games played</h3>
                                                    <BarRows
                                                        rows={data.games.map(g => ({ label: g.game, value: g.plays }))}
                                                        empty="No games played yet."
                                                        onHover={show}
                                                        onLeave={hide}
                                                    />
                                                </>
                                            )}
                                        </section>
                                    </div>
                                </>
                            )}

                            {tip && (
                                <div className="insights-tooltip" style={{ left: tip.x + 12, top: tip.y + 16 }}>
                                    {tip.text}
                                </div>
                            )}
                        </div>

                        <div className="win98-statusbar insights-statusbar">
                            <div className="win98-panel">{data ? `${data.totals.visits} visit(s)` : '—'}</div>
                            <div className="win98-panel" style={{ flex: 1 }}>
                                Last {range} days
                            </div>
                            <div className="win98-panel">Private</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Insights;
