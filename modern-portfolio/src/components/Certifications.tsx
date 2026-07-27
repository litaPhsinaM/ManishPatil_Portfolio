import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Certifications.css';

interface Cert {
    name: string;
    status: 'Complete' | 'In Progress' | 'Next Up';
}

const certifications: Cert[] = [
    { name: 'CompTIA A+', status: 'In Progress' },
    { name: 'Jamf 100 & 200', status: 'Complete' },
    { name: 'Career Essentials in Generative AI (Microsoft/LinkedIn)', status: 'Complete' },
    { name: 'Python for Everybody', status: 'Complete' },
    { name: 'Introduction to SQL', status: 'Complete' },
    { name: 'Data Analyst Bootcamp', status: 'Complete' },
    { name: 'Cisco Data Analytics Essentials', status: 'Complete' },
    { name: 'CompTIA Network+', status: 'Next Up' },
    { name: 'CompTIA Security+', status: 'Next Up' },
];

const winVariant = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

const Certifications: React.FC = () => {
    return (
        <section id="certifications" className="certifications-section">
            <div className="container">
                <motion.div
                    className="window cert-window"
                    variants={winVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text">📜 Certifications &amp; Career Roadmap — My Computer</div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="win98-menubar">
                        <span>File</span>
                        <span>Edit</span>
                        <span>View</span>
                        <span>Go</span>
                        <span>Favorites</span>
                        <span>Help</span>
                    </div>

                    <div className="win98-address-bar">
                        <span className="win98-address-label">Address</span>
                        <div className="win98-address-input-container">
                            <span className="win98-address-icon">📜</span>
                            <input type="text" className="win98-address-input" value="C:\Manish_Patil\Certifications" readOnly />
                            <button className="win98-address-dropdown-btn">▼</button>
                        </div>
                    </div>

                    <div className="window-body cert-body">
                        <p className="cert-intro">
                            Actively building toward Systems Administration &amp; Security roles —
                            here's what's done and what's next.
                        </p>
                        <div className="cert-list">
                            {certifications.map((cert) => (
                                <div key={cert.name} className="cert-row">
                                    <span className="cert-name">{cert.name}</span>
                                    <span
                                        className={`cert-status cert-status--${cert.status
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')}`}
                                    >
                                        {cert.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="win98-statusbar">
                        <div className="win98-panel">{certifications.length} object(s)</div>
                        <div className="win98-panel" style={{ flex: 1 }}>
                            {certifications.filter((c) => c.status === 'Complete').length} complete ·{' '}
                            {certifications.filter((c) => c.status === 'Next Up').length} queued
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Certifications;
