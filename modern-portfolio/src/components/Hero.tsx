import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import '../styles/Hero.css';

const Hero: React.FC = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="hero">
            <motion.div className="hero-content" style={{ y: y1, opacity }}>
                <h1 className="hero-title">
                    Manish Patil<span>_</span>
                </h1>
                <p className="hero-subtitle">[root@portfolio ~]# sys_admin --expertise</p>
                <p className="hero-description">
                    Master's in Computer Science • CSUDH
                    <br />
                    Specializing in IT Infrastructure, Systems Management, and Robust Software Solutions.
                </p>
                <div className="hero-actions">
                    <a href="#projects" className="btn">Explore Work</a>
                    <a href="#about" className="btn-secondary">About Me</a>
                </div>
            </motion.div>

            {/* Decorative Parallax Elements */}
            <motion.div className="hero-blob blob-1" style={{ y: y2 }} />
            <motion.div className="hero-blob blob-2" style={{ y: y1 }} />
        </section>
    );
};

export default Hero;
