import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeroPage from './pages/HeroPage';
import ProjectsPage from './pages/ProjectsPage';
import ProcessedPage from './pages/ProcessedPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/processed/:id" element={<ProcessedPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;