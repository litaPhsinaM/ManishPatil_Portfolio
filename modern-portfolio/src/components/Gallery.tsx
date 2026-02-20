import React from 'react';
import { motion } from 'framer-motion';
import { photos } from '../data/portfolio';
import '../styles/Gallery.css';

const Gallery: React.FC = () => {
    return (
        <section id="photography" className="gallery-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title">Photography <span>.</span></h2>
                    <p className="section-subtitle">Capturing the world through my lens.</p>
                </motion.div>

                <div className="gallery-grid">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.url}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="gallery-item glass"
                        >
                            <img src={photo.url} alt={photo.caption} loading="lazy" />
                            <div className="gallery-overlay">
                                <p>{photo.caption}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="gallery-footer">
                    <a href="https://500px.com/p/ManishPatil1" target="_blank" rel="noreferrer" className="btn-secondary">
                        View More on 500px
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Gallery;
