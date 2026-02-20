import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Github, Linkedin } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Projects', href: '/projects' },
        { name: 'Resume', href: '/resume' },
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <NavLink to="/" className="logo">
                    manish<span>_</span>patil<span>.py</span>
                </NavLink>

                <div className="nav-links">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.href}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                <div className="nav-socials">
                    <a href="https://github.com/litaPhsinaM" target="_blank" rel="noreferrer" className="nav-link">
                        <Github size={18} />
                    </a>
                    <a href="https://www.linkedin.com/in/manish-patil-b50967182/" target="_blank" rel="noreferrer" className="nav-link">
                        <Linkedin size={18} />
                    </a>
                </div>

                <button className="md-hidden" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }}>
                    <Menu size={24} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
