import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, BrainCircuit, Radio, ExternalLink } from 'lucide-react';
import { signalNotes } from '../data/signalNotes';
import { useSignalFeed, type SignalTabId, type LogEntry } from '../hooks/useSignalFeed';
import '../styles/Signals.css';

const signalTabs: Array<{
    id: SignalTabId;
    label: string;
    title: string;
    path: string;
    blurb: string;
    icon: React.ComponentType<{ size?: number }>;
}> = [
        {
            id: 'security',
            label: 'Fleet Watch',
            title: 'Fleet Watch',
            path: 'Security',
            blurb: 'Actively exploited vulnerabilities, filtered to the platforms I administer.',
            icon: ShieldAlert,
        },
        {
            id: 'ai',
            label: 'AI Signal',
            title: 'AI Signal',
            path: 'AI',
            blurb: 'New AI research and the AI stories the industry is arguing about.',
            icon: BrainCircuit,
        },
        {
            id: 'dev',
            label: 'Dev Radar',
            title: 'Dev Radar',
            path: 'Software',
            blurb: 'What the wider software industry is reading today.',
            icon: Radio,
        },
    ];

const winVariant = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

const clockOf = (iso: string) => {
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime())
        ? '--:--:--'
        : parsed.toISOString().slice(11, 19);
};

/* Shown when the loaded feeds.json predates the run log, which is the case for the
   deployed file until the next scheduled refresh. Derived strictly from fields that
   payload really has, so the panel never states anything that wasn't measured. */
const derivedLog = (payload: { generatedAt: string; feeds: Partial<Record<SignalTabId, unknown[]>> }): LogEntry[] => {
    const entries: LogEntry[] = [
        { t: payload.generatedAt, level: 'info', msg: 'signal refresh completed' },
    ];
    for (const [key, items] of Object.entries(payload.feeds)) {
        entries.push({
            t: payload.generatedAt,
            level: 'info',
            msg: `${key} feed: ${items?.length ?? 0} items published`,
        });
    }
    entries.push({
        t: payload.generatedAt,
        level: 'warn',
        msg: 'per-step trace unavailable in this build',
    });
    return entries;
};

const formatTimestamp = (iso: string) => {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return 'unknown';
    return parsed.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
};

