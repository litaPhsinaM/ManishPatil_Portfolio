import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Win98Boot from './components/Win98Boot';
import './styles/App.css';

const ReloadHomeGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === 'reload' && location.pathname !== '/') {
      navigate('/', { replace: true });
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, navigate]);

  return null;
};

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <ReloadHomeGuard />
        <Win98Boot />
        <div className="parallax-wrapper">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<Home />} />
              <Route path="/interests" element={<Home />} />
              <Route path="/life-outside" element={<Home />} />
              <Route path="/experience" element={<Home />} />
              <Route path="/projects" element={<Home />} />
              <Route path="/gallery" element={<Home />} />
              <Route path="/footer" element={<Home />} />
              <Route path="/resume" element={<Home />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
        </div>
      </Router>
    </MotionConfig>
  );
}

export default App;
