#!/usr/bin/env node
/**
 * Builds public/data/feeds.json from three public APIs.
 *
 *   security  CISA Known Exploited Vulnerabilities catalog (CC0 / public domain),
 *             filtered down to the platforms actually administered day to day.
 *   ai        arXiv cs.AI + cs.LG submissions, plus AI-tagged Hacker News stories.
 *   dev       Remaining Hacker News front page.
 *
 * Only factual metadata the sources publish for syndication is stored — headline,
 * link, date, and the source's own short description. No article bodies are copied
 * and every item keeps a link back to the original.
 *
 * Run with: npm run feeds
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = resolve(ROOT, 'public/data/feeds.json');

const TIMEOUT_MS = 30_000;
const MAX_PER_FEED = 14;
const USER_AGENT = 'ManishPatilPortfolio/1.0 (+https://github.com/litaPhsinaM/ManishPatil_Portfolio)';

/* The platforms actually under management — this is what turns a 1,600-entry
   national catalog into a short list that's genuinely worth reading.
   Order matters: the first match wins, and vendor names overlap. "Fortinet FortiOS"
   and "Cisco IOS" both contain the letters "ios", so network gear has to be matched
   before Apple or a firewall CVE gets filed under macOS. */
const FLEET_SURFACES = [
    { label: 'Network edge / VPN', re: /\b(fortinet|forti\w*|palo alto|cisco|ivanti|pulse secure|citrix|sonicwall|zyxel|netgear|juniper|f5)\b/i },
    { label: 'macOS / Apple', re: /\b(apple|macos|mac os|iphone|ipados|safari|watchos|tvos)\b/i },
    { label: 'Google / Chrome', re: /\b(google|chrome|chromium|android)\b/i },
    { label: 'Windows', re: /\b(microsoft|windows)\b/i },
    { label: 'Virtualization', re: /\b(vmware|broadcom|virtualbox|hyper-v)\b/i },
    { label: 'Linux', re: /\b(linux|red hat|debian|ubuntu|kernel)\b/i },
    { label: 'Databases', re: /\b(postgresql|postgres|mysql|mongodb|oracle)\b/i },
    { label: 'Web stack', re: /\b(node\.js|npm|apache|nginx|wordpress|php|drupal|tomcat)\b/i },
];

const AI_TOPIC = /\b(ai|a\.i\.|llm|llms|gpt|claude|gemini|openai|anthropic|deepmind|neural|transformer|diffusion|inference|embedding|fine-tun\w*|machine learning|deep learning)\b/i;

const fetchWithTimeout = async (url, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
            headers: { 'User-Agent': USER_AGENT, ...(init.headers ?? {}) },
        });
        if (!response.ok) throw new Error(`${url} responded ${response.status}`);
        return response;
    } finally {
        clearTimeout(timer);
    }
};

const decodeEntities = (text) =>
    text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&amp;/g, '&');

const clamp = (text, max) => {
    const flat = decodeEntities(String(text ?? '')).replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

/* ── CISA KEV ───────────────────────────────────────────────────────────── */
const fetchSecurity = async () => {
    const response = await fetchWithTimeout(
        'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
    );
    const catalog = await response.json();

    return catalog.vulnerabilities
        .map((vuln) => {
            const haystack = `${vuln.vendorProject} ${vuln.product}`;
            const surface = FLEET_SURFACES.find((entry) => entry.re.test(haystack));
            return surface ? { vuln, surface } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.vuln.dateAdded.localeCompare(a.vuln.dateAdded))
        .slice(0, MAX_PER_FEED)
        .map(({ vuln, surface }) => ({
            id: vuln.cveID,
            title: clamp(vuln.vulnerabilityName, 140),
            url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`,
            source: 'CISA KEV',
            date: vuln.dateAdded,
            summary: clamp(vuln.shortDescription, 320),
            meta: [surface.label, clamp(vuln.vendorProject, 28), `Patch by ${vuln.dueDate}`],
            flag: vuln.knownRansomwareCampaignUse === 'Known' ? 'RANSOMWARE' : null,
        }));
};

/* ── arXiv ──────────────────────────────────────────────────────────────── */
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const fetchArxiv = async () => {
    const query = new URLSearchParams({
        search_query: 'cat:cs.AI OR cat:cs.LG',
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: '12',
    });
    const url = `https://export.arxiv.org/api/query?${query}`;

    // arXiv asks callers to stay under one request every 3 seconds and answers 429
    // when you don't. Back off and retry rather than losing the whole feed.
    let response;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            response = await fetchWithTimeout(url);
            break;
        } catch (error) {
            if (attempt === 2) throw error;
            await sleep(4000 * (attempt + 1));
        }
    }
    const xml = await response.text();

    const pick = (block, tag) => {
        const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
        return match ? match[1] : '';
    };

    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, block]) => {
        const authors = [...block.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1].trim());
        const link = pick(block, 'id').trim();
        return {
            id: link,
            title: clamp(pick(block, 'title'), 150),
            url: link,
            source: 'arXiv',
            date: pick(block, 'published').slice(0, 10),
            summary: clamp(pick(block, 'summary'), 320),
            meta: [
                'Research',
                authors[0] ? `${authors[0]}${authors.length > 1 ? ` +${authors.length - 1}` : ''}` : 'arXiv',
            ],
            flag: null,
        };
    });
};

