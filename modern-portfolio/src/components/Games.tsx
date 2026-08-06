import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { readStorage, writeStorage } from '../utils/safeStorage';
import {
    leaderboardEnabled,
    fetchTopScores,
    submitScore,
    INITIALS_PATTERN,
    type ScoreRow,
} from '../lib/leaderboard';
import '../styles/Games.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = [0, -1];
const SPEED_MS = 120;

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
    const [scores, setScores] = useState<ScoreRow[]>([]);
    const [boardState, setBoardState] = useState<'loading' | 'ready' | 'error' | 'disabled'>(
        leaderboardEnabled ? 'loading' : 'disabled'
    );
    const [initials, setInitials] = useState('');
    const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const refreshScores = useCallback(async () => {
        if (!leaderboardEnabled) return;
        try {
            setScores(await fetchTopScores());
            setBoardState('ready');
        } catch {
            setBoardState('error');
        }
    }, []);

    useEffect(() => {
        if (!leaderboardEnabled) return;

        let cancelled = false;
        fetchTopScores()
            .then((rows) => {
                if (cancelled) return;
                setScores(rows);
                setBoardState('ready');
            })
            .catch(() => {
                if (!cancelled) setBoardState('error');
            });

        return () => { cancelled = true; };
    }, []);

    const handleSubmitScore = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitState('saving');
        try {
            await submitScore(initials, scoreRef.current);
            setSubmitState('saved');
            await refreshScores();
        } catch {
            setSubmitState('error');
        }
    }, [initials, refreshScores]);

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
        setInitials('');
        setSubmitState('idle');
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

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const interval = setInterval(tick, SPEED_MS);
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, tick]);

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
                            <button className="btn game-btn" onClick={() => setIsPlaying(true)}>START GAME</button>
                            <div className="game-instructions">Arrow keys or WASD<br />Space to start</div>
                        </div>
                    )}

                    {gameOver && (
                        <div className="game-overlay">
                            <div className="game-over-text">GAME OVER</div>
                            <div className="game-score-final">Score: {score}</div>

                            {leaderboardEnabled && score > 0 && submitState !== 'saved' && (
                                <form className="score-entry" onSubmit={handleSubmitScore}>
                                    <label className="score-entry-label" htmlFor="snake-initials">
                                        Enter your initials
                                    </label>
                                    <div className="score-entry-row">
                                        <input
                                            id="snake-initials"
                                            className="score-entry-input"
                                            value={initials}
                                            onChange={(e) => setInitials(
                                                e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
                                            )}
                                            maxLength={3}
                                            autoComplete="off"
                                            spellCheck={false}
                                            aria-describedby="snake-initials-hint"
                                            placeholder="AAA"
                                        />
                                        <button
                                            type="submit"
                                            className="btn game-btn"
                                            disabled={!INITIALS_PATTERN.test(initials) || submitState === 'saving'}
                                        >
                                            {submitState === 'saving' ? 'SAVING…' : 'SUBMIT'}
                                        </button>
                                    </div>
                                    <div id="snake-initials-hint" className="score-entry-hint">
                                        {submitState === 'error'
                                            ? 'Could not reach the leaderboard — your local high score is safe.'
                                            : 'Three letters, arcade style.'}
                                    </div>
                                </form>
                            )}

                            {submitState === 'saved' && (
                                <div className="score-entry-hint">Score posted to the board.</div>
                            )}

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

            {boardState !== 'disabled' && (
                <div className="leaderboard">
                    <div className="leaderboard-title">HIGH SCORES</div>

                    {boardState === 'loading' && (
                        <div className="leaderboard-state">Loading…</div>
                    )}

                    {boardState === 'error' && (
                        <div className="leaderboard-state">Board unavailable</div>
                    )}

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
            )}
        </>
    );
};

const TrafficGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const keysRef = useRef<Record<string, boolean>>({});
    const rafRef = useRef<number | null>(null);
    const [runId, setRunId] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // A key held when the previous run ended would otherwise still read as pressed.
        keysRef.current = {};

        const lanes = [70, 145, 220];
        const player = { x: 140, y: 410, w: 32, h: 50 };
        const cars: Array<{ x: number; y: number; w: number; h: number }> = [];
        let score = 0;
        let over = false;
        let frame = 0;
        let spawnCooldown = 0;

        const hit = (a: typeof player, b: typeof player) =>
            a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

        const drawCar = (x: number, y: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 6, 32, 38);
            ctx.fillStyle = '#111';
            ctx.fillRect(x + 5, y, 22, 10);
            ctx.fillStyle = '#d7f2ff';
            ctx.fillRect(x + 8, y + 4, 16, 7);
        };

        const loop = () => {
            if (over) {
                ctx.fillStyle = '#050505';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '24px sans-serif';
                ctx.fillText('Game Over', 95, 220);
                ctx.fillText(`Score: ${score}`, 105, 255);
                ctx.font = '13px sans-serif';
                ctx.fillText('Click Restart to play again', 82, 290);
                return;
            }

            if (keysRef.current.ArrowLeft && player.x > 55) player.x -= 4.5;
            if (keysRef.current.ArrowRight && player.x < 233) player.x += 4.5;

            spawnCooldown--;
            if (spawnCooldown <= 0) {
                const clearLane = Math.random() * lanes.length | 0;
                const waveSize = score < 6 ? 1 : 2;
                const blockedLanes = lanes
                    .map((_, laneIndex) => laneIndex)
                    .filter(laneIndex => laneIndex !== clearLane)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, waveSize);

                blockedLanes.forEach((laneIndex, index) => {
                    cars.push({
                        x: lanes[laneIndex],
                        y: -70 - index * 16,
                        w: 32,
                        h: 50
                    });
                });

                spawnCooldown = Math.max(42, 74 - Math.min(score, 24));
            }

            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, 320, 480);
            ctx.fillStyle = '#fff';
            for (let y = (frame % 60) - 60; y < 520; y += 60) {
                ctx.fillRect(105, y, 3, 32);
                ctx.fillRect(180, y, 3, 32);
            }

            drawCar(player.x, player.y, '#0af');

            for (let i = cars.length - 1; i >= 0; i--) {
                const car = cars[i];
                car.y += Math.min(5.4, 3.8 + score * 0.035);
                drawCar(car.x, car.y, '#f33');
                if (hit(player, car)) over = true;
                if (car.y > 500) {
                    cars.splice(i, 1);
                    score++;
                }
            }

            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.fillText(`Score: ${score}`, 10, 25);
            frame += 4;
            rafRef.current = requestAnimationFrame(loop);
        };

        const keyDown = (e: KeyboardEvent) => {
            if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
            keysRef.current[e.key] = true;
        };
        const keyUp = (e: KeyboardEvent) => {
            keysRef.current[e.key] = false;
        };
        // Switching tabs/windows swallows the keyup, which would leave the car steering.
        const releaseAll = () => { keysRef.current = {}; };

        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        window.addEventListener('blur', releaseAll);
        loop();

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
            window.removeEventListener('blur', releaseAll);
        };
    }, [runId]);

    /* Touch left/right handlers for mobile */
    const handleTouchLeft = () => { keysRef.current.ArrowLeft = true; };
    const handleTouchLeftEnd = () => { keysRef.current.ArrowLeft = false; };
    const handleTouchRight = () => { keysRef.current.ArrowRight = true; };
    const handleTouchRightEnd = () => { keysRef.current.ArrowRight = false; };

    return (
        <>
            <div className="games-header">
                <div className="games-score">TRAFFIC</div>
                <div className="games-score muted">ARROWS</div>
            </div>
            <div className="games-screen-bezel">
                <canvas ref={canvasRef} className="arcade-canvas" width={320} height={480} />
            </div>
            {/* Touch left/right for mobile */}
            <div className="touch-lr-controls">
                <button
                    className="touch-lr-btn"
                    onTouchStart={(e) => { e.preventDefault(); handleTouchLeft(); }}
                    onTouchEnd={handleTouchLeftEnd}
                    onTouchCancel={handleTouchLeftEnd}
                    onMouseDown={handleTouchLeft}
                    onMouseUp={handleTouchLeftEnd}
                    onMouseLeave={handleTouchLeftEnd}
                    aria-label="Steer left"
                >◀</button>
                <button
                    className="touch-lr-btn"
                    onTouchStart={(e) => { e.preventDefault(); handleTouchRight(); }}
                    onTouchEnd={handleTouchRightEnd}
                    onTouchCancel={handleTouchRightEnd}
                    onMouseDown={handleTouchRight}
                    onMouseUp={handleTouchRightEnd}
                    onMouseLeave={handleTouchRightEnd}
                    aria-label="Steer right"
                >▶</button>
            </div>
            <div className="games-controls">
                <button className="btn" onClick={() => setRunId(id => id + 1)}>Restart</button>
            </div>
        </>
    );
};

const FlappyGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const [runId, setRunId] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const bird = { x: 72, y: 220, r: 12, v: 0 };
        const pipes: Array<{ x: number; gapY: number; scored: boolean }> = [];
        let score = 0;
        let over = false;
        let frame = 0;

        const flap = (e?: KeyboardEvent | MouseEvent | TouchEvent) => {
            if (e instanceof KeyboardEvent && e.key !== ' ') return;
            if (e) e.preventDefault();
            if (over) return;
            bird.v = -6.8;
        };

        const draw = () => {
            ctx.fillStyle = '#8fd3ff';
            ctx.fillRect(0, 0, 320, 480);
            ctx.fillStyle = '#0b6b45';
            ctx.fillRect(0, 438, 320, 42);

            bird.v += 0.32;
            bird.y += bird.v;

            if (frame % 104 === 0) {
                pipes.push({ x: 340, gapY: 120 + Math.random() * 180, scored: false });
            }

            ctx.fillStyle = '#1fb85a';
            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipe = pipes[i];
                pipe.x -= 2;
                const gap = 142;
                ctx.fillRect(pipe.x, 0, 42, pipe.gapY - gap / 2);
                ctx.fillRect(pipe.x, pipe.gapY + gap / 2, 42, 438 - (pipe.gapY + gap / 2));

                const inX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + 42;
                const inPipe = bird.y - bird.r < pipe.gapY - gap / 2 || bird.y + bird.r > pipe.gapY + gap / 2;
                if (inX && inPipe) over = true;
                if (!pipe.scored && pipe.x + 42 < bird.x) {
                    pipe.scored = true;
                    score++;
                }
                if (pipe.x < -50) pipes.splice(i, 1);
            }

            if (bird.y + bird.r > 438 || bird.y - bird.r < 0) over = true;

            ctx.fillStyle = '#ffd54a';
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.fillRect(bird.x + 5, bird.y - 5, 4, 4);

            ctx.fillStyle = '#fff';
            ctx.font = '18px sans-serif';
            ctx.fillText(`Score: ${score}`, 12, 28);

            if (over) {
                ctx.fillStyle = 'rgba(0,0,0,.7)';
                ctx.fillRect(0, 0, 320, 480);
                ctx.fillStyle = '#fff';
                ctx.font = '24px sans-serif';
                ctx.fillText('Game Over', 95, 220);
                ctx.fillText(`Score: ${score}`, 105, 255);
                return;
            }

            frame++;
            rafRef.current = requestAnimationFrame(draw);
        };

        window.addEventListener('keydown', flap);
        canvas.addEventListener('click', flap);
        canvas.addEventListener('touchstart', flap, { passive: false });
        draw();

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', flap);
            canvas.removeEventListener('click', flap);
            canvas.removeEventListener('touchstart', flap);
        };
    }, [runId]);

    return (
        <>
            <div className="games-header">
                <div className="games-score">FLAPPY</div>
                <div className="games-score muted">SPACE / TAP</div>
            </div>
            <div className="games-screen-bezel">
                <canvas ref={canvasRef} className="arcade-canvas" width={320} height={480} />
            </div>
            <div className="games-controls">
                <button className="btn" onClick={() => setRunId(id => id + 1)}>Restart</button>
            </div>
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
