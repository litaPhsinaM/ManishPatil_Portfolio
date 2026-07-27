import React, { useEffect, useRef, useState } from 'react';
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

// One always-sticky pin (never toggled between fixed/absolute — that toggling was the
// root cause of the original bug) holds a fixed-size viewport in place. All cards sit
// stacked exactly on top of each other (inset:0) inside it; a single scroll listener
// picks one discrete "active" index out of the 3, and only that card is opacity:1 +
// pointer-events:auto. A plain CSS transition crossfades between whichever two cards
// change state. There is no per-frame multi-value math and no z-index competition —
// the two failure modes from earlier attempts — so this can't reintroduce that bug.
const DWELL_VH_PER_CARD = 70;

const Experience: React.FC = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isNarrow, setIsNarrow] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const widthQuery = window.matchMedia('(max-width: 900px)');
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateWidth = () => setIsNarrow(widthQuery.matches);
        const updateMotion = () => setReduceMotion(motionQuery.matches);
        updateWidth();
        updateMotion();
        widthQuery.addEventListener('change', updateWidth);
        motionQuery.addEventListener('change', updateMotion);
        return () => {
            widthQuery.removeEventListener('change', updateWidth);
            motionQuery.removeEventListener('change', updateMotion);
        };
    }, []);

    useEffect(() => {
        if (isNarrow || reduceMotion) return;

        const update = () => {
            rafRef.current = null;
            const section = sectionRef.current;
            if (!section) return;

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const viewportH = window.innerHeight;
            const scrollRange = sectionHeight - viewportH;
            const scrolled = window.scrollY;

            const progress = scrollRange > 0 ? (scrolled - sectionTop) / scrollRange : 0;
            const clamped = Math.max(0, Math.min(1, progress));

            if (fillRef.current) fillRef.current.style.width = `${clamped * 100}%`;

            const index = Math.min(Math.floor(clamped * experiences.length), experiences.length - 1);
            setActiveIndex(index);
        };

        const handleScroll = () => {
            if (rafRef.current !== null) return;
            rafRef.current = window.requestAnimationFrame(update);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        update();

        return () => {
            if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isNarrow, reduceMotion]);

    const pinned = !isNarrow && !reduceMotion;

    return (
        <section
            id="experience"
            className="experience-section"
            ref={sectionRef}
            style={pinned ? { height: `${experiences.length * DWELL_VH_PER_CARD}vh` } : undefined}
        >
            <div className={`exp-pin ${pinned ? 'is-pinned' : ''}`}>
                <div className="container">
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

                        <div className="exp-header-body">
                            <span className="exp-header-label">
                                {pinned ? 'Scroll to cycle through each role' : 'Professional Experience'}
                            </span>
                            {pinned && (
                                <div className="exp-progress-track">
                                    <div className="exp-progress-fill" ref={fillRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="exp-stack">
                        {experiences.map((exp, i) => (
                            <div
                                key={exp.number}
                                className={`exp-panel window ${!pinned || i === activeIndex ? 'active' : ''}`}
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

                                <div className="win98-statusbar">
                                    <div className="win98-panel">{exp.tag.split('·')[1]?.trim() ?? exp.tag}</div>
                                    <div className="win98-panel" style={{ flex: 1 }}>{exp.company}</div>
                                    <div className="win98-panel">Entry {exp.number} of 0{experiences.length}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Experience;
