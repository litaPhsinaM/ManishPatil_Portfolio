import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { readStorage, writeStorage } from '../utils/safeStorage';
import {
    leaderboardEnabled,
    fetchTopScores,
    submitScore,
    INITIALS_PATTERN,
    type ScoreRow,
    type LeaderboardGame,
} from '../lib/leaderboard';
import '../styles/Games.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = [0, -1];

/* Snake pacing. Classic Snake gets faster as it grows — a constant tick meant a
   good player could keep going indefinitely at the same difficulty, which is the
   one thing the original never did. Every STEP_EVERY points shaves STEP_MS off the
   tick, down to a floor that is fast but still humanly playable. */
const SPEED_MS = 140;
const SPEED_FLOOR_MS = 55;
const SPEED_STEP_EVERY = 30;
const SPEED_STEP_MS = 5;

const snakeTickMs = (score: number) =>
    Math.max(SPEED_FLOOR_MS, SPEED_MS - Math.floor(score / SPEED_STEP_EVERY) * SPEED_STEP_MS);

/* ─── Fixed-timestep loop ───
   requestAnimationFrame fires at the display's refresh rate, so a loop that moves
   things by a constant amount per callback runs twice as fast on a 120Hz screen as
   on a 60Hz one. Both canvas games did exactly that.

   The fix is an accumulator: real elapsed time goes in, and update() is called a
   whole number of times at a fixed 60Hz step. Physics and collision then behave
   identically on every display. A delta-time multiplier would fix the speed but not
   the collision behaviour, since tunnelling depends on how far an object moves in a
   single step. maxFrames stops a backgrounded tab from returning to a huge
   accumulated delta and simulating hundreds of steps at once. */
const STEP_MS = 1000 / 60;
const MAX_CATCHUP_STEPS = 5;

const runFixedStep = (
    update: () => boolean,
    render: () => void,
    rafRef: React.MutableRefObject<number | null>
) => {
    let previous = performance.now();
    let accumulator = 0;

    const frame = (now: number) => {
        accumulator += now - previous;
        previous = now;

        let steps = 0;
        let alive = true;
        while (accumulator >= STEP_MS && steps < MAX_CATCHUP_STEPS) {
            alive = update();
            accumulator -= STEP_MS;
            steps += 1;
            if (!alive) break;
        }
        // Whatever is left over is more than one frame behind; drop it rather than
        // carrying a debt that makes the next frame lurch.
        if (steps >= MAX_CATCHUP_STEPS) accumulator = 0;

        render();
        if (alive) rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
};

/* ─── Shared leaderboard plumbing ───
   All three games post to the same table, discriminated by game id, so the fetch,
   the entry form and the board itself are written once here. */
const useLeaderboard = (game: LeaderboardGame) => {
    const [scores, setScores] = useState<ScoreRow[]>([]);
    const [boardState, setBoardState] = useState<'loading' | 'ready' | 'error' | 'disabled'>(
        leaderboardEnabled ? 'loading' : 'disabled'
    );

    const refresh = useCallback(async () => {
        if (!leaderboardEnabled) return;
        try {
            setScores(await fetchTopScores(game));
            setBoardState('ready');
        } catch {
            setBoardState('error');
        }
    }, [game]);

    useEffect(() => {
        if (!leaderboardEnabled) return;

        let cancelled = false;
        fetchTopScores(game)
            .then((rows) => {
                if (cancelled) return;
                setScores(rows);
                setBoardState('ready');
            })
            .catch(() => {
                if (!cancelled) setBoardState('error');
            });

        return () => { cancelled = true; };
    }, [game]);

    return { scores, boardState, refresh };
};

const ScoreEntry: React.FC<{
    game: LeaderboardGame;
    score: number;
    onSaved: () => void;
}> = ({ game, score, onSaved }) => {
    const [initials, setInitials] = useState('');
    const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setState('saving');
        try {
            await submitScore(game, initials, score);
            setState('saved');
            onSaved();
        } catch {
            setState('error');
        }
    };

    // Nothing to post: no backend configured, or the run never scored.
    if (!leaderboardEnabled || score <= 0) return null;
    if (state === 'saved') return <div className="score-entry-hint">Score posted to the board.</div>;

    return (
        <form className="score-entry" onSubmit={submit}>
            <label className="score-entry-label" htmlFor={`${game}-initials`}>
                Enter your initials
            </label>
            <div className="score-entry-row">
                <input
                    id={`${game}-initials`}
                    className="score-entry-input"
                    value={initials}
                    onChange={(e) => setInitials(
                        e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
                    )}
                    maxLength={3}
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby={`${game}-initials-hint`}
                    placeholder="AAA"
                />
                <button
                    type="submit"
                    className="btn game-btn"
                    disabled={!INITIALS_PATTERN.test(initials) || state === 'saving'}
                >
                    {state === 'saving' ? 'SAVING…' : 'SUBMIT'}
                </button>
            </div>
            <div id={`${game}-initials-hint`} className="score-entry-hint">
                {state === 'error'
                    ? 'Could not reach the leaderboard — your local high score is safe.'
                    : 'Three letters, arcade style.'}
            </div>
        </form>
    );
};

