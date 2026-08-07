/**
 * Interview.exe — the only server-side piece of the Q&A bot.
 *
 * Runs on Supabase Edge Functions (Deno). It exists for one reason: the Anthropic
 * API key must never reach the browser. Everything else here could live in the
 * client; the key could not.
 *
 * Answer order, cheapest source first:
 *
 *   1. answer_cache  — asked before                    free
 *   2. match_faq()   — a written answer fits           free
 *   3. the model     — genuinely new question          ~$0.0045
 *
 * A credit is spent only at step 3, so a visitor asking predictable questions
 * never burns their quota. Deploy:
 *
 *   supabase functions deploy interview --project-ref rpcfxakwidvfjyjlcyxj
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 300;
const MAX_QUESTION_CHARS = 300;
const QUESTIONS_PER_VISITOR = 5;

/* A wildcard origin let any site call this endpoint and embed the bot. Cost was
   bounded by the quota, but there is no reason to be callable from anywhere. */
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

/** Call a Postgres function through PostgREST with the service role. */
const rpc = async (fn: string, args: Record<string, unknown> = {}) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
    });
    if (!response.ok) throw new Error(`${fn} failed: ${response.status} ${await response.text()}`);
    return await response.json();
};

const table = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...init,
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
        },
    });
    if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
    return response.status === 204 ? null : await response.json();
};

