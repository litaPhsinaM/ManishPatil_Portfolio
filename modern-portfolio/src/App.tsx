import { useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Win98Boot from './components/Win98Boot';
import './styles/App.css';

// A reload deep-linked into a section should land back on the desktop. This only
// applies to the entry route: `navigation.type` stays 'reload' for the whole page
// lifetime, so re-checking it on every route change would bounce every later
// in-app navigation (Resume, etc.) back to '/'.
const ReloadHomeGuard = () => {
  const navigate = useNavigate();
  const entryPathname = useLocation().pathname;
  const entryPathnameRef = useRef(entryPathname);

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === 'reload' && entryPathnameRef.current !== '/') {
      navigate('/', { replace: true });
      window.scrollTo({ top: 0 });
    }
  }, [navigate]);

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
              <Route path="/signals" element={<Home />} />
              {/* A real second page, not a section of Home. */}
              <Route path="/interview" element={<Interview />} />
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
