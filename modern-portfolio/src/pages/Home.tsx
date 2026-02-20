import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Gallery from '../components/Gallery';

const Home: React.FC = () => {
    return (
        <>
            <Hero />
            <About />
            <Gallery />
        </>
    );
};

export default Home;
