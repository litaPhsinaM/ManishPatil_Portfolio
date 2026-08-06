import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { readStorage, writeStorage } from '../utils/safeStorage';
import '../styles/AchievementToast.css';

const STORAGE_KEY = 'achievement-projects-seen';
const TARGET_SECTION_ID = 'projects';
const AUTO_DISMISS_MS = 5000;

const AchievementToast: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (readStorage('session', STORAGE_KEY)) return;

        const target = document.getElementById(TARGET_SECTION_ID);
        if (!target) return;

        let dismissTimeout: number | undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                writeStorage('session', STORAGE_KEY, '1');
                setVisible(true);
                observer.disconnect();
                dismissTimeout = window.setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
            },
            { threshold: 0.35 }
        );
        observer.observe(target);

        return () => {
            observer.disconnect();
            window.clearTimeout(dismissTimeout);
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="achievement-toast window"
                    role="status"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text">System Notification</div>
                        <div className="title-bar-controls">
                            <button aria-label="Close" onClick={() => setVisible(false)} />
                        </div>
                    </div>
                    <div className="window-body achievement-toast-body">
                        <span className="achievement-toast-icon">🏆</span>
                        <div>
                            <p className="achievement-toast-title">Achievement Unlocked</p>
                            <p className="achievement-toast-desc">Reached the Projects folder</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AchievementToast;
