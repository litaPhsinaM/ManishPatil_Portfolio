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
        tag: 'CISE - CSUDH, Carson, CA · February 2024 - Present',
        title: 'IT Specialist',
        company: 'CISE - California State University, Dominguez Hills',
        icon: '🖥️',
        body: `IT Infrastructure & Systems Administration: Manage end-to-end IT operations for 4,000-5,000+ macOS devices, with Windows support. Oversee provisioning, lifecycle management, onboarding/offboarding, DNS, VPN, WiFi, and Google Workspace Admin. JAMF-certified, leading MDM deployment, policy enforcement, and security compliance.
        \n● Web & Digital Systems Management: Maintain large-scale departmental websites (CM1, WordPress), ensuring ADA compliance, performance optimization, and consistent branding.
        \n● Full-Stack Development (Internal Tools): Build a custom IT ticketing and asset/inventory system using React, Node.js/Express, and PostgreSQL, with secure REST APIs, JWT auth, RBAC, audit logs, and automated workflows.
        \n● IT Operations & Process Optimization: Lead event IT setup, infrastructure readiness, and support workflows for device tracking, onboarding/offboarding, and helpdesk operations.
        \n● Media Production & Technical Leadership: Produce photo/video content using Adobe Premiere Pro, Photoshop, and Illustrator. Lead and mentor IT student staff across daily technical operations.`,
        skills: ['JAMF', 'Google Workspace Admin', 'React 19', 'Node.js', 'PostgreSQL', 'REST APIs', 'JWT/RBAC', 'CM1', 'WordPress', 'ADA Compliance', 'Asset Management', 'Helpdesk Systems', 'Adobe Photoshop', 'Adobe Premiere Pro', 'AV Support'],
    },
    {
        number: '02',
        tag: 'CaspianLogic · May 2022 – October 2022',
        title: 'Software Developer Intern',
        company: 'CaspianLogic — Cupertino, CA',
        icon: '💻',
        body: `Contributed to project-based turnkey software solutions for business process re-engineering and information technology clients.
        \n● MERN Stack Development: Built and maintained production-grade web application features using React, Redux, Node.js, Express, MongoDB, and RESTful services.
        \n● Frontend Engineering: Developed responsive, reusable UI components, connected client-side state with Redux, and implemented form-driven workflows aligned with client requirements.
        \n● Backend & API Integration: Supported Express API development, MongoDB data modeling, endpoint integration, validation, and debugging across full-stack application flows.
        \n● QA & Delivery: Strengthened testing procedures, production readiness, and troubleshooting practices while training in modern web development methodologies.`,
        skills: ['MERN Stack', 'React', 'Redux', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript', 'Responsive UI', 'API Integration', 'Testing', 'Production Web Apps'],
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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const panelsRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const updateExperience = () => {
            rafRef.current = null;

            const section = sectionRef.current;
            const wrapper = wrapperRef.current;
            const panels = panelsRef.current;
            const fill = fillRef.current;
            if (!section || !wrapper || !panels) return;

            if (window.innerWidth <= 760) {
                wrapper.style.transform = '';
                wrapper.classList.remove('is-fixed', 'is-ended');
                if (fill) fill.style.width = '0%';
                return;
            }

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const viewportH = window.innerHeight;
            const scrolled = window.scrollY;
            const scrollRange = sectionHeight - viewportH;
            const sectionEnd = sectionTop + scrollRange;

            wrapper.style.transform = '';
            wrapper.classList.toggle('is-fixed', scrolled >= sectionTop && scrolled < sectionEnd);
            wrapper.classList.toggle('is-ended', scrolled >= sectionEnd);

            const progress = scrollRange > 0 ? (scrolled - sectionTop) / scrollRange : 0;
            const clamped = Math.max(0, Math.min(1, progress));
            const cardReleasePoint = 0.72;
            const cardProgress = Math.min(1, clamped / cardReleasePoint);
            const panelProgress = cardProgress * (experiences.length - 1);
            const activeIndex = Math.min(Math.floor(panelProgress), experiences.length - 1);
            const localProgress = panelProgress - activeIndex;

            if (fill) fill.style.width = `${clamped * 100}%`;

            const allPanels = panels.querySelectorAll<HTMLElement>('.exp-panel');
            allPanels.forEach((panel, i) => {
                panel.classList.remove('active', 'past', 'upcoming');
                let y = 76;
                let opacity = 0;
                let scale = 0.965;
                let blur = 2.5;
                let z = 1;

                if (i < activeIndex) {
                    y = -92;
                    opacity = 0;
                    z = 1;
                    panel.classList.add('past');
                } else if (i === activeIndex) {
                    y = 0;
                    opacity = 1;
                    scale = 1;
                    blur = 0;
                    z = 30;
                    panel.classList.add('active');
                } else if (i === activeIndex + 1) {
                    y = 70 - localProgress * 34;
                    opacity = 0.12 + localProgress * 0.22;
                    scale = 0.97 + localProgress * 0.03;
                    blur = 2.5 - localProgress * 2.5;
                    z = 20;
                    panel.classList.add('upcoming');
                }

                panel.style.setProperty('--stack-y', `${y}px`);
                panel.style.setProperty('--stack-opacity', `${opacity}`);
                panel.style.setProperty('--stack-scale', `${scale}`);
                panel.style.setProperty('--stack-blur', `${blur}px`);
                panel.style.setProperty('--stack-z', `${z}`);
            });
        };

        const handleScroll = () => {
            if (rafRef.current !== null) return;
            rafRef.current = window.requestAnimationFrame(updateExperience);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        updateExperience();
        return () => {
            if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    return (
        <section
            id="experience"
            className="experience-section"
            ref={sectionRef}
            style={{ height: `${experiences.length * 104}vh` }}
        >
            <div className="exp-sticky-wrapper" ref={wrapperRef}>
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