/* ── Hacker News ────────────────────────────────────────────────────────── */
const fetchHackerNews = async () => {
    const response = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = (await response.json()).slice(0, 60);

    const stories = [];
    // Small batches — polite to an unauthenticated public API, and fast enough.
    for (let i = 0; i < ids.length; i += 10) {
        const batch = await Promise.all(
            ids.slice(i, i + 10).map(async (id) => {
                try {
                    const item = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    return await item.json();
                } catch {
                    return null;
                }
            })
        );
        stories.push(...batch.filter((story) => story && story.type === 'story' && story.title));
    }

    return stories.map((story) => ({
        id: `hn-${story.id}`,
        title: clamp(story.title, 150),
        url: story.url ?? `https://news.ycombinator.com/item?id=${story.id}`,
        source: 'Hacker News',
        date: new Date(story.time * 1000).toISOString().slice(0, 10),
        summary: '',
        meta: [`${story.score ?? 0} points`, `${story.descendants ?? 0} comments`],
        discussion: `https://news.ycombinator.com/item?id=${story.id}`,
        flag: null,
    }));
};

/* ── Assembly ───────────────────────────────────────────────────────────── */
const readPrevious = async () => {
    try {
        return JSON.parse(await readFile(OUT_FILE, 'utf8'));
    } catch {
        return { feeds: {} };
    }
};

const run = async () => {
    const previous = await readPrevious();
    const feeds = {};
    const failures = [];

    // Each source is isolated: one outage must not blank out the other two, and a
    // failed fetch keeps the last good data rather than publishing an empty tab.
    const keep = (key, items) => {
        if (items.length > 0) {
            feeds[key] = items;
            return;
        }
        failures.push(`${key} returned nothing`);
        feeds[key] = previous.feeds?.[key] ?? [];
    };

    let hackerNews = [];
    try {
        hackerNews = await fetchHackerNews();
    } catch (error) {
        failures.push(`hacker news: ${error.message}`);
    }

    try {
        keep('security', await fetchSecurity());
    } catch (error) {
        failures.push(`security: ${error.message}`);
        feeds.security = previous.feeds?.security ?? [];
    }

    let arxiv = [];
    try {
        arxiv = await fetchArxiv();
    } catch (error) {
        failures.push(`arxiv: ${error.message}`);
    }

    const aiStories = hackerNews.filter((story) => AI_TOPIC.test(story.title));
    const aiStoryIds = new Set(aiStories.map((story) => story.id));

    keep(
        'ai',
        [...arxiv, ...aiStories]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, MAX_PER_FEED)
    );
    keep('dev', hackerNews.filter((story) => !aiStoryIds.has(story.id)).slice(0, MAX_PER_FEED));

    const payload = {
        generatedAt: new Date().toISOString(),
        feeds,
    };

    await mkdir(dirname(OUT_FILE), { recursive: true });
    await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    for (const [key, items] of Object.entries(feeds)) {
        console.log(`${key.padEnd(9)} ${items.length} items`);
    }
    if (failures.length > 0) {
        console.warn(`\nRecovered from ${failures.length} problem(s):`);
        for (const failure of failures) console.warn(`  - ${failure}`);
    }

    // Every feed empty means the run produced nothing usable — fail loudly so the
    // workflow surfaces it instead of silently deploying a dead page.
    if (Object.values(feeds).every((items) => items.length === 0)) {
        throw new Error('all feeds empty — refusing to publish');
    }
};

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
