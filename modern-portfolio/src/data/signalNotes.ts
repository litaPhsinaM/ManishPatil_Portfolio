/**
 * Your own take on individual feed items.
 *
 * The feed itself updates automatically every day and needs nothing from you.
 * This file is the part that makes it yours — a short, human read on why an item
 * matters. Items without a note render normally, so this can stay as empty as you
 * like and the page still works.
 *
 * The key is the item `id` shown in the feed:
 *   - CISA KEV   → the CVE id, e.g. "CVE-2025-53770"
 *   - Hacker News→ "hn-<id>", e.g. "hn-41234567"
 *   - arXiv      → the full paper URL
 *
 * You can edit this straight from github.com (even on a phone) — committing the
 * change redeploys the site on its own.
 *
 * Example of the shape:
 *   "CVE-2025-53770": "Not in our fleet — we don't run on-prem SharePoint. Worth
 *      watching anyway because the same deserialization pattern shows up in ...",
 */
export const signalNotes: Record<string, string> = {
    // Add entries here as you work through the feed.
};
