import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import NewSidebar from './components/NewSidebar';
import NewUploadPage from './pages/NewUploadPage';
import EnhancedDashboard from './pages/EnhancedDashboard';
import PredictionPage from './pages/PredictionPage';
import ReportPage from './pages/ReportPage';
import TrainPage from './pages/TrainPage';
import EnhancedPowerBIPage from './pages/EnhancedPowerBIPage';
import DataPreprocessingPage from './pages/DataPreprocessingPage';

function App() {
  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {/* Enterprise Navigation Bar */}
        <Navbar />
        
        <div style={{
          display: 'flex',
          minHeight: 'calc(100vh - 70px)'
        }}>
          {/* Enterprise Sidebar */}
          <NewSidebar />
          
          {/* Main Content Area */}
          <main style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#F8FAFC'
          }}>
            <Routes>
              <Route path="/" element={<NewUploadPage />} />
              <Route path="/upload" element={<NewUploadPage />} />
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/preprocess" element={<DataPreprocessingPage />} />
              <Route path="/train" element={<TrainPage />} />
              <Route path="/predict" element={<PredictionPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/powerbi" element={<EnhancedPowerBIPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;