/** Cache key: case, spacing, and trailing punctuation shouldn't fork the cache. */
const normalize = (question: string) =>
    question.toLowerCase().replace(/\s+/g, ' ').replace(/[?!.,;:'"]+$/g, '').trim();

/**
 * The FAQ table doubles as the model's source material, so there is exactly one
 * place to edit facts about Manish. Add an answer and both the direct lookup and
 * the model's grounding improve together — they can never drift apart.
 */
const buildSystemPrompt = (faq: Array<{ question: string; answer: string }>) => `
You are an automated assistant on Manish Patil's portfolio site. You answer questions about his background for visitors, who are usually recruiters or hiring managers.

Answer ONLY from the reference material below. It is the complete set of facts you have.

If the answer is not in the reference material, say so plainly and point them to the contact form. Never guess, never infer a skill from an adjacent one, and never pattern-match. If someone asks whether he knows a specific technology that is not listed, the answer is that it is not on his resume and they should ask him directly. Treating "he knows Docker" as evidence for "he knows Kubernetes" is exactly the mistake to avoid: a wrong yes could cost him an interview.

Write in third person about Manish. Never speak as him or claim to be him.

Tone: dry, direct, lightly wry. You may be deadpan about yourself — being a bot, your limits, your rationed question budget. Never be sarcastic about Manish's actual qualifications, and never undercut a real answer with a joke. Wit belongs in your own voice, not in the facts.

Keep answers to 2-3 sentences unless the question genuinely needs more.

REFERENCE MATERIAL:
${faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}
`.trim();

Deno.serve(async (request) => {
    const cors = corsFor(request.headers.get('origin'));
    const reply = (body: unknown, status = 200) => json(body, status, cors);

    if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (request.method !== 'POST') return reply({ error: 'POST only' }, 405);

    try {
        const { question } = await request.json().catch(() => ({ question: '' }));

        if (typeof question !== 'string' || question.trim().length < 3) {
            return reply({ error: 'Ask a question first.' }, 400);
        }
        if (question.length > MAX_QUESTION_CHARS) {
            return reply({ error: `Questions are capped at ${MAX_QUESTION_CHARS} characters.` }, 400);
        }

        const asked = question.trim();
        const normalized = normalize(asked);

        // Best available caller identity. Spoofable, so it is a speed bump for
        // casual repeat-asking, not an identity system — the budget and the
        // Console cap are what actually bound the spend.
        const callerKey =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('cf-connecting-ip') ||
            'unknown';

        /* 1 ── Asked before? Free. */
        // approved=is.true — a model answer is not served to anyone else until
        // it has been reviewed. See supabase/interview-hardening.sql.
        const cached = await table(
            `answer_cache?question_norm=eq.${encodeURIComponent(normalized)}&approved=is.true&select=id,answer,hits&limit=1`,
        );
        if (Array.isArray(cached) && cached.length > 0) {
            await table(`answer_cache?id=eq.${cached[0].id}`, {
                method: 'PATCH',
                body: JSON.stringify({ hits: cached[0].hits + 1 }),
            }).catch(() => {}); // a lost hit counter must never fail the answer
            return reply({ answer: cached[0].answer, source: 'cache', spentCredit: false });
        }

        /* 2 ── A written answer fits? Free. */
        const matches = await rpc('match_faq', { question_text: asked });
        if (Array.isArray(matches) && matches.length > 0) {
            const answer = matches[0].answer;
            await table('answer_cache', {
                method: 'POST',
                body: JSON.stringify({
                    question_norm: normalized,
                    question_original: asked,
                    answer,
                    source: 'faq',
                    approved: true, // his own words
                }),
            }).catch(() => {});
            return reply({ answer, source: 'faq', spentCredit: false });
        }

        /* 3 ── Nothing written covers it. Check the guards before spending. */
        const gate = (await rpc('bot_gate'))?.[0];
        if (!gate?.available) {
            return reply({ answer: gate?.notice ?? 'I am off duty at the moment. The contact form on the main page still works and reaches a human, who is considerably more available than I am.', source: 'gate', spentCredit: false });
        }

        const credit = (await rpc('consume_question_credit', {
            caller: callerKey,
            max_questions: QUESTIONS_PER_VISITOR,
        }))?.[0];

        if (!credit?.allowed) {
            return reply({
                answer:
                    'That is my limit for now. I am rationed, Manish is not. The contact form below has no such restriction and reaches him directly.',
                source: 'quota',
                spentCredit: false,
                remaining: 0,
            });
        }

        // Log it before answering: this is the FAQ backlog. Whatever shows up
        // here repeatedly is the next answer worth writing by hand.
        await table('unanswered_log', {
            method: 'POST',
            body: JSON.stringify({ question: asked }),
        }).catch(() => {});

        const faq = await table('faq?select=question,answer&order=id');
        const claude = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: MAX_TOKENS,
                system: buildSystemPrompt(faq ?? []),
                messages: [{ role: 'user', content: asked }],
            }),
        });

        if (!claude.ok) {
            // Surface the upstream status. A generic failure with nothing to
            // diagnose from turns a two-minute fix into an afternoon:
            //   401 bad or missing key   · 400 model or params rejected
            //   429 rate limit           · 402/403 out of credit or plan limit
            const detail = await claude.text().catch(() => '');
            console.error(`anthropic ${claude.status}: ${detail.slice(0, 500)}`);

            return reply({
                answer: 'My reasoning half is not answering right now, so I am running on the written answers only. Try one of the suggested questions, which I do know, or use the contact form and skip me entirely. A proper retrieval layer is being built to make this less embarrassing.',
                source: 'error',
                upstreamStatus: claude.status,
                upstreamDetail: detail.slice(0, 300),
                spentCredit: true,
                remaining: credit.remaining,
            });
        }

        const result = await claude.json();

        // A refusal returns 200 with empty content, and a max_tokens stop returns
        // a sentence cut in half. Either one written to the cache would be served
        // back as a finished answer, so check before reading content.
        if (result.stop_reason === 'refusal') {
            return reply({
                answer: 'I am going to decline that one. The contact form reaches Manish directly and he can decide for himself.',
                source: 'refusal',
                spentCredit: true,
                remaining: credit.remaining,
            });
        }

        const answer =
            result.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ??
            'Nothing written covers that yet. Manish is building a retrieval layer so I can answer from his whole resume instead of a fixed list; until then, the contact form reaches an actual human.';

        await rpc('record_model_spend', {
            in_tokens: result.usage?.input_tokens ?? 0,
            out_tokens: result.usage?.output_tokens ?? 0,
        }).catch(() => {});

        // Truncated mid-sentence: usable as this visitor's reply, never as a
        // stored answer for everyone else.
        const isComplete = result.stop_reason !== 'max_tokens';

        if (isComplete) {
            await table('answer_cache', {
                method: 'POST',
                body: JSON.stringify({
                    question_norm: normalized,
                    question_original: asked,
                    answer,
                    source: 'model',
                    approved: false, // held for review — see interview-hardening.sql
                }),
            }).catch(() => {});
        }

        return reply({ answer, source: 'model', spentCredit: true, remaining: credit.remaining });
    } catch (error) {
        console.error('interview function error:', error);
        return json({ error: 'Something broke on my side.' }, 500, corsFor(request.headers.get('origin')));
    }
});
