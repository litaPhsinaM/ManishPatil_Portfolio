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
        body: `● Manage the lifecycle and inventory of approximately 3,500 devices, including asset tracking, workstation deployment, equipment recovery, and preparation for reuse across CISE programs and partner school sites.
        \n● Administer macOS and iOS endpoints through Jamf and Apple School Manager by troubleshooting devices, creating policies and configuration profiles, provisioning accounts, and preparing deployments for different educational programs.
        \n● Support Windows, macOS, WiFi, DNS, and VPN issues while coordinating with the campus security team on network access and wireless scheduling requirements.
        \n● Manage Google Workspace onboarding and offboarding, including account creation, access removal, file ownership transfers, workstation setup, and returning assigned equipment to inventory.
        \n● Developed a React and Node.js technology checkout platform with REST APIs, JWT authentication, and role based access control. The guided workflow recommends equipment and simplifies requests across five to six programs and departments.
        \n● Rebuilt the CISE website in CM1 to meet campus accessibility and compliance requirements, created pages for individual programs, and maintain five to six Fabrication Lab pages in WordPress.
        \n● Produce and edit photography and video content for CISE and partner school districts using Adobe creative tools. Mentored an undergraduate intern and supported three IT student assistants with technical projects and daily troubleshooting.`,
        skills: ['Jamf', 'Mobile Device Management', 'Apple School Manager', 'Google Workspace Admin', 'macOS', 'Windows', 'DNS', 'VPN', 'WiFi', 'React', 'Node.js', 'REST APIs', 'JWT', 'RBAC', 'WordPress', 'CM1', 'ADA Compliance', 'Asset Management', 'Adobe Premiere Pro', 'Adobe Illustrator'],
    },
    {
        number: '02',
        tag: 'CaspianLogic · May 2022 – October 2022',
        title: 'Software Developer Intern',
        company: 'CaspianLogic, Cupertino, CA',
        icon: '💻',
        body: `● Contributed primarily to frontend development for project based client applications using React and JavaScript. Translated business and interface requirements into responsive pages, reusable components, and interactive application workflows.
        \n● Built React components for forms, navigation, data presentation, and user interactions. Used Redux to manage shared application state and maintain predictable data flow between components.
        \n● Integrated frontend interfaces with REST APIs, handling asynchronous requests, JSON responses, form submissions, loading states, validation messages, and application errors.
        \n● Supported full stack development using Node.js, Express, and MongoDB. Assisted with API routes, request handling, database operations, and connecting backend services to React interfaces.
        \n● Tested and debugged application functionality across the frontend and backend, resolving layout problems, state management issues, API integration failures, and unexpected user input before client delivery.`,
        skills: ['React', 'Redux', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'HTML', 'CSS', 'Git', 'Responsive Web Development', 'Application Testing'],
    },
    {
        number: '03',
        tag: 'Yali Inc. · June 2019 – September 2019',
        title: 'Data Engineering Intern',
        company: 'Yali Inc. (Stealth Startup), Chennai, IN',
        icon: '📊',
        body: `● Developed Python web scraping workflows with Beautiful Soup to collect banking and financial information from online sources. Parsed HTML content, extracted relevant fields, and converted unstructured web data into consistent formats for further processing.
        \n● Used Python and Pandas to clean, transform, and standardize collected data. Addressed missing values, duplicate records, inconsistent field names, formatting differences, and incorrect data types before the information entered downstream pipelines.
        \n● Prepared and annotated banking datasets used to support machine learning model training. Applied consistent labels, categories, and formatting rules to improve the quality and usability of the training data.
        \n● Created reusable Python scripts for data ingestion and preprocessing, establishing a repeatable workflow for moving data from raw source files into structured and validated datasets.
        \n● Performed data quality checks throughout the pipeline, investigated unexpected outputs, and corrected extraction or transformation issues before delivering processed data for analysis and model development.`,
        skills: ['Python', 'Pandas', 'Beautiful Soup', 'Web Scraping', 'Data Annotation', 'Data Cleaning', 'Data Transformation', 'ETL Pipelines', 'ML Data Preparation'],
    },
];

// One always-sticky pin (never toggled between fixed/absolute — that toggling was the
// root cause of the original bug) holds a fixed-size viewport in place. All cards sit
// stacked exactly on top of each other (inset:0) inside it; a single scroll listener
// picks one discrete "active" index out of the 3, and only that card is opacity:1 +
// pointer-events:auto. A plain CSS transition crossfades between whichever two cards
// change state. There is no per-frame multi-value math and no z-index competition —
// the two failure modes from earlier attempts — so this can't reintroduce that bug.
// Scroll distance each card holds the pin for, so it also sets how often the
// crossfade fires. Raised from 100 to 140 to match the slower 1.25s transition in
// Experience.css: at 100vh a normal trackpad flick could cross a boundary before
// the previous fade had finished, stacking one transition on top of the next and
// reading as a stutter rather than a glide. More runway per card also means fewer
// switches over the same gesture, which is most of the "slow motion" feel.
const DWELL_VH_PER_CARD = 140;

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
                                💼 Professional Experience - Task Manager
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
                                        {exp.icon} {exp.title} - {exp.company}
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
