import React, { useEffect, useRef } from 'react';
import '../styles/Experience.css';

interface ExperienceEntry {
    number: string;
    tag: string;
    title: string;
    company: string;
    body: string;
    skills: string[];
    icon: string;
}

const experiences: ExperienceEntry[] = [
    {
        number: '01',
        tag: 'CISE, CSUDH · February 2024 – Present',
        title: 'IT Specialist',
        company: 'California State University, Dominguez Hills',
        icon: '🖥️',
        body: `Manage IT operations for 4,000+ macOS devices, including provisioning, lifecycle management, JAMF MDM, and Google Workspace administration.
        \n● Maintain and optimize departmental websites (CM1, WordPress), ensuring ADA compliance, performance, and consistent branding.
        \n● Develop a full-stack IT ticketing and asset management system (React, Node.js, PostgreSQL) with secure APIs and workflow automation.
        \n● Lead event IT setup and streamline processes for onboarding/offboarding, device tracking, and helpdesk efficiency.
        \n● Lead and mentor an IT support team, driving service quality, training staff, and overseeing daily technical support and media production (Adobe Premiere Pro, Photoshop, Illustrator).`,
        skills: ['JAMF', 'Google Workspace Admin', 'React 19', 'Node.js', 'PostgreSQL', 'REST APIs', 'JWT/RBAC', 'CM1', 'WordPress', 'ADA Compliance', 'Asset Management', 'Helpdesk Systems', 'Adobe Photoshop', 'Adobe Premiere Pro', 'AV Support'],
    },
    {
        number: '02',
        tag: 'CaspianLogic · May 2022 – October 2022',
        title: 'Software Developer Intern',
        company: 'CaspianLogic — Cupertino, CA',
        icon: '💻',
        body: `Developed production-ready full-stack web applications for a consulting firm using the MERN stack.
        \n● Frontend Development: Built highly responsive and interactive user interfaces using React and modern CSS practices.
        \n● Backend & API: Implemented secure RESTful APIs with Node.js and Express, managing data persistence via MongoDB.
        \n● QA & Performance: Conducted rigorous application testing and performance debugging to ensure 99.9% production uptime.`,
        skills: ['MERN Stack', 'React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Unit Testing', 'Application Security'],
    },
    {
        number: '03',
        tag: 'Yali Inc. · June 2019 – September 2019',
        title: 'Data Engineering Intern',
        company: 'Yali Inc. (Stealth Startup) — Chennai, IN',
        icon: '📊',
        body: `Engineered scalable data ingestion and processing pipelines for startup-scale data challenges.
        \n● ETL Automation: Developed automated workflows using Python and Apache Airflow to handle multi-source data ingestion.
        \n● Big Data: Utilized PySpark and Pandas for large-scale data cleaning, transformation, and quality assurance.
        \n● Database Optimization: Managed PostgreSQL and MongoDB instances, implementing advanced indexing for high-speed query performance.
        \n● Web Extraction: Built Selenium and BeautifulSoup scrapers to extract critical market intelligence data.`,
        skills: ['Python', 'Apache Airflow', 'PySpark', 'Pandas', 'PostgreSQL', 'MongoDB', 'BeautifulSoup', 'Selenium'],
    },
];

