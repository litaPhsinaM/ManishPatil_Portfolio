import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Interests.css';

import { photos } from '../data/portfolio';

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
        img: 'photography.jpg',
        desc: 'Capturing moments through a vintage lens.',
    },
    {
        title: 'Snowboarding.exe',
        icon: '🏂',
        img: 'snowboarding.jpg',
        desc: 'Learning to carve, one wipeout at a time.',
    },
];

const Interests: React.FC = () => {
    return (
        <section id="life-outside" className="interests-section">
            <div className="container">
                <header className="section-header">
                    <h2 className="win98-title">Life Outside Root /</h2>
                </header>

                <div className="merged-layout">
                    {/* Left: Compact Interest Boxes */}
                    <div className="interests-column">
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

                    {/* Right: Scrollable Photo Explorer */}
                    <motion.div
                        className="window gallery-window"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="title-bar">
                            <div className="title-bar-text">🖼️ Photo Gallery — Explorer</div>
                            <div className="title-bar-controls">
                                <button aria-label="Help" />
                                <button aria-label="Close" />
                            </div>
                        </div>

                        {/* Explorer Navigation Bar */}
                        <div className="win98-address-bar">
                            <span className="win98-address-label">Address</span>
                            <div className="win98-address-input-container">
                                <span className="win98-address-icon">📁</span>
                                <input type="text" className="win98-address-input" value="C:\My Photos" readOnly />
                            </div>
                        </div>

                        <div className="window-body explorer-body">
                            <div className="explorer-grid">
                                {photos.map((photo) => (
                                    <div key={photo.url} className="explorer-item">
                                        <div className="explorer-icon-frame">
                                            <img src={photo.url} alt={photo.caption} />
                                        </div>
                                        <div className="explorer-label">{photo.caption}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="win98-statusbar">
                            <div className="win98-panel">{photos.length} item(s)</div>
                            <div className="win98-panel" style={{ flex: 1 }}>Select an item to view</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Interests;