const Leaderboard: React.FC<{
    boardState: 'loading' | 'ready' | 'error' | 'disabled';
    scores: ScoreRow[];
}> = ({ boardState, scores }) => {
    if (boardState === 'disabled') return null;

    return (
        <div className="leaderboard">
            <div className="leaderboard-title">HIGH SCORES</div>

            {boardState === 'loading' && <div className="leaderboard-state">Loading…</div>}
            {boardState === 'error' && <div className="leaderboard-state">Board unavailable</div>}
            {boardState === 'ready' && scores.length === 0 && (
                <div className="leaderboard-state">No scores yet — be the first.</div>
            )}

            {boardState === 'ready' && scores.length > 0 && (
                <ol className="leaderboard-list">
                    {scores.map((row, index) => (
                        <li key={`${row.initials}-${row.created_at}`} className="leaderboard-row">
                            <span className="leaderboard-rank">{String(index + 1).padStart(2, '0')}</span>
                            <span className="leaderboard-initials">{row.initials}</span>
                            <span className="leaderboard-dots" aria-hidden="true" />
                            <span className="leaderboard-score">{row.score}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

type GameId = 'snake' | 'flappy' | 'traffic';

interface GamesProps {
    onClose?: () => void;
}

const gameTabs: Array<{ id: GameId; label: string; title: string }> = [
    { id: 'snake', label: 'Snake', title: 'Snake.exe' },
    { id: 'flappy', label: 'Flappy', title: 'Flappy.exe' },
    { id: 'traffic', label: 'Traffic Racer', title: 'TrafficRacer.exe' },
];

/* ─── Touch D-pad for Snake ─── */
const TouchDpad: React.FC<{ onDirection: (dir: number[]) => void }> = ({ onDirection }) => (
    <div className="touch-dpad">
        <div className="touch-dpad-row">
            <div className="touch-dpad-spacer" />
            <button className="touch-dpad-btn" onTouchStart={(e) => { e.preventDefault(); onDirection([0, -1]); }} aria-label="Up">▲</button>
            <div className="touch-dpad-spacer" />
        </div>
        <div className="touch-dpad-row">
            <button className="touch-dpad-btn" onTouchStart={(e) => { e.preventDefault(); onDirection([-1, 0]); }} aria-label="Left">◀</button>
            <div className="touch-dpad-spacer" />
            <button className="touch-dpad-btn" onTouchStart={(e) => { e.preventDefault(); onDirection([1, 0]); }} aria-label="Right">▶</button>
        </div>
        <div className="touch-dpad-row">
            <div className="touch-dpad-spacer" />
            <button className="touch-dpad-btn" onTouchStart={(e) => { e.preventDefault(); onDirection([0, 1]); }} aria-label="Down">▼</button>
            <div className="touch-dpad-spacer" />
        </div>
    </div>
);

const SnakeGame: React.FC = () => {
    const [snake, setSnake] = useState<number[][]>(INITIAL_SNAKE);
    const [food, setFood] = useState<number[]>([5, 5]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = Number.parseInt(readStorage('local', 'snakeHighScore') ?? '', 10);
        return Number.isFinite(saved) ? saved : 0;
    });

    // The tick reads live values off refs rather than closing over state. Previously the
    // interval effect depended on `direction`/`food`, so it was torn down and recreated on
    // every turn — tapping direction keys faster than SPEED_MS stopped the snake entirely.
    const snakeRef = useRef(snake);
    const foodRef = useRef(food);
    const scoreRef = useRef(score);
    const highScoreRef = useRef(highScore);
    // `directionRef` is what the last tick actually moved; `pendingDirectionRef` is what
    // input has requested for the next one. Validating turns against the committed
    // direction is what stops two fast turns (right → up → left) folding into a reversal.
    const directionRef = useRef(INITIAL_DIRECTION);
    const pendingDirectionRef = useRef(INITIAL_DIRECTION);

    /* Arcade leaderboard. Every path here is optional — if the backend is not
       configured or is unreachable, the game plays exactly as it did before. */
    const { scores, boardState, refresh: refreshScores } = useLeaderboard('snake');

    const generateFood = useCallback((currentSnake: number[][]) => {
        let newFood: number[];
        while (true) {
            newFood = [
                Math.floor(Math.random() * GRID_SIZE),
                Math.floor(Math.random() * GRID_SIZE)
            ];
            if (!currentSnake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])) {
                return newFood;
            }
        }
    }, []);

    const resetGame = useCallback(() => {
        const nextFood = generateFood(INITIAL_SNAKE);
        snakeRef.current = INITIAL_SNAKE;
        foodRef.current = nextFood;
        scoreRef.current = 0;
        directionRef.current = INITIAL_DIRECTION;
        pendingDirectionRef.current = INITIAL_DIRECTION;

        setSnake(INITIAL_SNAKE);
        setFood(nextFood);
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        // Initials and submit state live in <ScoreEntry>, which is mounted only while
        // the game-over overlay is up, so restarting unmounts it and clears both.
    }, [generateFood]);

    const requestDirection = useCallback((dir: number[]) => {
        const committed = directionRef.current;
        if (dir[0] === -committed[0] && dir[1] === -committed[1]) return;
        pendingDirectionRef.current = dir;
    }, []);

    /* One step of the simulation. Runs from the interval callback — never inside a state
       updater, because React may invoke updaters more than once and the side effects here
       (scoring, spawning food, saving the high score) must happen exactly once per tick. */
    const tick = useCallback(() => {
        const direction = pendingDirectionRef.current;
        directionRef.current = direction;

        const prevSnake = snakeRef.current;
        const head = prevSnake[0];
        const newHead = [head[0] + direction[0], head[1] + direction[1]];

        const hitsWall =
            newHead[0] < 0 || newHead[0] >= GRID_SIZE ||
            newHead[1] < 0 || newHead[1] >= GRID_SIZE;
        const hitsSelf = prevSnake.some(
            segment => segment[0] === newHead[0] && segment[1] === newHead[1]
        );

        if (hitsWall || hitsSelf) {
            setGameOver(true);
            setIsPlaying(false);
            if (scoreRef.current > highScoreRef.current) {
                highScoreRef.current = scoreRef.current;
                setHighScore(scoreRef.current);
                writeStorage('local', 'snakeHighScore', scoreRef.current.toString());
            }
            return;
        }

        const nextSnake = [newHead, ...prevSnake];
        if (newHead[0] === foodRef.current[0] && newHead[1] === foodRef.current[1]) {
            scoreRef.current += 10;
            setScore(scoreRef.current);

            const nextFood = generateFood(nextSnake);
            foodRef.current = nextFood;
            setFood(nextFood);
        } else {
            nextSnake.pop();
        }

        snakeRef.current = nextSnake;
        setSnake(nextSnake);
    }, [generateFood]);

    /* Touch D-pad handler — validates against reverse direction */
    const handleTouchDirection = useCallback((dir: number[]) => {
        if (gameOver) {
            resetGame();
            return;
        }
        if (!isPlaying) {
            setIsPlaying(true);
            return;
        }
        requestDirection(dir);
    }, [isPlaying, gameOver, resetGame, requestDirection]);

    /* score is in the dependency list on purpose: crossing a speed threshold tears
       down the old interval and starts a faster one. */
    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const interval = setInterval(tick, snakeTickMs(score));
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, tick, score]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // While the initials field has focus the game must keep its hands off the
            // keyboard — otherwise pressing space mid-entry restarts the round.
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            if (!isPlaying) {
                if (e.key === ' ' && gameOver) resetGame();
                else if (e.key === ' ') setIsPlaying(true);
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    requestDirection([0, -1]);
                    break;
                case 'ArrowDown':
                case 's':
                    requestDirection([0, 1]);
                    break;
                case 'ArrowLeft':
                case 'a':
                    requestDirection([-1, 0]);
                    break;
                case 'ArrowRight':
                case 'd':
                    requestDirection([1, 0]);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver, resetGame, requestDirection]);

    return (
        <>
            <div className="games-header">
                <div className="games-score">SCORE: {score}</div>
                <div className="games-score muted">HI: {highScore}</div>
            </div>

            <div className="games-screen-bezel">
                <div className="snake-board">
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isSnake = snake.some(s => s[0] === x && s[1] === y);
                        const isFood = food[0] === x && food[1] === y;
                        let cellClass = 'grid-cell';
                        if (isSnake) cellClass += ' snake';
                        else if (isFood) cellClass += ' food';
                        return <div key={i} className={cellClass} />;
                    })}

                    {!isPlaying && !gameOver && (
                        <div className="game-overlay">
                            <div className="game-title">SNAKE.EXE</div>
                            <button className="btn game-btn" data-track="game:snake" onClick={() => setIsPlaying(true)}>START GAME</button>
                            <div className="game-instructions">Arrow keys or WASD<br />Space to start</div>
                        </div>
                    )}

                    {gameOver && (
                        <div className="game-overlay">
                            <div className="game-over-text">GAME OVER</div>
                            <div className="game-score-final">Score: {score}</div>

                            <ScoreEntry game="snake" score={score} onSaved={refreshScores} />

                            <button className="btn game-btn" onClick={resetGame}>TRY AGAIN</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Touch D-pad for mobile */}
            <TouchDpad onDirection={handleTouchDirection} />

            <div className="games-controls">
                <button className="btn" onClick={isPlaying ? () => setIsPlaying(false) : resetGame} disabled={gameOver}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>

            <Leaderboard boardState={boardState} scores={scores} />
        </>
    );
};

