#!/usr/bin/env node
/**
 * Imports ChatGPT's Q&A JSON into the faq table.
 *
 *   node scripts/import-faq.mjs faq-source/answers.json            # preview only
 *   node scripts/import-faq.mjs faq-source/answers.json --write    # actually insert
 *
 * Accepts one JSON array, or several concatenated arrays if the output came back
 * split across messages — paste them into one file and it will find them all.
 *
 * Validates before writing, because a bad answer bank is worse than none: this
 * text is shown to recruiters as fact about a real person, and a duplicate or
 * malformed entry degrades matching for every other question too.
 *
 * Requires DATABASE_URL, e.g.
 *   DATABASE_URL='postgresql://postgres.<ref>:<pw>@<host>:5432/postgres?sslmode=require'
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const [, , file, ...flags] = process.argv;
const write = flags.includes('--write');

if (!file) {
    console.error('usage: node scripts/import-faq.mjs <answers.json> [--write]');
    process.exit(1);
}

/** ChatGPT often wraps output in prose or fences, and may split it across arrays. */
const extractArrays = (raw) => {
    const cleaned = raw.replace(/```(?:json)?/g, '');
    const entries = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < cleaned.length; i += 1) {
        if (cleaned[i] === '[') {
            if (depth === 0) start = i;
            depth += 1;
        } else if (cleaned[i] === ']') {
            depth -= 1;
            if (depth === 0 && start !== -1) {
                try {
                    const parsed = JSON.parse(cleaned.slice(start, i + 1));
                    if (Array.isArray(parsed)) entries.push(...parsed);
                } catch {
                    /* not a JSON array — skip */
                }
                start = -1;
            }
        }
    }
    return entries;
};

const raw = await readFile(file, 'utf8');
const rows = extractArrays(raw);

if (rows.length === 0) {
    console.error('No JSON arrays found in that file.');
    process.exit(1);
}

const problems = [];
const seen = new Map();
const clean = [];

rows.forEach((row, index) => {
    const at = `entry ${index + 1}`;
    const question = typeof row.question === 'string' ? row.question.trim() : '';
    const answer = typeof row.answer === 'string' ? row.answer.trim() : '';
    const aliases = Array.isArray(row.aliases)
        ? row.aliases.filter((a) => typeof a === 'string' && a.trim()).map((a) => a.trim())
        : [];

    if (!question) return problems.push(`${at}: missing question`);
    if (!answer) return problems.push(`${at}: missing answer (${question.slice(0, 40)})`);
    if (answer.length > 1200) problems.push(`${at}: answer unusually long (${answer.length} chars)`);

    // Duplicate questions are the main thing that degrades matching: two entries
    // scoring alike means the tie-break, not the meaning, picks the answer.
    const key = question.toLowerCase().replace(/\s+/g, ' ').replace(/[?!.,;:]+$/, '');
    if (seen.has(key)) return problems.push(`${at}: duplicate of entry ${seen.get(key)} — "${question.slice(0, 50)}"`);
    seen.set(key, index + 1);

    clean.push({ question, answer, aliases });
});

console.log(`parsed   ${rows.length}`);
console.log(`valid    ${clean.length}`);
console.log(`skipped  ${rows.length - clean.length}`);
console.log(`aliases  ${clean.reduce((n, r) => n + r.aliases.length, 0)} total, ${(clean.reduce((n, r) => n + r.aliases.length, 0) / (clean.length || 1)).toFixed(1)} avg`);

const noAliases = clean.filter((r) => r.aliases.length === 0).length;
if (noAliases > 0) console.log(`\n${noAliases} entries have no aliases — those will only match near-exact wording.`);

if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems.slice(0, 25)) console.log(`  - ${problem}`);
    if (problems.length > 25) console.log(`  ... and ${problems.length - 25} more`);
}

console.log('\nSample:');
for (const row of clean.slice(0, 3)) {
    console.log(`\n  Q: ${row.question}`);
    console.log(`  A: ${row.answer.slice(0, 110)}${row.answer.length > 110 ? '…' : ''}`);
    console.log(`  aliases: ${row.aliases.join(' | ') || '(none)'}`);
}

if (!write) {
    console.log(`\nPreview only. Re-run with --write to insert ${clean.length} rows.`);
    process.exit(0);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('\nDATABASE_URL is not set.');
    process.exit(1);
}

// Emitted as SQL and piped to psql so this script needs no database driver
// installed — one less dependency in a repo that otherwise has no backend.
const escape = (value) => `'${String(value).replace(/'/g, "''")}'`;
const statements = clean.map(
    (row) =>
        `insert into public.faq (question, aliases, answer) values (${escape(row.question)}, array[${row.aliases.map(escape).join(',') || ''}]::text[], ${escape(row.answer)});`,
);

const { execFile } = await import('node:child_process');
const { promisify } = await import('node:util');
const run = promisify(execFile);

const sql = ['begin;', ...statements, 'commit;', "select count(*) as faq_rows from public.faq;"].join('\n');

try {
    const { stdout } = await run('psql', [connectionString, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
        maxBuffer: 32 * 1024 * 1024,
    });
    console.log(`\nInserted ${clean.length} rows.`);
    console.log(stdout.trim());
} catch (error) {
    console.error('\nImport failed — nothing was written (the whole batch is one transaction).');
    console.error(error.stderr || error.message);
    process.exit(1);
}
