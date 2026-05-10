import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/Hero.css';

const desktopIcons = [
    { icon: '🖥️', label: 'About Me', href: '#about' },
    { icon: '📁', label: 'Experience', href: '#experience' },
    { icon: '💾', label: 'Projects', href: '#projects' },
    { icon: '🎮', label: 'Games', href: '#games' },
    { icon: '📄', label: 'Resume.pdf', href: '/resume' },
    { icon: '🗑️', label: 'Recycle Bin', href: '#footer' },
];

interface HeroProps {
    onOpenGame?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenGame }) => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();

    const windowY = useTransform(scrollY, [0, 400], [0, 60]);

    return (
        <section id="home" className="hero-desktop">
            <div className="crt-overlay" />

            {/* Desktop Icons */}
            <div className="desktop-icons-container">
                {desktopIcons.map((ic) => (
                    <a
                        key={ic.label}
                        href={ic.href}
                        className="desktop-icon"
                        onClick={(e) => {
                            e.preventDefault();
                            if (ic.href === '#games' && onOpenGame) {
                                onOpenGame();
                                return;
                            }
                            if (ic.href.startsWith('#')) {
                                const el = document.querySelector(ic.href);
                                el?.scrollIntoView({ behavior: 'smooth' });
                                return;
                            }
                            navigate(ic.href);
                        }}
                    >
                        <span className="desktop-icon-img">{ic.icon}</span>
                        <span className="desktop-icon-label">{ic.label}</span>
                    </a>
                ))}
            </div>

            {/* Main Portfolio Window */}
            <motion.div
                className="hero-win window"
                style={{ y: windowY }}
                initial={{ opacity: 0, scale: 0.8, filter: 'brightness(2)' }}
                animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="title-bar">
                    <div className="title-bar-text glitch-text" data-text="Manish_Patil.exe — Portfolio v2.0">
                        Manish_Patil.exe — Portfolio v2.0
                    </div>
                    <div className="title-bar-controls">
                        <button aria-label="Help" />
                        <button aria-label="Minimize" />
                        <button aria-label="Maximize" />
                        <button aria-label="Close" />
                    </div>
                </div>

                {/* Authentic Win98 Navigation */}
                <div className="win98-menubar">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Go</span>
                    <span>Favorites</span>
                    <span>Help</span>
                </div>

                <div className="win98-toolbar">
                    <button className="win98-toolbar-btn">
                        <span className="icon">⬅️</span>
                        <span>Back</span>
                    </button>
                    <button className="win98-toolbar-btn">
                        <span className="icon">➡️</span>
                        <span>Forward</span>
                    </button>
                    <button className="win98-toolbar-btn">
                        <span className="icon">⬆️</span>
                        <span>Up</span>
                    </button>

                    <div className="win98-toolbar-divider"></div>

                    <button className="win98-toolbar-btn">
                        <span className="icon">✂️</span>
                        <span>Cut</span>
                    </button>
                    <button className="win98-toolbar-btn">
                        <span className="icon">📋</span>
                        <span>Copy</span>
                    </button>
                    <button className="win98-toolbar-btn">
                        <span className="icon">📋</span>
                        <span>Paste</span>
                    </button>

                    <div className="win98-toolbar-divider"></div>

                    <button className="win98-toolbar-btn">
                        <span className="icon">↩️</span>
                        <span>Undo</span>
                    </button>
                    <button className="win98-toolbar-btn">
                        <span className="icon">❌</span>
                        <span>Delete</span>
                    </button>
                </div>

                <div className="win98-address-bar">
                    <span className="win98-address-label">Address</span>
                    <div className="win98-address-input-container">
                        <span className="win98-address-icon">🖥️</span>
                        <input type="text" className="win98-address-input" value="C:\About_Me" readOnly />
                        <button className="win98-address-dropdown-btn">▼</button>
                    </div>
                </div>

                <div className="window-body hero-body">
                    <h1 className="hero-title">
                        Manish Patil<span className="cursor-blink">_</span>
                    </h1>
                    <div className="hero-subtitle-container">
                        <motion.p
                            className="hero-subtitle"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                            style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                            [root@portfolio ~]# sys_admin --expertise
                        </motion.p>
                    </div>
                    <p className="hero-description">
                        Master's in Computer Science • CSUDH<br />
                        Specializing in IT Infrastructure, Systems Management, and Robust Software Solutions.
                    </p>
                    <div className="hero-actions">
                        <a href="#projects" className="btn explorer-btn">▶ Explore Work</a>
                        <a href="#about" className="btn-secondary profile-btn">ℹ️ About Me</a>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="win98-statusbar hero-statusbar">
                    <div className="win98-panel">Ready</div>
                    <div className="win98-panel">Long Beach, CA</div>
                    <div className="win98-panel">CSUDH M.S. CS</div>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
