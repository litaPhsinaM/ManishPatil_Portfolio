import React from 'react';
import { Mail, Phone, MapPin, Download, ExternalLink } from 'lucide-react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
    return (
        <footer id="resume" className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="contact-info">
                        <h2 className="section-title text-left">Get in Touch <span>.</span></h2>
                        <p className="contact-desc">
                            I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
                        </p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <MapPin size={20} className="text-sky-400" />
                                <span>Long Beach, CA</span>
                            </div>
                            <div className="contact-item">
                                <Phone size={20} className="text-sky-400" />
                                <span>(562) 471-9898</span>
                            </div>
                            <div className="contact-item">
                                <Mail size={20} className="text-sky-400" />
                                <span>manishcpatil9@gmail.com</span>
                            </div>
                        </div>

                        <div className="resume-cta">
                            <a href="/Manish Patil.pdf" target="_blank" className="btn">
                                <ExternalLink size={18} /> View Resume
                            </a>
                            <a href="/Manish Patil.pdf" download className="btn-secondary">
                                <Download size={18} /> Download PDF
                            </a>
                        </div>
                    </div>

                    <div className="contact-form-container glass">
                        <form action="https://formsubmit.co/manishcpatil9@gmail.com" method="POST">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" required />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea name="message" rows={4} required></textarea>
                            </div>
                            <button type="submit" className="btn w-full">Send Message</button>
                        </form>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Manish Patil. Built with React & Vite.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
