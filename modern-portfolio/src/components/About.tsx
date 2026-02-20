import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

const About: React.FC = () => {
    return (
        <section id="about" className="about-section">
            <div className="container">
                <div className="about-hybrid-layout">
                    <div className="about-top-grid">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="about-image-container"
                        >
                            <div className="about-image glass small-profile">
                                <img src={`${import.meta.env.BASE_URL}About me.jpeg`} alt="Manish Patil" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="about-text"
                        >
                            <h2 className="section-title text-left">The Journey <span>.</span></h2>
                            <p className="lead">
                                Hello! I'm <strong>Manish Patil</strong>, an IT Professional and Software Engineer based in Long Beach, CA.
                            </p>
                            <p>
                                I recently completed my <strong>Master's in Computer Science</strong> at California State University, Dominguez Hills.
                                My expertise lies at the intersection of <strong>Systems Administration, IT Infrastructure, and Full-Stack Development</strong>.
                            </p>
                            <p>
                                With a strong background in IT operations and systems management, I focus on building efficient, secure, and scalable technical environments.
                                I combine my deep systems expertise with a passion for <strong>Software Engineering</strong> and <strong>Data Analytics</strong> to solve
                                complex infrastructure and automation challenges. My journey is driven by a commitment to technical excellence and a desire to
                                streamline operations through innovative technology.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="interests-wrapper-bottom"
                    >
                        <h3 className="interests-title">Life Outside Root <span>/</span></h3>
                        <div className="interests-grid-refined">
                            <div className="interest-item glass">
                                <div className="interest-content interest-card-with-img">
                                    <div className="interest-img-wrapper">
                                        <img src={`${import.meta.env.BASE_URL}FOOTBALL.jpg`} alt="Soccer" className="interest-img" />
                                    </div>
                                    <div className="interest-details">
                                        <div className="interest-header">
                                            <span>⚽</span>
                                            <h4>Football</h4>
                                        </div>
                                        <p>Played for MDFA division in Mumbai; now active in friendly matches and a local Long Beach league.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="interest-item glass">
                                <div className="interest-content interest-card-with-img">
                                    <div className="interest-img-wrapper">
                                        <img src={`${import.meta.env.BASE_URL}photography.jpg`} alt="Photography" className="interest-img" />
                                    </div>
                                    <div className="interest-details">
                                        <div className="interest-header">
                                            <span>📸</span>
                                            <h4>Photography</h4>
                                        </div>
                                        <p>A hobby that keeps my bank account humble. If it's blurry, it's "cinematic."</p>
                                    </div>
                                </div>
                            </div>
                            <div className="interest-item glass">
                                <div className="interest-content interest-card-with-img">
                                    <div className="interest-img-wrapper">
                                        <img src={`${import.meta.env.BASE_URL}snowboarding.jpg`} alt="Snowboarding" className="interest-img" />
                                    </div>
                                    <div className="interest-details">
                                        <div className="interest-header">
                                            <span>🏂</span>
                                            <h4>Snowboarding</h4>
                                        </div>
                                        <p>Recently started but easily my new favorite escape. Learning to carve, one wipeout at a time.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
