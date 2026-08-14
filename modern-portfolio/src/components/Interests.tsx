import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Interests.css';

import { photos, type Photo } from '../data/portfolio';

const winVariant = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1, scale: 1,
        transition: { duration: 0.5, ease: 'easeOut' as const }
    },
};

const interests = [
    {
        title: 'Football.exe',
        icon: '⚽',
        img: 'FOOTBALL.jpg',
        desc: 'Mumbai Division player; active in Long Beach league.',
    },
    {
        title: 'Photography.exe',
        icon: '📸',
        img: 'photography.webp',
        desc: 'All shot on a phone. The keepers live on 500px.',
    },
    {
        title: 'Snowboarding.exe',
        icon: '🏂',
        img: 'snowboarding.jpg',
        desc: 'Learning to carve, one wipeout at a time.',
    },
];

const photoSrc = (photo: Photo) => `${import.meta.env.BASE_URL}photos/${photo.file}`;
const photoAlt = (photo: Photo) => photo.caption || 'Photograph by Manish Patil';

/** Fraction of full speed a row drops to while the pointer is over it. */
const HOVER_SPEED_FACTOR = 0.16;

/**
 * Drives one marquee row with rAF instead of a CSS animation: changing an
 * animation-duration mid-flight makes the track jump, but easing a px/sec
 * value lets the row glide down to a crawl and back up again.
 */
function useMarqueeRow(direction: 1 | -1, baseSpeed: number) {
    const trackRef = useRef<HTMLDivElement>(null);
    const targetSpeed = useRef(baseSpeed);
    const speed = useRef(baseSpeed);
    const offset = useRef(0);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let frame = 0;
        let last = performance.now();
        let visible = true;

        const observer = new IntersectionObserver(
            ([entry]) => { visible = entry.isIntersecting; },
            { rootMargin: '120px' }
        );
        observer.observe(track);

        const tick = (now: number) => {
            // Clamp dt so a backgrounded tab doesn't teleport the row on return.
            const dt = Math.min(now - last, 64) / 1000;
            last = now;

            if (visible) {
                speed.current += (targetSpeed.current - speed.current) * Math.min(1, dt * 5);
                // The track holds the photo set twice, so one half is a full period.
                const half = track.scrollWidth / 2;
                if (half > 0) {
                    offset.current += speed.current * dt * direction;
                    offset.current = (((offset.current % half) + half) % half) - half;
                    track.style.transform = `translate3d(${offset.current}px, 0, 0)`;
                }
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [direction]);

    const slow = () => { targetSpeed.current = baseSpeed * HOVER_SPEED_FACTOR; };
    const resume = () => { targetSpeed.current = baseSpeed; };

    return { trackRef, slow, resume };
}

interface MarqueeRowProps {
    items: Photo[];
    direction: 1 | -1;
    speed: number;
    onFocusPhoto: (photo: Photo | null) => void;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ items, direction, speed, onFocusPhoto }) => {
    const { trackRef, slow, resume } = useMarqueeRow(direction, speed);
    // Two identical halves: the row wraps by one half-width, so the seam never shows.
    const loop = [...items, ...items];

    return (
        <div
            className="marquee-row"
            onMouseEnter={slow}
            onMouseLeave={() => { resume(); onFocusPhoto(null); }}
        >
            <div className="marquee-track" ref={trackRef}>
                {loop.map((photo, idx) => (
                    <figure
                        className="marquee-card"
                        key={`${photo.file}-${idx}`}
                        onMouseEnter={() => onFocusPhoto(photo)}
                    >
                        <div className="marquee-card-bar">
                            <span className="marquee-card-icon" aria-hidden="true">🖼</span>
                            <span className="marquee-card-name">{photo.file}</span>
                        </div>
                        <div className="marquee-frame">
                            <img
                                src={photoSrc(photo)}
                                alt={photoAlt(photo)}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                        </div>
                    </figure>
                ))}
            </div>
        </div>
    );
};

const Interests: React.FC = () => {
    const [focused, setFocused] = useState<Photo | null>(null);
    // Split rather than repeat, so the two rows never show the same shot at once.
    const half = Math.ceil(photos.length / 2);
    const rowOne = photos.slice(0, half);
    const rowTwo = photos.slice(half);

    return (
        <section id="life-outside" className="interests-section">
            <div className="container">
                <header className="section-header">
                    <h2 className="win98-title">Life Outside Root /</h2>
                </header>

                <div className="interests-strip">
                    {interests.map((item, idx) => (
                        <motion.div
                            key={item.title}
                            className="window interest-mini-card"
                            variants={winVariant}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="title-bar">
                                <div className="title-bar-text">{item.icon} {item.title}</div>
                            </div>
                            <div className="window-body mini-body">
                                <div className="mini-img-frame">
                                    <img src={`${import.meta.env.BASE_URL}${item.img}`} alt={item.title} />
                                </div>
                                <p className="mini-desc">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div
                className="photo-marquee"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <MarqueeRow items={rowOne} direction={-1} speed={46} onFocusPhoto={setFocused} />
                <MarqueeRow items={rowTwo} direction={1} speed={38} onFocusPhoto={setFocused} />
            </motion.div>

            <div className="container">
                <div className="win98-statusbar marquee-statusbar">
                    <div className="win98-panel">{photos.length} item(s)</div>
                    <div className="win98-panel marquee-status-name">
                        {focused
                            ? `${focused.file}${focused.caption ? ` — ${focused.caption}` : ''}`
                            : 'Hover a row to slow it down'}
                    </div>
                    <a
                        className="win98-panel gallery-full-link"
                        href="https://500px.com/p/ManishPatil1?view=photos"
                        target="_blank"
                        rel="noreferrer"
                    >
                        View Full Gallery on 500px ↗
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Interests;