interface Rect { x: number; y: number; w: number; h: number }

const overlaps = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ─── Traffic Racer ───
   Endless lane dodger. The previous version stopped getting harder at score 24
   (spawn rate) and score 46 (car speed), so anyone reasonably good could drive
   forever at a fixed, easy difficulty — there was nothing left to play for. Both
   curves now key off a level that keeps climbing. */
const TRAFFIC_LANES = [70, 145, 220];
const TRAFFIC_CAR_W = 32;
const TRAFFIC_CAR_H = 50;

const trafficLevel = (score: number) => 1 + Math.floor(score / 15);

/* Car speed climbs with level and then holds. This ceiling is deliberate, not the
   oversight the old one was: the board is 480px tall and the player needs roughly
   33 steps to cross two lanes, so past about 11px per step a car arrives sooner
   than anyone could physically dodge it and the game stops being winnable rather
   than becoming hard. Difficulty past that point comes from spawn density, which
   stays fair because a clear lane is always guaranteed. */
const trafficCarSpeed = (level: number) => Math.min(11, 3.0 + level * 0.35);
const trafficSpawnGap = (level: number) => Math.max(20, 80 - level * 4);
/* The player accelerates too, so steering keeps pace with the traffic. */
const trafficPlayerSpeed = (level: number) => Math.min(7.5, 4.5 + level * 0.12);

const TrafficGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const keysRef = useRef<Record<string, boolean>>({});
    const rafRef = useRef<number | null>(null);
    const [runId, setRunId] = useState(0);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    /* Matches Snake: opening the tab shows a start screen rather than dropping the
       player into a run that is already moving. */
    const [started, setStarted] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        const saved = Number.parseInt(readStorage('local', 'trafficHighScore') ?? '', 10);
        return Number.isFinite(saved) ? saved : 0;
    });
    const { scores, boardState, refresh } = useLeaderboard('traffic');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // A key held when the previous run ended would otherwise still read as pressed.
        keysRef.current = {};

        const player: Rect = { x: 140, y: 410, w: TRAFFIC_CAR_W, h: TRAFFIC_CAR_H };
        const cars: Rect[] = [];
        let points = 0;
        let currentLevel = 1;
        let over = false;
        let stripe = 0;
        let spawnCooldown = 0;

        const drawCar = (x: number, y: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 6, TRAFFIC_CAR_W, 38);
            ctx.fillStyle = '#111';
            ctx.fillRect(x + 5, y, 22, 10);
            ctx.fillStyle = '#d7f2ff';
            ctx.fillRect(x + 8, y + 4, 16, 7);
        };

        const update = () => {
            currentLevel = trafficLevel(points);
            const playerSpeed = trafficPlayerSpeed(currentLevel);
            const carSpeed = trafficCarSpeed(currentLevel);

            if (keysRef.current.ArrowLeft && player.x > 55) player.x -= playerSpeed;
            if (keysRef.current.ArrowRight && player.x < 233) player.x += playerSpeed;

            spawnCooldown -= 1;
            if (spawnCooldown <= 0) {
                const clearLane = Math.floor(Math.random() * TRAFFIC_LANES.length);
                // Never block every lane. One is always left open, which is what keeps
                // an escalating spawn rate fair instead of arbitrary.
                const waveSize = currentLevel < 3 ? 1 : 2;
                TRAFFIC_LANES
                    .map((_, laneIndex) => laneIndex)
                    .filter((laneIndex) => laneIndex !== clearLane)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, waveSize)
                    .forEach((laneIndex, index) => {
                        cars.push({
                            x: TRAFFIC_LANES[laneIndex],
                            y: -70 - index * 16,
                            w: TRAFFIC_CAR_W,
                            h: TRAFFIC_CAR_H,
                        });
                    });
                spawnCooldown = trafficSpawnGap(currentLevel);
            }

            for (let i = cars.length - 1; i >= 0; i -= 1) {
                const car = cars[i];
                car.y += carSpeed;
                if (overlaps(player, car)) over = true;
                if (car.y > 500) {
                    cars.splice(i, 1);
                    points += 1;
                }
            }

            stripe = (stripe + carSpeed) % 60;

            if (over) {
                setScore(points);
                setLevel(currentLevel);
                setGameOver(true);
                if (points > (Number.parseInt(readStorage('local', 'trafficHighScore') ?? '0', 10) || 0)) {
                    writeStorage('local', 'trafficHighScore', String(points));
                    setHighScore(points);
                }
                return false;
            }
            return true;
        };

        const render = () => {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, 320, 480);
            ctx.fillStyle = '#fff';
            for (let y = stripe - 60; y < 520; y += 60) {
                ctx.fillRect(105, y, 3, 32);
                ctx.fillRect(180, y, 3, 32);
            }

            drawCar(player.x, player.y, '#0af');
            for (const car of cars) drawCar(car.x, car.y, '#f33');

            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.fillText(`Score: ${points}`, 10, 25);
            ctx.font = '13px sans-serif';
            ctx.fillText(`Level ${currentLevel}`, 240, 25);
            // No game-over text drawn here: the .game-overlay element covers the
            // whole bezel with the score entry form, so anything painted underneath
            // it would never be seen.
        };

        const keyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
            if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();
            // Reaching for the controls is itself a "start", same as Snake.
            if (!started) {
                setStarted(true);
                return;
            }
            keysRef.current[e.key] = true;
        };
        const keyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
        // Switching tabs/windows swallows the keyup, which would leave the car steering.
        const releaseAll = () => { keysRef.current = {}; };

        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        window.addEventListener('blur', releaseAll);

        // Paint the road and the parked car once so the start screen sits over a real
        // board instead of an empty bezel, then only run the loop once started.
        render();
        if (started) runFixedStep(update, render, rafRef);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
            window.removeEventListener('blur', releaseAll);
        };
    }, [runId, started]);

    /* Reset lives here rather than in the effect: clearing state inside the effect
       body triggers a second render every run and React lints against it. */
    const restart = () => {
        setScore(0);
        setLevel(1);
        setGameOver(false);
        setStarted(true);
        setRunId((id) => id + 1);
    };

    const press = (key: string, down: boolean) => () => { keysRef.current[key] = down; };

    return (
        <>
            <div className="games-header">
                <div className="games-score">SCORE: {score}</div>
                <div className="games-score muted">HI: {highScore}</div>
            </div>
            <div className="games-screen-bezel">
                <canvas ref={canvasRef} className="arcade-canvas" width={320} height={480} />

                {!started && !gameOver && (
                    <div className="game-overlay">
                        <div className="game-title">TRAFFICRACER.EXE</div>
                        <button className="btn game-btn" data-track="game:traffic" onClick={() => setStarted(true)}>START GAME</button>
                        <div className="game-instructions">
                            Left and right arrows<br />Dodge the traffic
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="game-overlay">
                        <div className="game-over-text">GAME OVER</div>
                        <div className="game-score-final">Score: {score} · Level {level}</div>
                        <ScoreEntry game="traffic" score={score} onSaved={refresh} />
                        <button className="btn game-btn" onClick={restart}>TRY AGAIN</button>
                    </div>
                )}
            </div>
            {/* Touch left/right for mobile */}
            <div className="touch-lr-controls">
                <button
                    className="touch-lr-btn"
                    onTouchStart={(e) => { e.preventDefault(); press('ArrowLeft', true)(); }}
                    onTouchEnd={press('ArrowLeft', false)}
                    onTouchCancel={press('ArrowLeft', false)}
                    onMouseDown={press('ArrowLeft', true)}
                    onMouseUp={press('ArrowLeft', false)}
                    onMouseLeave={press('ArrowLeft', false)}
                    aria-label="Steer left"
                >◀</button>
                <button
                    className="touch-lr-btn"
                    onTouchStart={(e) => { e.preventDefault(); press('ArrowRight', true)(); }}
                    onTouchEnd={press('ArrowRight', false)}
                    onTouchCancel={press('ArrowRight', false)}
                    onMouseDown={press('ArrowRight', true)}
                    onMouseUp={press('ArrowRight', false)}
                    onMouseLeave={press('ArrowRight', false)}
                    aria-label="Steer right"
                >▶</button>
            </div>
            <div className="games-controls">
                <button className="btn" onClick={restart}>Restart</button>
            </div>

            <Leaderboard boardState={boardState} scores={scores} />
        </>
    );
};

