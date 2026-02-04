import React, { useState, useEffect } from 'react';
import { FolderOpen, BarChart3, Zap, TrendingUp, Lightbulb } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [stats, setStats] = useState({ models: 0, datasets: 0 });
  
  // Update stats from localStorage
  useEffect(() => {
    const updateStats = () => {
      const uploadResult = localStorage.getItem('uploadResult');
      const trainingResult = localStorage.getItem('trainingResult');
      
      setStats({
        datasets: uploadResult ? 1 : 0,
        models: trainingResult ? 1 : 0
      });
    };
    
    updateStats();
    // Listen for storage changes
    window.addEventListener('storage', updateStats);
    return () => window.removeEventListener('storage', updateStats);
  }, []);
  
  const isActive = (path) => {
    return location.pathname === path || (path === '/upload' && location.pathname === '/');
  };

  const getPageTitle = () => {
    if (isActive('/upload')) return 'Data Upload';
    if (isActive('/dashboard')) return 'Analytics Dashboard';
    if (isActive('/predict')) return 'Model Predictions';
    return 'AutoML Platform';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>{getPageTitle()}</h3>
        <p className="page-description">
          {isActive('/upload') && 'Upload and analyze your datasets'}
          {isActive('/dashboard') && 'Explore data insights and model performance'}
          {isActive('/predict') && 'Make predictions with trained models'}
        </p>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/upload" 
          className={`sidebar-link ${isActive('/upload') ? 'active' : ''}`}
          title="Upload CSV files for analysis"
        >
          <span className="nav-icon"><FolderOpen size={20} /></span>
          <span className="nav-text">Upload Dataset</span>
          {isActive('/upload') && <span className="active-indicator"></span>}
        </Link>
        
        <Link 
          to="/dashboard" 
          className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
          title="View analytics and model results"
        >
          <span className="nav-icon"><BarChart3 size={20} /></span>
          <span className="nav-text">Dashboard</span>
          {isActive('/dashboard') && <span className="active-indicator"></span>}
        </Link>
        
        <Link 
          to="/predict" 
          className={`sidebar-link ${isActive('/predict') ? 'active' : ''}`}
          title="Make predictions with your models"
        >
          <span className="nav-icon"><Zap size={20} /></span>
          <span className="nav-text">Predictions</span>
          {isActive('/predict') && <span className="active-indicator"></span>}
        </Link>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-stats">
          <h4><TrendingUp size={16} /> Quick Stats</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.datasets}</span>
              <span className="stat-label">Datasets</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.models}</span>
              <span className="stat-label">Models</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-help">
          <p className="help-text">
            <Lightbulb size={16} /> <strong>Tip:</strong> Upload a CSV file to get started with automated ML
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;