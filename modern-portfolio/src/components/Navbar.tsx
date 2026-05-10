import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';
import '../styles/Navbar.css';

const LINKEDIN_URL = 'https://www.linkedin.com/in/manish-patil-b50967182/';

const Win98Clock: React.FC = () => {
    const [time, setTime] = useState('');
    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            setTime(`${h}:${m}`);
        };
        update();
        const id = setInterval(update, 10000);
        return () => clearInterval(id);
    }, []);
    return <span className="taskbar-clock">{time}</span>;
};

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isStartOpen, setIsStartOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (id: string) => {
        setIsOpen(false);
        setIsStartOpen(false);

        const scroll = () => {
            if (id === 'top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        };

        if (location.pathname !== '/') {
            navigate('/');
            window.setTimeout(scroll, 80);
            return;
        }

        scroll();
    };

    return (
        <nav className="win98-taskbar">
            {/* Backdrop to close start menu on outside click */}
            {isStartOpen && (
                <div
                    className="start-menu-backdrop"
                    onClick={() => setIsStartOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Start Menu Popup */}
            {isStartOpen && (
                <div className="start-menu">
                    <div className="start-menu-sidebar">
                        <div className="sidebar-text">Windows<span>98</span></div>
                    </div>
                    <div className="start-menu-items">
                        <div className="menu-item" onClick={() => scrollToSection('top')}>
                            <span className="menu-icon">🖥️</span>
                            <span className="menu-label">Desktop</span>
                        </div>
                        <div className="menu-divider" />
                        <div className="menu-item" onClick={() => scrollToSection('about')}>
                            <span className="menu-icon">ℹ️</span>
                            <span className="menu-label">About Me</span>
                        </div>
                        <div className="menu-item" onClick={() => scrollToSection('experience')}>
                            <span className="menu-icon">📁</span>
                            <span className="menu-label">Experience</span>
                        </div>
                        <div className="menu-item" onClick={() => scrollToSection('projects')}>
                            <span className="menu-icon">💾</span>
                            <span className="menu-label">Projects</span>
                        </div>
                        <div className="menu-item" onClick={() => scrollToSection('life-outside')}>
                            <span className="menu-icon">🖼️</span>
                            <span className="menu-label">Interests</span>
                        </div>
                        <div className="menu-divider" />
                        <NavLink to="/resume" className="menu-item" onClick={() => setIsStartOpen(false)}>
                            <span className="menu-icon">📄</span>
                            <span className="menu-label">Resume.pdf</span>
                        </NavLink>
                        <div className="menu-item" onClick={() => scrollToSection('footer')}>
                            <span className="menu-icon">📧</span>
                            <span className="menu-label">Contact</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Button */}
            <button
                className={`taskbar-start-btn ${isStartOpen ? 'active-task' : ''}`}
                onClick={() => setIsStartOpen(!isStartOpen)}
                aria-label="Start menu"
                aria-expanded={isStartOpen}
            >
                <span className="start-flag">🪟</span>
                <span className="start-label">Start</span>
            </button>

            <div className="taskbar-divider" />

            {/* App Shortcuts (Always Visible Desktop-style) */}
            <div className="taskbar-shortcuts">
                <button className="taskbar-app-btn" onClick={() => scrollToSection('about')}>
                    <span style={{ marginRight: '4px' }}>ℹ️</span> About
                </button>
                <button className="taskbar-app-btn" onClick={() => scrollToSection('experience')}>
                    <span style={{ marginRight: '4px' }}>📁</span> Exp
                </button>
                <button className="taskbar-app-btn" onClick={() => scrollToSection('projects')}>
                    <span style={{ marginRight: '4px' }}>💾</span> Proj
                </button>
                <NavLink to="/resume" className="taskbar-app-btn">
                    <span style={{ marginRight: '4px' }}>📄</span> Resume
                </NavLink>
            </div>

            <div className="taskbar-divider" />

            {/* Social / Support Buttons in taskbar area */}
            <div className={`taskbar-apps ${isOpen ? 'open' : ''}`}>
                <a
                    href="https://github.com/litaPhsinaM"
                    target="_blank"
                    rel="noreferrer"
                    className="taskbar-app-btn"
                    onClick={() => setIsOpen(false)}
                >
                    <Github size={14} style={{ marginRight: '6px' }} />
                    GitHub
                </a>
                <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="taskbar-app-btn"
                    onClick={() => setIsOpen(false)}
                >
                    <Linkedin size={14} style={{ marginRight: '6px' }} />
                    LinkedIn
                </a>
            </div>

            {/* Spacer */}
            <div className="taskbar-spacer" />

            {/* System Tray */}
            <div className="taskbar-tray">
                <div className="tray-sep" />
                <Win98Clock />
            </div>

            {/* Mobile hamburger */}
            <button
                className="taskbar-hamburger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle social links menu"
                aria-expanded={isOpen}
            >
                ▲
            </button>
        </nav>
    );
};

export default Navbar;