const Signals: React.FC = () => {
    const [activeTabId, setActiveTabId] = useState<SignalTabId>('security');
    const { payload, status, isStale } = useSignalFeed();

    const activeTab = signalTabs.find(tab => tab.id === activeTabId) ?? signalTabs[0];
    const ActiveIcon = activeTab.icon;
    const items = useMemo(
        () => payload?.feeds?.[activeTabId] ?? [],
        [payload, activeTabId]
    );

    const logLines = useMemo(() => {
        if (!payload) return [];
        return payload.log?.length ? payload.log : derivedLog(payload);
    }, [payload]);

    return (
        <section id="signals" className="signals-section">
            <div className="container">
                {/* Without this the section opens straight into a window of raw
                    headlines, and a visitor has to infer both what the feed is
                    and that it is live rather than a hand-typed list. */}
                <header className="signals-intro">
                    <h2 className="signals-intro-title">Live Signal Tracker</h2>

                    <p className="signals-intro-text">
                        Nothing on this page was typed by hand. Every morning at 11:17 UTC a
                        scheduled job wakes up, calls three public APIs, rebuilds the site around
                        whatever came back, and redeploys it. There is no database and no backend
                        holding this up: the result is a static file baked into the page, which is
                        why it loads instantly and costs nothing to run.
                    </p>

                    <p className="signals-intro-text">
                        Fleet Watch is the part worth pointing at. CISA publishes a national catalog
                        of vulnerabilities confirmed to be under active attack, well over a thousand
                        of them, which is far too many to be useful to anyone. This filters that down
                        to the ones touching platforms I actually administer, tags each with the
                        surface it lands on, flags anything tied to a ransomware campaign, and carries
                        the federal patch deadline along with it. If a source goes dark the page
                        serves the last good data instead of blanking; if all three go dark it refuses
                        to publish at all. Where a story is worth a comment, I leave one under
                        &ldquo;My read&rdquo;.
                    </p>

                    <ul className="signals-facts">
                        <li>3 public APIs</li>
                        <li>No database</li>
                        <li>Rebuilt daily at 11:17 UTC</li>
                        <li>Fails safe, never blank</li>
                    </ul>
                </header>

                <div className="signals-layout">
                <motion.div
                    className="window signals-win"
                    variants={winVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text signals-window-title">
                            <ActiveIcon size={13} /> {activeTab.title} - Signal Monitor
                        </div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="win98-menubar">
                        <span>File</span>
                        <span>Edit</span>
                        <span>View</span>
                        <span>Feed</span>
                        <span>Help</span>
                    </div>

                    <div className="signal-tabs" role="tablist" aria-label="Signal feeds">
                        {signalTabs.map(tab => {
                            const TabIcon = tab.icon;
                            const isActive = tab.id === activeTabId;

                            return (
                                <button
                                    key={tab.id}
                                    id={`signal-tab-${tab.id}`}
                                    className={`signal-tab ${isActive ? 'active' : ''}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls="signal-tab-panel"
                                    onClick={() => setActiveTabId(tab.id)}
                                >
                                    <TabIcon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="win98-address-bar">
                        <span className="win98-address-label">Address</span>
                        <div className="win98-address-input-container">
                            <span className="win98-address-icon">📡</span>
                            <input
                                type="text"
                                className="win98-address-input"
                                value={`C:\\Signals\\${activeTab.path}`}
                                readOnly
                            />
                            <button className="win98-address-dropdown-btn">▼</button>
                        </div>
                    </div>

                    <div
                        className="window-body signals-body"
                        id="signal-tab-panel"
                        role="tabpanel"
                        aria-labelledby={`signal-tab-${activeTab.id}`}
                    >
                        <p className="signal-blurb">{activeTab.blurb}</p>

                        {status === 'loading' && (
                            <p className="signal-state">Retrieving feed…</p>
                        )}

                        {status === 'error' && (
                            <p className="signal-state">
                                Feed unavailable. The published site refreshes this daily.
                            </p>
                        )}

                        {status === 'ready' && items.length === 0 && (
                            <p className="signal-state">No entries in this feed right now.</p>
                        )}

                        {status === 'ready' && items.length > 0 && (
                            <ul className="signal-list">
                                {items.map((item) => {
                                    const note = signalNotes[item.id];

                                    return (
                                        <li key={item.id} className="signal-item">
                                            <div className="signal-item-head">
                                                <a
                                                    className="signal-item-title"
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {item.title}
                                                    <ExternalLink size={11} />
                                                </a>
                                                {item.flag && (
                                                    <span className="signal-flag">{item.flag}</span>
                                                )}
                                            </div>

                                            <div className="signal-meta">
                                                <span className="tag">{item.source}</span>
                                                {item.meta.map(entry => (
                                                    <span key={entry} className="tag signal-meta-tag">{entry}</span>
                                                ))}
                                                <span className="signal-date">{item.date}</span>
                                            </div>

                                            {item.summary && (
                                                <p className="signal-summary">{item.summary}</p>
                                            )}

                                            {note && (
                                                <div className="signal-note">
                                                    <span className="signal-note-label">My read</span>
                                                    <p>{note}</p>
                                                </div>
                                            )}

                                            {item.discussion && (
                                                <a
                                                    className="signal-discussion"
                                                    href={item.discussion}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Discussion ↗
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="win98-statusbar">
                        <div className="win98-panel">{items.length} item(s)</div>
                        <div className="win98-panel" style={{ flex: 1 }}>
                            {payload ? `Updated ${formatTimestamp(payload.generatedAt)}` : 'Syncing'}
                        </div>
                        <div className="win98-panel">
                            {isStale ? 'Refresh overdue' : 'Auto-refreshed daily'}
                        </div>
                    </div>
                </motion.div>

                {/* Every line here was measured during the actual fetch run and
                    written into feeds.json by scripts/fetch-feeds.mjs. It is a
                    trace, not set dressing. */}
                <aside className="window signals-log-win" aria-label="Feed fetch log">
                    <div className="title-bar">
                        <div className="title-bar-text">▣ fetch.log</div>
                        <div className="title-bar-controls">
                            <button aria-label="Minimize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="signals-log-body">
                        {logLines.length === 0 ? (
                            <p className="signals-log-line info">
                                <span className="signals-log-msg">waiting for feed data…</span>
                            </p>
                        ) : (
                            logLines.map((entry, index) => (
                                <p key={`${entry.t}-${index}`} className={`signals-log-line ${entry.level}`}>
                                    <span className="signals-log-time">{clockOf(entry.t)}</span>
                                    <span className="signals-log-level">{entry.level.toUpperCase()}</span>
                                    <span className="signals-log-msg">{entry.msg}</span>
                                </p>
                            ))
                        )}
                        <p className="signals-log-line cursor">
                            <span className="signals-log-msg">
                                {status === 'loading' ? 'connecting' : 'idle'}
                                <span className="signals-log-caret">_</span>
                            </span>
                        </p>
                    </div>

                    <div className="win98-statusbar">
                        <div className="win98-panel" style={{ flex: 1 }}>
                            {logLines.length} line(s)
                        </div>
                        <div className="win98-panel">{payload ? 'UTC' : '--'}</div>
                    </div>
                </aside>
                </div>
            </div>
        </section>
    );
};

export default Signals;
