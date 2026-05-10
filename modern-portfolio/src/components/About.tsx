import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

const winVariant = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.6, ease: 'easeOut' as const }
    },
};

const About: React.FC = () => {
    return (
        <section id="about" className="about-section">
            <div className="container">

                {/* Main About Window */}
                <motion.div
                    className="window about-window"
                    variants={winVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text">ℹ️ About Manish Patil — Properties</div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="window-body about-body">
                        {/* Top Grid: Photo + Text */}
                        <div className="about-top-grid">
                            {/* Photo */}
                            <div className="about-photo-frame">
                                <img
                                    src={`${import.meta.env.BASE_URL}About me.jpeg`}
                                    alt="Manish Patil"
                                />
                            </div>

                            {/* Text */}
                            <div className="about-text">
                                <h2 className="about-win-title">Professional Profile</h2>
                                <p className="about-lead">
                                    Systems Specialist & Software Engineer | M.S. in Computer Science
                                </p>
                                <p>
                                    As a Master's graduate in Computer Science from CSUDH with extensive experience in IT infrastructure and systems management, I am currently pivoting my career towards <strong>Cloud Engineering and DevOps</strong>.
                                </p>
                                <p>
                                    I am actively pursuing <strong>AWS Certifications</strong> to solidify my expertise in architecting scalable, secure, and highly available cloud solutions. My background in handling complex server environments and automating workflows helps me bridge the gap between development and operations.
                                </p>
                                <p>
                                    I am dedicated to solving infrastructure challenges through infrastructure-as-code (IaC), continuous integration/deployment (CI/CD), and robust cloud-native practices.
                                </p>
                            </div>
                        </div>

                        <hr className="about-rule" />

                        {/* Professional Skills / Tech Stack */}
                        <div className="about-skills-container">
                            <h3 className="about-win-title">Core Competencies & Skills</h3>
                            <div className="skills-grid">
                                <div className="skill-category">
                                    <strong>Software Dev:</strong> React, Node.js, Python, SQL, RESTful APIs, Git, CI/CD
                                </div>
                                <div className="skill-category">
                                    <strong>Cloud & Ops:</strong> AWS (in-progress), Systems Admin, Networking, Docker, Linux, VMware
                                </div>
                                <div className="skill-category">
                                    <strong>Data & Tools:</strong> Apache Airflow, Data Pipelines, ETL, Shell Scripting, IT Automation
                                </div>
                            </div>
                        </div>

                        <div className="win98-statusbar about-statusbar">
                            <div className="win98-panel">Available for Cloud/DevOps Roles</div>
                            <div className="win98-panel" style={{ flex: 1 }}>Contact: manishcpatil9@gmail.com</div>
                            <div className="win98-panel">rev 2.0</div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default About;
