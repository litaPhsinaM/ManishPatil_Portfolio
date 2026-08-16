import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Download, ExternalLink, Linkedin } from 'lucide-react';
import Insights from './Insights';
import '../styles/Footer.css';

const LINKEDIN_URL = 'https://www.linkedin.com/in/manish-patil-b50967182/';

const winVariant = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

const Footer: React.FC = () => {
    // Must match the filename in public/ exactly. The previous value pointed at
    // "Manish Patil.pdf", which was replaced by this file and no longer ships, so the
    // preview and both download buttons would have 404'd on the next deploy.
    const resumeUrl = `${import.meta.env.BASE_URL}Manish%20Patil%20Resume.pdf`;

    // Every other Help button on the site is decorative, which is exactly what
    // makes this one a good door: it looks identical to the eight that do nothing.
    const [insightsOpen, setInsightsOpen] = useState(false);

    return (
        <footer id="footer" className="footer-section">
            <div className="container">
                <motion.div
                    className="window footer-shell-win"
                    variants={winVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text">📬 Resume & Contact Center</div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" onClick={() => setInsightsOpen(true)} />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="win98-menubar footer-menubar">
                        <span>File</span>
                        <span>Edit</span>
                        <span>Tools</span>
                        <span>Message</span>
                        <span>Help</span>
                    </div>

                    <div className="window-body footer-shell-body">
                        <section className="footer-resume-panel" aria-labelledby="resume-preview-title">
                            <div className="footer-panel-heading" id="resume-preview-title">Resume Preview</div>
                            <div className="resume-preview-frame">
                                <object
                                    data={resumeUrl}
                                    type="application/pdf"
                                    className="resume-preview"
                                    aria-label="Manish Patil resume PDF preview"
                                >
                                    <div className="resume-fallback">
                                        <p>Resume preview is not available in this browser.</p>
                                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn">
                                            <ExternalLink size={14} /> Open Resume
                                        </a>
                                    </div>
                                </object>
                            </div>

                            <div className="resume-btns">
                                <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn" data-track="resume:view">
                                    <ExternalLink size={14} /> View Full Resume
                                </a>
                                <a href={resumeUrl} download="Manish Patil Resume.pdf" className="btn-secondary" data-track="resume:download">
                                    <Download size={14} /> Download PDF
                                </a>
                            </div>
                        </section>

                        <section className="footer-contact-panel" aria-labelledby="contact-form-title">
                            <h2 className="footer-win-heading">Get in Touch<span>.</span></h2>
                            <p className="footer-desc">For systems administration, security, software, or data roles, this is the fastest place to reach me.</p>

                            <div className="contact-rows">
                                <a className="contact-row" href="https://maps.google.com/?q=Long+Beach,+CA" target="_blank" rel="noreferrer">
                                    <MapPin size={14} />
                                    <span>Long Beach, CA</span>
                                </a>
                                <a className="contact-row" href="tel:+15624719898">
                                    <Phone size={14} />
                                    <span>(562) 471-9898</span>
                                </a>
                                <a className="contact-row" href="mailto:manishcpatil9@gmail.com">
                                    <Mail size={14} />
                                    <span>manishcpatil9@gmail.com</span>
                                </a>
                                <a className="contact-row" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                                    <Linkedin size={14} />
                                    <span>LinkedIn Profile</span>
                                </a>
                            </div>

                            <div className="footer-panel-heading" id="contact-form-title">Send Message</div>
                            <form action="https://formsubmit.co/manishcpatil9@gmail.com" method="POST">
                                <input type="hidden" name="_subject" value="Portfolio contact form message" />
                                <input type="hidden" name="_captcha" value="false" />
                                <input type="hidden" name="_next" value="https://litaphsinam.github.io/ManishPatil_Portfolio/" />

                                <div className="form-row">
                                    <label htmlFor="contact-name">Name</label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        name="name"
                                        autoComplete="name"
                                        required
                                    />
                                </div>

                                <div className="form-row two-column">
                                    <div>
                                        <label htmlFor="contact-email">Email</label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-topic">Topic</label>
                                        <select id="contact-topic" name="topic" defaultValue="Opportunity">
                                            <option>Opportunity</option>
                                            <option>Project</option>
                                            <option>Collaboration</option>
                                            <option>General</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <label htmlFor="contact-msg">Message</label>
                                    <textarea
                                        id="contact-msg"
                                        name="message"
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn form-submit-btn" data-track="contact:send">
                                        📤 Send Message
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>

                    <div className="footer-statusbar win98-statusbar">
                        <div className="win98-panel">
                            © {new Date().getFullYear()} Manish Patil
                        </div>
                        <div className="win98-panel" style={{ flex: 1 }}>
                            Contact ready
                        </div>
                        <div className="win98-panel">
                            Windows 98 Edition
                        </div>
                    </div>
                </motion.div>
            </div>

            <Insights open={insightsOpen} onClose={() => setInsightsOpen(false)} />
        </footer>
    );
};

export default Footer;
