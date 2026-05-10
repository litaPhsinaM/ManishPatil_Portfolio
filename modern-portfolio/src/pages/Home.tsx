import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import About from '../components/About';
import Interests from '../components/Interests';
import Experience from '../components/Experience';
import Projects from '../components/Projects';
import Games from '../components/Games';
import Footer from '../components/Footer';

const Home: React.FC = () => {
    const [isGameOpen, setIsGameOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const routeSections: Record<string, string> = {
            '/about': 'about',
            '/interests': 'life-outside',
            '/life-outside': 'life-outside',
            '/gallery': 'life-outside',
            '/experience': 'experience',
            '/projects': 'projects',
            '/footer': 'footer',
            '/resume': 'footer',
        };

        const sectionId = routeSections[location.pathname];
        if (!sectionId) {
            return;
        }

        window.setTimeout(() => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
    }, [location.pathname]);

    return (
        <div className="home-page">
            <Hero onOpenGame={() => setIsGameOpen(true)} />
            <div className="section-separator" />
            <About />
            <div className="section-separator" />
            <Interests />
            <div className="section-separator" />
            <Experience />
            <div className="section-separator" />
            <Projects />
            <div className="section-separator" />
            <Footer />

            {/* Floating popups outside normal document flow */}
            <AnimatePresence>
                {isGameOpen && (
                    <Games onClose={() => setIsGameOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
