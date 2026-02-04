import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import realTimeService from '../services/realtime';
import PowerBIVisualizer from '../components/PowerBIVisualizer';
import ModelMetrics from '../components/ModelMetrics';
import FeatureImportance from '../components/FeatureImportance';
import InsightCards from '../components/InsightCards';
import { Icon, ICON_SIZES } from '../constants/icons';
import { FolderOpen, Upload, TrendingUp, Target, BarChart3, Brain, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [datasetMetadata, setDatasetMetadata] = useState(null);
  const [datasetPreview, setDatasetPreview] = useState(null);
  const [trainingResults, setTrainingResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [realTimeStats, setRealTimeStats] = useState({
    total_datasets: 0,
    total_models: 0,
    total_predictions: 0,
    active_training: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  // Load available datasets on component mount
  useEffect(() => {
    loadAvailableDatasets();
    
    // Connect to real-time service
    realTimeService.connect();
    
    // Subscribe to real-time updates
    realTimeService.subscribe('stats', (stats) => {
      setRealTimeStats(stats);
      setIsConnected(true);
    });
    
    // Request initial stats
    setTimeout(() => {
      realTimeService.requestStats();
    }, 1000);
    
    // Set up periodic stats refresh
    const statsInterval = setInterval(() => {
      realTimeService.requestStats();
    }, 5000);
    
    return () => {
      clearInterval(statsInterval);
      realTimeService.disconnect();
    };
  }, []);

  // Load available datasets from localStorage
  const loadAvailableDatasets = () => {
    const uploadResult = localStorage.getItem('uploadResult');
    const trainingResult = localStorage.getItem('trainingResult');
    
    if (uploadResult) {
      const parsed = JSON.parse(uploadResult);
      setAvailableDatasets([parsed.filename]);
      setSelectedDataset(parsed.filename);
      setDatasetMetadata(parsed);
    }
    
    if (trainingResult) {
      const parsedTraining = JSON.parse(trainingResult);
      setTrainingResults(parsedTraining);
    }
  };

  // Load dataset preview for visualization
  const loadDatasetPreview = async (filename) => {
    if (!filename) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sampleData = generateSampleData(datasetMetadata);
      setDatasetPreview(sampleData);
    } catch (err) {
      setError('Failed to load dataset preview');
      console.error('Error loading dataset preview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample data for visualization
  const generateSampleData = (metadata) => {
    if (!metadata) return [];
    
    const { column_names, inferred_column_types, number_of_rows } = metadata;
    const sampleSize = Math.min(50, number_of_rows);
    const sampleData = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const row = {};
      
      column_names.forEach(column => {
        const columnType = inferred_column_types[column];
        
        if (columnType === 'numeric') {
          if (column.toLowerCase().includes('age')) {
            row[column] = Math.floor(Math.random() * 60) + 18;
          } else if (column.toLowerCase().includes('income')) {
            row[column] = Math.floor(Math.random() * 80000) + 30000;
          } else if (column.toLowerCase().includes('price')) {
            row[column] = Math.floor(Math.random() * 1000) + 10;
          } else {
            row[column] = Math.random() * 100;
          }
        } else {
          if (column.toLowerCase().includes('category')) {
            const categories = ['A', 'B', 'C', 'D'];
            row[column] = categories[Math.floor(Math.random() * categories.length)];
          } else if (column.toLowerCase().includes('status')) {
            const statuses = ['Active', 'Inactive', 'Pending'];
            row[column] = statuses[Math.floor(Math.random() * statuses.length)];
          } else {
            const values = ['Option1', 'Option2', 'Option3', 'Option4', 'Option5'];
            row[column] = values[Math.floor(Math.random() * values.length)];
          }
        }
      });
      
      sampleData.push(row);
    }
    
    return sampleData;
  };

  // Train model
  const handleTrainModel = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.trainModel(selectedDataset);
      setTrainingResults(result);
      localStorage.setItem('trainingResult', JSON.stringify(result));
      setActiveSection('model');
      
      // Trigger storage event for sidebar stats update
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setError(err.response?.data?.error || 'Training failed. Please try again.');
      console.error('Training error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load preview when dataset metadata is available
  useEffect(() => {
    if (datasetMetadata && selectedDataset) {
      loadDatasetPreview(selectedDataset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetMetadata, selectedDataset]);

  // No dataset uploaded state
  if (!datasetMetadata && !loading) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1><Icon name="ANALYTICS" size={ICON_SIZES.LARGE} style={{ marginRight: '12px' }} />Analytics Dashboard</h1>
          <p className="page-subtitle">Explore your data and model performance with automated insights</p>
        </div>
        
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon"><FolderOpen size={64} color="#6B7280" /></div>
            <h3>No Dataset Available</h3>
            <p>Upload a dataset to start exploring your data and training ML models</p>
            
            <div className="empty-state-actions">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/upload'}
              >
                <Upload size={16} style={{ marginRight: '8px' }} />
                Upload Dataset
              </button>
            </div>
            
            <div className="empty-state-help">
              <h4>What you can do here:</h4>
              <ul>
                <li><TrendingUp size={16} style={{ marginRight: '8px', display: 'inline' }} />View automatic data visualizations</li>
                <li><Brain size={16} style={{ marginRight: '8px', display: 'inline' }} />Train machine learning models</li>
                <li><Icon name="INFO" size={16} style={{ marginRight: '8px', display: 'inline' }} />Get AI-powered business insights</li>
                <li><Target size={16} style={{ marginRight: '8px', display: 'inline' }} />Analyze model performance metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1><Icon name="ANALYTICS" size={ICON_SIZES.LARGE} style={{ marginRight: '12px' }} />Analytics Dashboard</h1>
        <p className="page-subtitle">Explore your data and model performance with automated insights</p>
      </div>

      {/* Dataset Selection & Actions */}
      {availableDatasets.length > 0 && (
        <div className="dashboard-controls">
          <div className="dataset-info-bar">
            <div className="dataset-details">
              <span className="dataset-label">Dataset:</span>
              <span className="dataset-name">{selectedDataset}</span>
              <span className="dataset-stats">
                {datasetMetadata?.number_of_rows?.toLocaleString() || 'N/A'} rows, {datasetMetadata?.number_of_columns || 'N/A'} columns
              </span>
            </div>
            
            {!trainingResults && (
              <button 
                onClick={handleTrainModel}
                disabled={loading}
                className="btn btn-primary train-btn"
                title="Train an ML model on this dataset"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Training Model...
                  </>
                ) : (
                  <>
                    <Brain size={16} style={{ marginRight: '8px' }} />
                    Train ML Model
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <BarChart3 size={16} style={{ marginRight: '8px' }} />Data Overview
        </button>
        <button 
          className={`nav-tab ${activeSection === 'visualizations' ? 'active' : ''}`}
          onClick={() => setActiveSection('visualizations')}
        >
          <TrendingUp size={16} style={{ marginRight: '8px' }} />Visualizations
        </button>
        <button 
          className={`nav-tab ${activeSection === 'model' ? 'active' : ''}`}
          onClick={() => setActiveSection('model')}
          disabled={!trainingResults}
          title={!trainingResults ? 'Train a model first to view results' : 'View model performance and insights'}
        >
          <Target size={16} style={{ marginRight: '8px' }} />Model Results
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-icon"><AlertTriangle size={20} color="#EF4444" /></div>
          <div className="alert-content">
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h3>Processing Your Data</h3>
            <p>This may take a few moments...</p>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {!loading && (
        <>
          {/* Data Overview Section */}
          {activeSection === 'overview' && datasetMetadata && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2><BarChart3 size={24} style={{ marginRight: '12px' }} />Dataset Overview</h2>
                <p>Key statistics and information about your dataset</p>
              </div>
              
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-header">
                    <h4><TrendingUp size={20} style={{ marginRight: '8px' }} />Dataset Statistics</h4>
                    <div className="real-time-indicator">
                      <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                      <span className="status-text">{isConnected ? 'Live' : 'Offline'}</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{datasetMetadata?.number_of_rows?.toLocaleString() || 'N/A'}</span>
                        <span className="stat-label">Total Rows</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{datasetMetadata.number_of_columns}</span>
                        <span className="stat-label">Total Columns</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">
                          {Object.values(datasetMetadata?.inferred_column_types || {}).filter(type => type === 'numeric').length}
                        </span>
                        <span className="stat-label">Numeric Features</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">
                          {Object.values(datasetMetadata?.inferred_column_types || {}).filter(type => type === 'categorical').length}
                        </span>
                        <span className="stat-label">Categorical Features</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h4><Icon name="ACTIVITY" size={20} style={{ marginRight: '8px' }} />Real-Time Platform Stats</h4>
                  </div>
                  <div className="card-content">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{realTimeStats.total_datasets}</span>
                        <span className="stat-label">Total Datasets</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{realTimeStats.total_models}</span>
                        <span className="stat-label">Trained Models</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{realTimeStats.total_predictions}</span>
                        <span className="stat-label">Predictions Made</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{realTimeStats.active_training}</span>
                        <span className="stat-label">Active Training</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualizations Section */}
          {activeSection === 'visualizations' && datasetMetadata && datasetPreview && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2><TrendingUp size={24} style={{ marginRight: '12px' }} />PowerBI-Style Visualizations</h2>
                <p>Create custom interactive charts with drag-and-drop controls</p>
              </div>
              
              <PowerBIVisualizer 
                datasetMetadata={datasetMetadata} 
                datasetPreview={datasetPreview} 
              />
            </div>
          )}

          {/* Model Results Section */}
          {activeSection === 'model' && (
            <>
              {trainingResults ? (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h2><Target size={24} style={{ marginRight: '12px' }} />Model Performance</h2>
                    <p>Results from your trained machine learning model</p>
                  </div>
                  
                  <div className="model-results-flow">
                    {/* Model Metrics */}
                    <div className="model-section">
                      <ModelMetrics trainingResults={trainingResults} />
                    </div>

                    {/* Feature Importance */}
                    <div className="model-section">
                      <FeatureImportance 
                        trainingResults={trainingResults} 
                        datasetMetadata={datasetMetadata} 
                      />
                    </div>

                    {/* Insights */}
                    <div className="model-section full-width">
                      <InsightCards trainingResults={trainingResults} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon"><Brain size={64} color="#6B7280" /></div>
                    <h3>No Model Trained Yet</h3>
                    <p>Train a machine learning model to view performance metrics and insights</p>
                    
                    <div className="empty-state-actions">
                      <button 
                        onClick={handleTrainModel}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        <Brain size={16} style={{ marginRight: '8px' }} />
                        Train ML Model
                      </button>
                    </div>
                    
                    <div className="empty-state-help">
                      <h4>What you'll get:</h4>
                      <ul>
                        <li><Target size={16} style={{ marginRight: '8px', display: 'inline' }} />Model performance metrics</li>
                        <li><Icon name="STAR" size={16} style={{ marginRight: '8px', display: 'inline' }} />Feature importance analysis</li>
                        <li><Icon name="INFO" size={16} style={{ marginRight: '8px', display: 'inline' }} />AI-powered business insights</li>
                        <li><BarChart3 size={16} style={{ marginRight: '8px', display: 'inline' }} />Model comparison results</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;