/* ─── Flappy ───
   Deliberately does NOT escalate. The original Flappy Bird holds gravity, pipe
   speed, spacing and gap constant for the entire run; the difficulty is endurance,
   not acceleration, and adding a ramp here would make it a different game. It is
   already endless, so a good player simply keeps going.

   The constants below are the ones that were already here, and they check out
   against documented reconstructions of the original once converted to per-second:
   gravity 0.32px/step² at 60Hz is ~1150px/s², the flap impulse is ~-408px/s, pipes
   travel ~120px/s and spawn every 104 steps for ~208px of spacing, gap 142px. All
   sit inside the usual reported ranges. What was wrong was never the numbers, it
   was that "per step" meant "per animation frame" and so ran at double speed on a
   120Hz display. */
const FLAP_IMPULSE = -6.8;
const FLAP_GRAVITY = 0.32;
const PIPE_SPEED = 2;
const PIPE_EVERY_STEPS = 104;
const PIPE_GAP = 142;
const PIPE_W = 42;
const GROUND_Y = 438;

const FlappyGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const [runId, setRunId] = useState(0);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    /* Matters more here than anywhere else: without it the bird is already falling
       before the player has looked at the screen. */
    const [started, setStarted] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        const saved = Number.parseInt(readStorage('local', 'flappyHighScore') ?? '', 10);
        return Number.isFinite(saved) ? saved : 0;
    });
    const { scores, boardState, refresh } = useLeaderboard('flappy');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const bird = { x: 72, y: 220, r: 12, v: 0 };
        const pipes: Array<{ x: number; gapY: number; scored: boolean }> = [];
        let points = 0;
        let over = false;
        let steps = 0;

        const flap = () => {
            if (over) return;
            bird.v = FLAP_IMPULSE;
        };

        const update = () => {
            bird.v += FLAP_GRAVITY;
            bird.y += bird.v;

            if (steps % PIPE_EVERY_STEPS === 0) {
                pipes.push({ x: 340, gapY: 120 + Math.random() * 180, scored: false });
            }
            steps += 1;

            for (let i = pipes.length - 1; i >= 0; i -= 1) {
                const pipe = pipes[i];
                pipe.x -= PIPE_SPEED;

                const inX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + PIPE_W;
                const inPipe =
                    bird.y - bird.r < pipe.gapY - PIPE_GAP / 2 ||
                    bird.y + bird.r > pipe.gapY + PIPE_GAP / 2;
                if (inX && inPipe) over = true;

                if (!pipe.scored && pipe.x + PIPE_W < bird.x) {
                    pipe.scored = true;
                    points += 1;
                }
                if (pipe.x < -50) pipes.splice(i, 1);
            }

            if (bird.y + bird.r > GROUND_Y || bird.y - bird.r < 0) over = true;

            if (over) {
                setScore(points);
                setGameOver(true);
                if (points > (Number.parseInt(readStorage('local', 'flappyHighScore') ?? '0', 10) || 0)) {
                    writeStorage('local', 'flappyHighScore', String(points));
                    setHighScore(points);
                }
                return false;
            }
            return true;
        };

        const render = () => {
            ctx.fillStyle = '#8fd3ff';
            ctx.fillRect(0, 0, 320, 480);
            ctx.fillStyle = '#0b6b45';
            ctx.fillRect(0, GROUND_Y, 320, 480 - GROUND_Y);

            ctx.fillStyle = '#1fb85a';
            for (const pipe of pipes) {
                ctx.fillRect(pipe.x, 0, PIPE_W, pipe.gapY - PIPE_GAP / 2);
                ctx.fillRect(
                    pipe.x,
                    pipe.gapY + PIPE_GAP / 2,
                    PIPE_W,
                    GROUND_Y - (pipe.gapY + PIPE_GAP / 2)
                );
            }

            ctx.fillStyle = '#ffd54a';
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.fillRect(bird.x + 5, bird.y - 5, 4, 4);

            ctx.fillStyle = '#fff';
            ctx.font = '18px sans-serif';
            ctx.fillText(`Score: ${points}`, 12, 28);
            // See TrafficGame: the HTML overlay covers this, so no game-over paint.
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key !== ' ') return;
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
            e.preventDefault();
            // First press starts the run; it deliberately does not also flap, so the
            // bird begins from a known hover rather than already climbing.
            if (!started) {
                setStarted(true);
                return;
            }
            flap();
        };
        const onPointer = (e: Event) => { e.preventDefault(); flap(); };

        window.addEventListener('keydown', onKey);
        canvas.addEventListener('mousedown', onPointer);
        canvas.addEventListener('touchstart', onPointer, { passive: false });

        // Draw the sky, ground and a hovering bird once so the start screen has a
        // board behind it, then hold until the player actually starts.
        render();
        if (started) runFixedStep(update, render, rafRef);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', onKey);
            canvas.removeEventListener('mousedown', onPointer);
            canvas.removeEventListener('touchstart', onPointer);
        };
    }, [runId, started]);

    /* See TrafficGame: resetting in the effect body would double-render each run. */
    const restart = () => {
        setScore(0);
        setGameOver(false);
        setStarted(true);
        setRunId((id) => id + 1);
    };

    return (
        <>
            <div className="games-header">
                <div className="games-score">SCORE: {score}</div>
                <div className="games-score muted">HI: {highScore}</div>
            </div>
            <div className="games-screen-bezel">
                <canvas ref={canvasRef} className="arcade-canvas" width={320} height={480} />

                {!started && !gameOver && (
                    <div className="game-overlay">
                        <div className="game-title">FLAPPY.EXE</div>
                        <button className="btn game-btn" data-track="game:flappy" onClick={() => setStarted(true)}>START GAME</button>
                        <div className="game-instructions">
                            Space or click to flap<br />Mind the pipes
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="game-overlay">
                        <div className="game-over-text">GAME OVER</div>
                        <div className="game-score-final">Score: {score}</div>
                        <ScoreEntry game="flappy" score={score} onSaved={refresh} />
                        <button className="btn game-btn" onClick={restart}>TRY AGAIN</button>
                    </div>
                )}
            </div>
            <div className="games-controls">
                <button className="btn" onClick={restart}>Restart</button>
            </div>

            <Leaderboard boardState={boardState} scores={scores} />
        </>
    );
};

