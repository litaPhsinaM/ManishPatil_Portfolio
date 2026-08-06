import React, { useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { BarChart3, Code2, Github } from 'lucide-react';
import { projects, type Project } from '../data/portfolio';
import '../styles/Projects.css';

type ProjectTab = {
    id: 'data' | 'software';
    label: string;
    title: string;
    path: string;
    icon: React.ComponentType<{ size?: number }>;
    filter: (project: Project) => boolean;
};

const projectTabs: ProjectTab[] = [
    {
        id: 'data',
        label: 'Data',
        title: 'Data Projects',
        path: 'Data',
        icon: BarChart3,
        filter: (project) => project.category !== 'Software Engineering',
    },
    {
        id: 'software',
        label: 'Software',
        title: 'Software Projects',
        path: 'Software',
        icon: Code2,
        filter: (project) => project.category === 'Software Engineering',
    },
];

const winVariant: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
    }),
};

const Projects: React.FC = () => {
    const [activeTabId, setActiveTabId] = useState<ProjectTab['id']>('data');
    const activeTab = projectTabs.find(tab => tab.id === activeTabId) ?? projectTabs[0];
    const activeProjects = useMemo(
        () => projects.filter(activeTab.filter),
        [activeTab]
    );
    const ActiveIcon = activeTab.icon;

    return (
        <section id="projects" className="projects-section">
            <div className="container">
                <motion.div
                    className="window project-category-win"
                    custom={0}
                    variants={winVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text project-window-title">
                            <ActiveIcon size={13} /> {activeTab.title} - Windows Explorer
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

                    <div className="project-tabs" role="tablist" aria-label="Project categories">
                        {projectTabs.map(tab => {
                            const TabIcon = tab.icon;
                            const isActive = tab.id === activeTabId;

                            return (
                                <button
                                    key={tab.id}
                                    id={`project-tab-${tab.id}`}
                                    className={`project-tab ${isActive ? 'active' : ''}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls="project-tab-panel"
                                    onClick={() => setActiveTabId(tab.id)}
                                >
                                    <TabIcon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="win98-address-bar">
                        <span className="win98-address-label">Address</span>
                        <div className="win98-address-input-container">
                            <span className="win98-address-icon">📁</span>
                            <input type="text" className="win98-address-input" value={`C:\\Projects\\${activeTab.path}`} readOnly />
                            <button className="win98-address-dropdown-btn">▼</button>
                        </div>
                    </div>

                    <div
                        className="window-body category-body"
                        id="project-tab-panel"
                        role="tabpanel"
                        aria-labelledby={`project-tab-${activeTab.id}`}
                    >
                        <div className="projects-grid">
                            {activeProjects.map((project, idx) => (
                                <motion.article
                                    key={`${activeTab.id}-${project.title}`}
                                    className="window project-card-win"
                                    initial={{ opacity: 0, scale: 0.93 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                >
                                    <div className="title-bar">
                                        <div className="title-bar-text">📄 {project.title}</div>
                                        <div className="title-bar-controls">
                                            <button aria-label="Help" />
                                            <button aria-label="Minimize" />
                                            <button aria-label="Maximize" />
                                            <button aria-label="Close" />
                                        </div>
                                    </div>

                                    <div className="window-body project-card-body">
                                        <div className="project-img-frame">
                                            <img
                                                src={`${import.meta.env.BASE_URL}${project.image}`}
                                                alt={project.title}
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <p className="project-desc">{project.description}</p>
                                        <div className="project-tags">
                                            {project.tags.map(tag => (
                                                <span key={tag} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="win98-statusbar project-statusbar">
                                        <div className="win98-panel" style={{ flex: 1 }}>
                                            {project.tags[0]}
                                        </div>
                                        {!project.link ? (
                                            <span className="btn project-github-btn disabled-link">
                                                Coming Soon
                                            </span>
                                        ) : (
                                            <a
                                                href={project.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn project-github-btn"
                                            >
                                                <Github size={12} /> Source
                                            </a>
                                        )}
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>

                    <div className="win98-statusbar">
                        <div className="win98-panel">
                            {activeProjects.length} object(s)
                        </div>
                        <div className="win98-panel" style={{ flex: 1 }}>
                            {activeTab.label}
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default Projects;