const Experience: React.FC = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const panelsRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const section = sectionRef.current;
            const panels = panelsRef.current;
            const fill = fillRef.current;
            if (!section || !panels) return;

            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = section.offsetHeight;
            const viewportH = window.innerHeight;
            const scrolled = window.scrollY;

            // Use a slightly larger scroll range to ensure transitions finish
            const progress = (scrolled - sectionTop) / (sectionHeight - viewportH);
            const clamped = Math.max(0, Math.min(1, progress));
            const panelProgress = clamped * experiences.length;
            const activeIndex = Math.min(Math.floor(panelProgress), experiences.length - 1);

            if (fill) fill.style.width = `${clamped * 100}%`;

            const allPanels = panels.querySelectorAll<HTMLElement>('.exp-panel');
            allPanels.forEach((panel, i) => {
                panel.classList.remove('active', 'past', 'upcoming');
                if (i < activeIndex) panel.classList.add('past');
                else if (i === activeIndex) panel.classList.add('active');
                else if (i === activeIndex + 1) panel.classList.add('upcoming');
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section
            id="experience"
            className="experience-section"
            ref={sectionRef}
            style={{ height: `${experiences.length * 80}vh` }}
        >
            <div className="exp-sticky-wrapper">
                {/* Header Window */}
                <div className="window exp-header-win">
                    <div className="title-bar">
                        <div className="title-bar-text">
                            💼 Professional Experience — Task Manager
                        </div>
                        <div className="title-bar-controls">
                            <button aria-label="Help" />
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    {/* Authentic Win98 Navigation */}
                    <div className="win98-menubar">
                        <span>File</span>
                        <span>Edit</span>
                        <span>View</span>
                        <span>Go</span>
                        <span>Favorites</span>
                        <span>Help</span>
                    </div>

                    <div className="win98-toolbar">
                        <button className="win98-toolbar-btn">
                            <span className="icon">⬅️</span>
                            <span>Back</span>
                        </button>
                        <button className="win98-toolbar-btn">
                            <span className="icon">➡️</span>
                            <span>Forward</span>
                        </button>
                        <button className="win98-toolbar-btn">
                            <span className="icon">⬆️</span>
                            <span>Up</span>
                        </button>

                        <div className="win98-toolbar-divider"></div>

                        <button className="win98-toolbar-btn">
                            <span className="icon">✂️</span>
                            <span>Cut</span>
                        </button>
                        <button className="win98-toolbar-btn">
                            <span className="icon">📋</span>
                            <span>Copy</span>
                        </button>
                        <button className="win98-toolbar-btn">
                            <span className="icon">📋</span>
                            <span>Paste</span>
                        </button>

                        <div className="win98-toolbar-divider"></div>

                        <button className="win98-toolbar-btn">
                            <span className="icon">↩️</span>
                            <span>Undo</span>
                        </button>
                        <button className="win98-toolbar-btn">
                            <span className="icon">❌</span>
                            <span>Delete</span>
                        </button>
                    </div>

                    <div className="win98-address-bar">
                        <span className="win98-address-label">Address</span>
                        <div className="win98-address-input-container">
                            <span className="win98-address-icon">📁</span>
                            <input type="text" className="win98-address-input" value="C:\Experience" readOnly />
                            <button className="win98-address-dropdown-btn">▼</button>
                        </div>
                    </div>

                    <div className="exp-header-body">
                        <span className="exp-header-label">Scroll to navigate experience</span>
                        <div className="exp-progress-track">
                            <div className="exp-progress-fill" ref={fillRef} />
                        </div>
                    </div>
                </div>

                {/* Stacked panels */}
                <div className="exp-panels" ref={panelsRef}>
                    {experiences.map((exp, i) => (
                        <div
                            key={exp.number}
                            className={`exp-panel window ${i === 0 ? 'active' : ''}`}
                            data-index={i}
                        >
                            <div className="title-bar">
                                <div className="title-bar-text">
                                    {exp.icon} {exp.title} — {exp.company}
                                </div>
                                <div className="title-bar-controls">
                                    <button aria-label="Help" />
                                    <button aria-label="Minimize" />
                                    <button aria-label="Maximize" />
                                    <button aria-label="Close" />
                                </div>
                            </div>

                            {/* Explorer-style toolbar */}
                            <div className="exp-toolbar">
                                <span className="explorer-btn">📅 {exp.tag}</span>
                            </div>

                            <div className="window-body exp-panel-body">
                                <div className="exp-number-badge">{exp.number}</div>
                                <h2 className="exp-title">{exp.title}</h2>
                                <p className="exp-company">{exp.company}</p>
                                <p className="exp-body-text">{exp.body}</p>
                                <div className="exp-skills">
                                    {exp.skills.map(s => (
                                        <span key={s} className="tag">{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Status bar */}
                            <div className="win98-statusbar">
                                <div className="win98-panel">{exp.tag.split('·')[1]?.trim() ?? exp.tag}</div>
                                <div className="win98-panel" style={{ flex: 1 }}>{exp.company}</div>
                                <div className="win98-panel">Entry {exp.number} of 0{experiences.length}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
