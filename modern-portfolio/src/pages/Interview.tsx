import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Interview.css';

/* Supabase's dashboard editor auto-names a new function `dynamic-handler` unless
   the name field is changed before the first deploy, which is what happened here —
   so `/functions/v1/interview` returns 404 and this page could never reach the
   backend, FAQ answers included.

   Override with VITE_INTERVIEW_FUNCTION if the function is ever redeployed under
   a better name; set it to `interview` and nothing else changes. */
const FUNCTION_NAME = (import.meta.env.VITE_INTERVIEW_FUNCTION as string | undefined) ?? 'dynamic-handler';

const ENDPOINT = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`
    : '';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const QUESTION_LIMIT = 5;
const MAX_CHARS = 300;

/* Removes the blank-box problem: a visitor with nothing to type asks nothing.
   Kept deliberately long and shown after every answer rather than only on the empty
   screen — until the retrieval layer lands, a written answer is the good path and
   steering people onto it is the whole job. */
const SUGGESTIONS = [
    'What does Manish do?',
    'Does he have security experience?',
    'What has he built?',
    'What kind of role is he looking for?',
    'What certifications does he hold?',
    'How much infrastructure does he manage?',
    'What does he use Python for?',
    'Is he open to relocating?',
];

const SUGGESTIONS_SHOWN = 4;

interface Turn {
    id: number;
    role: 'user' | 'bot';
    text: string;
    /* Only model answers cost anything — the badge makes that visible rather than
       leaving the visitor guessing why the counter moved. */
    source?: 'cache' | 'faq' | 'model' | 'quota' | 'gate' | 'error';
}

const GREETING =
    "Interview.exe, ready. I answer questions about Manish's background from a set of answers he wrote himself, so what you get back is his words rather than a paraphrase of them. If a question is not covered yet I will say so instead of guessing. Manish is currently building a retrieval layer (RAG) on top of this, so it will soon answer from his whole resume and project history rather than the written set. Until then the suggested questions below are the ones I answer best.";

const Interview: React.FC = () => {
    const navigate = useNavigate();
    const [turns, setTurns] = useState<Turn[]>([
        { id: 0, role: 'bot', text: GREETING },
    ]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    /* Mirrors the server's count. The server is authoritative — this only drives
       the display, because a browser counter is trivially reset. */
    const [creditsUsed, setCreditsUsed] = useState(0);

    const transcriptRef = useRef<HTMLDivElement>(null);
    const nextId = useRef(1);

    useEffect(() => {
        transcriptRef.current?.scrollTo({
            top: transcriptRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [turns, busy]);

    const ask = useCallback(async (question: string) => {
        const text = question.trim();
        if (!text || busy) return;

        setTurns((prev) => [...prev, { id: nextId.current++, role: 'user', text }]);
        setDraft('');
        setBusy(true);

        try {
            if (!ENDPOINT || !ANON_KEY) throw new Error('not configured');

            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ANON_KEY}`,
                    apikey: ANON_KEY,
                },
                body: JSON.stringify({ question: text }),
            });

            const data = await response.json();

            if (data.spentCredit) setCreditsUsed((used) => Math.min(used + 1, QUESTION_LIMIT));
            if (data.source === 'quota') setCreditsUsed(QUESTION_LIMIT);

            setTurns((prev) => [
                ...prev,
                {
                    id: nextId.current++,
                    role: 'bot',
                    text: data.answer ?? data.error ?? 'No answer came back.',
                    source: data.source,
                },
            ]);
        } catch {
            setTurns((prev) => [
                ...prev,
                {
                    id: nextId.current++,
                    role: 'bot',
                    text: 'I cannot reach my backend, which is a fairly complete failure for something whose only job is answering questions. The contact form on the main page still works and reaches a human, who does not have this problem.',
                    source: 'error',
                },
            ]);
        } finally {
            setBusy(false);
        }
    }, [busy]);

    const remaining = Math.max(QUESTION_LIMIT - creditsUsed, 0);
    const exhausted = remaining === 0;

    /* Suggestions stay on screen for the whole session instead of vanishing after the
       first question. Anything already asked drops off the list so the visitor is
       never pointed back at an answer they have just read. */
    const alreadyAsked = new Set(
        turns.filter((turn) => turn.role === 'user').map((turn) => turn.text.toLowerCase())
    );
    const openSuggestions = SUGGESTIONS
        .filter((suggestion) => !alreadyAsked.has(suggestion.toLowerCase()))
        .slice(0, SUGGESTIONS_SHOWN);

    return (
        <section className="interview-page">
            <div className="container">
                <div className="window interview-win">
                    <div className="title-bar">
                        <div className="title-bar-text">🤖 Interview.exe - Ask about Manish</div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" onClick={() => navigate('/')} />
                        </div>
                    </div>

                    <div className="win98-menubar">
                        <span>File</span>
                        <span>Edit</span>
                        <span>View</span>
                        <span>Help</span>
                    </div>

                    <div className="interview-body">
                        <div className="interview-transcript" ref={transcriptRef} aria-live="polite">
                            {turns.map((turn) => (
                                <div key={turn.id} className={`interview-turn ${turn.role}`}>
                                    <span className="interview-speaker">
                                        {turn.role === 'user' ? 'YOU' : 'BOT'}
                                    </span>
                                    <p className="interview-text">{turn.text}</p>
                                    {turn.source === 'model' && (
                                        <span className="interview-badge">generated</span>
                                    )}
                                </div>
                            ))}

                            {busy && (
                                <div className="interview-turn bot">
                                    <span className="interview-speaker">BOT</span>
                                    <p className="interview-text interview-thinking">
                                        Consulting the resume<span className="interview-dots">...</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {!busy && !exhausted && openSuggestions.length > 0 && (
                            <div className="interview-suggestions">
                                <span className="interview-suggestions-label">
                                    {turns.length === 1 ? 'Try one of these' : 'Also answerable'}
                                </span>
                                {openSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        className="interview-suggestion"
                                        onClick={() => ask(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form
                            className="interview-composer"
                            onSubmit={(event) => {
                                event.preventDefault();
                                ask(draft);
                            }}
                        >
                            <input
                                type="text"
                                className="interview-input"
                                value={draft}
                                onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHARS))}
                                placeholder={exhausted ? 'Question limit reached' : 'Ask about his experience, skills, projects...'}
                                disabled={busy || exhausted}
                                aria-label="Your question"
                            />
                            <button
                                type="submit"
                                className="btn interview-send"
                                disabled={busy || exhausted || draft.trim().length < 3}
                            >
                                Ask
                            </button>
                        </form>
                    </div>

                    <div className="win98-statusbar interview-statusbar">
                        <div className="win98-panel">
                            {exhausted ? 'Queries exhausted' : `Queries remaining: ${remaining} of ${QUESTION_LIMIT}`}
                        </div>
                        <div className="win98-panel" style={{ flex: 1 }}>
                            Written answers · RAG retrieval in progress
                        </div>
                        <div className="win98-panel">Memory: 640K OK</div>
                    </div>
                </div>

                <p className="interview-disclaimer">
                    This is an automated assistant, not Manish. Right now it matches your question
                    against a set of answers he wrote by hand, which is why the suggestions above
                    are the reliable path. A retrieval-augmented model layer is being built to
                    replace that, so it will read from the full resume, project list and site
                    content instead of a fixed list. It will still refuse to invent anything that
                    is not there. For anything it cannot answer,{' '}
                    <button type="button" className="interview-link" onClick={() => navigate('/footer')}>
                        use the contact form
                    </button>
                    {' '}and a human gets it.
                </p>
            </div>
        </section>
    );
};

export default Interview;
