import React from 'react';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { projects } from '../data/portfolio';
import '../styles/Projects.css';

const Projects: React.FC = () => {
    return (
        <section id="projects" className="projects-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title">Selected Projects</h2>
                    <p className="section-subtitle">A deep dive into data engineering, deep learning, and robust software systems.</p>
                </motion.div>

                {["Systems & Infrastructure", "AI & Deep Learning", "Data Science & Analytics", "Software Engineering"].map((category) => (
                    <div key={category} className="project-category-section">
                        <div className="category-header">
                            <span className="comment">// Category:</span>
                            <h3 className="category-title">{category.replace(/ /g, '_').toLowerCase()}<span>()</span></h3>
                        </div>
                        <div className="projects-grid">
                            {projects
                                .filter(p => p.category === category)
                                .map((project, index) => (
                                    <motion.article
                                        key={project.title}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="project-card glass"
                                    >
                                        <div className="project-image">
                                            <img src={project.image} alt={project.title} loading="lazy" />
                                        </div>
                                        <div className="project-content">
                                            <div className="project-tags">
                                                {project.tags.map(tag => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                            <h3>{project.title}</h3>
                                            <p>{project.description}</p>
                                            <div className="project-links">
                                                <a href={project.link} target="_blank" rel="noreferrer" className="project-link">
                                                    <Github size={18} /> Source Code
                                                </a>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;
