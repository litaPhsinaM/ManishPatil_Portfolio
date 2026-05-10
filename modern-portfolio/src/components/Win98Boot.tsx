import React, { useEffect, useState } from 'react';
import '../styles/Win98Boot.css';

const Win98Boot: React.FC = () => {
    const [visible, setVisible] = useState(() => !sessionStorage.getItem('win98-booted'));
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (!visible) return;

        let prog = 0;
        const timeouts: number[] = [];
        const interval = setInterval(() => {
            prog += Math.random() * 18 + 5;
            if (prog >= 100) {
                prog = 100;
                clearInterval(interval);
                timeouts.push(window.setTimeout(() => {
                    setFadeOut(true);
                    timeouts.push(window.setTimeout(() => {
                        setVisible(false);
                        sessionStorage.setItem('win98-booted', '1');
                    }, 600));
                }, 400));
            }
            setProgress(Math.min(prog, 100));
        }, 180);

        return () => {
            clearInterval(interval);
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <div className={`win98-boot-splash ${fadeOut ? 'fade-out' : ''}`}>
            <div className="boot-content">
                <div className="boot-logo">
                    <span className="boot-flag">🪟</span>
                    <div className="boot-brand">
                        <span className="boot-win">Windows</span>
                        <span className="boot-98">98</span>
                    </div>
                </div>
                <div className="boot-divider" />
                <p className="boot-msg">Starting Windows 98<span className="boot-dots">...</span></p>
                <div className="boot-progress-track">
                    <div
                        className="boot-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="boot-copy">
                    Manish Patil Portfolio © 2026<br />
                    <small>Microsoft Windows 98 (Aesthetic)</small>
                </p>
            </div>
        </div>
    );
};

export default Win98Boot;