const Games: React.FC<GamesProps> = ({ onClose }) => {
    const [activeGame, setActiveGame] = useState<GameId>('snake');
    const title = gameTabs.find(game => game.id === activeGame)?.title ?? 'Games.exe';

    useEffect(() => {
        if (!onClose) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <motion.div
            className="games-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Games - ${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="container games-shell">
                <motion.div className="window games-window" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                    <div className="title-bar">
                        <div className="title-bar-text">🎮 Games - {title}</div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" onClick={onClose} />
                        </div>
                    </div>

                    <div className="game-tabs" role="tablist" aria-label="Choose game">
                        {gameTabs.map(game => (
                            <button
                                key={game.id}
                                type="button"
                                role="tab"
                                aria-selected={activeGame === game.id}
                                className={`game-tab ${activeGame === game.id ? 'active' : ''}`}
                                onClick={() => setActiveGame(game.id)}
                            >
                                {game.label}
                            </button>
                        ))}
                    </div>

                    <div className="window-body games-body">
                        {activeGame === 'snake' && <SnakeGame />}
                        {activeGame === 'flappy' && <FlappyGame />}
                        {activeGame === 'traffic' && <TrafficGame />}
                    </div>

                    <div className="win98-statusbar">
                        <div className="win98-panel">Ready</div>
                        <div className="win98-panel" style={{ flex: 1 }}>Memory: 640K OK</div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Games;
