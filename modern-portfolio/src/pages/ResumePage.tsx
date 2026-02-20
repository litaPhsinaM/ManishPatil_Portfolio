import React from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';
import '../styles/ResumePage.css';

const ResumePage: React.FC = () => {
    return (
        <section className="resume-page">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title">Professional Resume <span>.</span></h2>
                    <p className="section-subtitle">A detailed look at my technical expertise and experience.</p>
                </motion.div>

                <div className="resume-actions-top">
                    <a href={`${import.meta.env.BASE_URL}Manish Patil.pdf`} target="_blank" className="btn">
                        <ExternalLink size={18} /> Open in New Tab
                    </a>
                    <a href={`${import.meta.env.BASE_URL}Manish Patil.pdf`} download className="btn-secondary">
                        <Download size={18} /> Download PDF
                    </a>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="resume-viewer glass"
                >
                    <iframe
                        src={`${import.meta.env.BASE_URL}Manish Patil.pdf`}
                        width="100%"
                        height="1000px"
                        title="Manish Patil Resume"
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default ResumePage;
