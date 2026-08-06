import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSignalFeed } from '../hooks/useSignalFeed';
import '../styles/Hero.css';

const desktopIcons = [
    { icon: '🖥️', label: 'About Me', href: '#about' },
    { icon: '📁', label: 'Experience', href: '#experience' },
    { icon: '💾', label: 'Projects', href: '#projects' },
    { icon: '📡', label: 'Signals', href: '#signals' },
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
    const shouldReduceMotion = useReducedMotion();

    const [isNarrow, setIsNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 900px)');
        const update = () => setIsNarrow(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const parallaxEnabled = !shouldReduceMotion && !isNarrow;

    const { status, totalItems, isStale, payload } = useSignalFeed();
    const signalState = status === 'error' ? 'offline' : isStale ? 'stale' : status === 'ready' ? 'live' : 'syncing';
    const signalLabel = {
        live: 'LIVE',
        stale: 'STALE',
        offline: 'OFFLINE',
        syncing: 'SYNC…',
    }[signalState];
    const lastSync = payload
        ? new Date(payload.generatedAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
        : '--';

    // Multi-layer parallax: background pattern drifts least (farthest away),
    // desktop icons drift a bit more, the foreground window drifts most —
    // transform-only (GPU-cheap), no filter/top/left animation.
    const bgY = useTransform(scrollY, [0, 400], [0, parallaxEnabled ? 15 : 0]);
    const iconsY = useTransform(scrollY, [0, 400], [0, parallaxEnabled ? 35 : 0]);
    const windowY = useTransform(scrollY, [0, 400], [0, parallaxEnabled ? 60 : 0]);

    const skillGroups = [
        {
            title: 'Systems & IT Operations',
            value: 'JAMF/MDM, Google Workspace Admin, DNS/VPN/WiFi, Linux, VMware, Windows/macOS cross-platform support, RBAC/JWT, audit logging, ADA-compliant web ops',
        },
        {
            title: 'Languages, Frameworks & Cloud',
            value: 'Python, JavaScript, SQL, React, Node.js/Express, PostgreSQL, MongoDB, RESTful APIs, Git, CI/CD, AWS, Azure, GCP, Apache Airflow, PySpark, BigQuery',
        },
    ];

    const handleDesktopAction = (href: string) => {
        if (href === '#games' && onOpenGame) {
            onOpenGame();
            return;
        }
        if (href.startsWith('#')) {
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        navigate(href);
    };

    return (
        <section id="home" className="hero-desktop">
            <motion.div className="hero-bg-layer" style={{ y: bgY }} />
            <div className="crt-overlay" />

            {/* Desktop Icons */}
            <motion.div className="desktop-icons-container" style={{ y: iconsY }}>
                {desktopIcons.map((ic) => (
                    <a
                        key={ic.label}
                        // Route targets need the hash form so middle-click / open-in-new-tab
                        // resolves through HashRouter instead of 404ing on a real path.
                        href={ic.href.startsWith('#') ? ic.href : `#${ic.href}`}
                        className="desktop-icon"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDesktopAction(ic.href);
                        }}
                    >
                        <span className="desktop-icon-img">{ic.icon}</span>
                        <span className="desktop-icon-label">{ic.label}</span>
                    </a>
                ))}
            </motion.div>

            {/* Main Portfolio Window */}
            <motion.div
                className="hero-win window"
                style={{ y: windowY }}
                initial={{ opacity: 0, scale: 0.8, filter: 'brightness(2)' }}
                animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="title-bar">
                    <div className="title-bar-text glitch-text" data-text="Manish_Patil.exe - Portfolio v2.0">
                        Manish_Patil.exe - Portfolio v2.0
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
                        <input
                            type="text"
                            className="win98-address-input"
                            value={'C:\\Manish_Patil\\About_Me'}
                            readOnly
                        />
                        <button className="win98-address-dropdown-btn">▼</button>
                    </div>
                </div>

                <div id="about" className="window-body hero-body">
                    <div className="hero-content-grid">
                        <div className="hero-profile-panel">
                            <div className="hero-photo-frame">
                                <img
                                    src={`${import.meta.env.BASE_URL}About me.jpeg`}
                                    alt="Manish Patil"
                                />
                            </div>

                            <div className="hero-profile-copy">
                                <h1 className="hero-title">
                                    Manish Patil<span className="cursor-blink">_</span>
                                </h1>
                                <div className="hero-subtitle-container">
                                    <motion.p
                                        className="hero-subtitle"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.5, ease: 'linear' }}
                                        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                                    >
                                        [root@portfolio ~]# whoami --track=sysadmin,security,cloud,swe --status=CompTIA_Linux+_in_progress
                                    </motion.p>
                                </div>
                                <p className="hero-description">
                                    M.S. Computer Science • CSUDH
                                    <br />
                                    IT Specialist &amp; Software Engineer, building toward Systems Administration &amp; Security
                                </p>
                            </div>

                            <div className="hero-action-row">
                                <button
                                    type="button"
                                    className="hero-action-btn"
                                    onClick={() => handleDesktopAction('#projects')}
                                >
                                    ▶ Explore Work
                                </button>
                                <button
                                    type="button"
                                    className="hero-action-btn"
                                    onClick={() => handleDesktopAction('#experience')}
                                >
                                    📁 Experience
                                </button>
                                <button
                                    type="button"
                                    className="hero-action-btn"
                                    onClick={() => handleDesktopAction('/resume')}
                                >
                                    📄 Resume
                                </button>
                            </div>

                        </div>

                        <div className="hero-main-panel">
                            <div className="hero-panel-window">
                                <div className="hero-panel-header">
                                    <span>Professional Profile</span>
                                    <span className="hero-panel-badge">Properties</span>
                                </div>
                                <div className="hero-panel-body">
                                    <p className="hero-panel-lead">
                                        IT Specialist &amp; Software Engineer | M.S. in Computer Science
                                    </p>
                                    <p>
                                        I'm an IT Specialist at CSUDH keeping infrastructure running for
                                        4,000&ndash;5,000+ managed devices. That means provisioning, MDM
                                        (JAMF-certified), DNS/VPN/WiFi, Google Workspace Admin, and the unglamorous
                                        stuff that has to work every single day. Alongside that I build the internal
                                        software that makes IT operations less painful: a full-stack ticketing and
                                        asset-management system (React, Node.js, PostgreSQL, JWT/RBAC) that replaced
                                        manual spreadsheets with real audit trails.
                                    </p>
                                    <p>
                                        I'm currently working through CompTIA Linux+, with AutoOps+ and Security+
                                        next, because I'm deliberately going deeper into core IT infrastructure,
                                        automation, and security rather than around it. The goal is System
                                        Administrator and Security-focused roles, the kind of work where you
                                        actually own the boxes, the network, and the risk, not just the ticket
                                        queue.
                                    </p>
                                    <p>
                                        None of this replaces the software and data side; it stacks on top of it.
                                        I've shipped MERN-stack apps, built CNN models in PyTorch (99.77% validation
                                        accuracy on 3D shape classification), and built cloud data pipelines on GCP
                                        and Azure (Mage, BigQuery, Databricks, Synapse). I like sitting at the
                                        intersection of systems, security, and data. Most interesting problems live
                                        there anyway.
                                    </p>
                                </div>
                            </div>

                            <div className="hero-panel-window">
                                <div className="hero-panel-header">
                                    <span>Core Competencies</span>
                                    <span className="hero-panel-badge">{skillGroups.length} folders</span>
                                </div>
                                <div className="hero-skill-grid">
                                    {skillGroups.map((group) => (
                                        <div key={group.title} className="hero-skill-card">
                                            <div className="hero-skill-title">{group.title}</div>
                                            <p>{group.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="hero-panel-window hero-signal-window">
                                <div className="hero-panel-header">
                                    <span>Signal Monitor</span>
                                    <span className={`hero-signal-status ${signalState}`}>
                                        <span className="hero-signal-led" aria-hidden="true" />
                                        {signalLabel}
                                    </span>
                                </div>
                                <div className="hero-signal-body">
                                    <div className="hero-signal-lead-row">
                                        <p className="hero-signal-lead">
                                            This site pulls live security, AI, and software feeds on its own
                                            schedule. Nothing here is typed in by hand.
                                        </p>
                                        <button
                                            type="button"
                                            className="hero-action-btn hero-signal-btn"
                                            onClick={() => handleDesktopAction('#signals')}
                                        >
                                            📡 Open Signal Monitor
                                        </button>
                                    </div>
                                    <div className="hero-signal-stats">
                                        <div className="hero-signal-stat">
                                            <span className="hero-signal-stat-value">
                                                {status === 'ready' ? totalItems : '--'}
                                            </span>
                                            <span className="hero-signal-stat-label">tracked items</span>
                                        </div>
                                        <div className="hero-signal-stat">
                                            <span className="hero-signal-stat-value">3</span>
                                            <span className="hero-signal-stat-label">live feeds</span>
                                        </div>
                                        <div className="hero-signal-stat hero-signal-stat-wide">
                                            <span className="hero-signal-stat-value">{lastSync}</span>
                                            <span className="hero-signal-stat-label">last sync</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="win98-statusbar hero-statusbar">
                    <div className="win98-panel">Open to Systems Administration &amp; Security roles</div>
                    <div className="win98-panel">Contact: manishcpatil9@gmail.com</div>
                    <div className="win98-panel">rev 2.0</div>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
