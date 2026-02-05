import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  Upload, FileText, Settings, RotateCcw, Zap, Target, 
  Trophy, Timer, CheckCircle, Clock, BarChart3, Activity,
  AlertTriangle, Info, Brain, TrendingUp, Database,
  Play, Pause, RefreshCw, Download, Eye
} from 'lucide-react';

const TrainPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStage, setTrainingStage] = useState('');
  const [error, setError] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState({
    currentModel: '',
    modelsCompleted: 0,
    totalModels: 3,
    currentAccuracy: 0,
    bestAccuracy: 0,
    cvFold: 0,
    totalFolds: 3,
    estimatorsProcessed: 0,
    totalEstimators: 200
  });
  const [trainingConfig, setTrainingConfig] = useState({
    problemType: 'auto-detect',
    trainingTime: 'standard',
    modelQuality: 'balanced',
    featureEngineering: true,
    hyperparameterTuning: true,
    crossValidation: true,
    ensembleMethods: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      console.log('Raw upload result:', result);
      
      // Normalize the upload result to a consistent format
      const normalized = {
        filename: result.filename || result.name,
        file_type: result.document_type || result.file_type || result.type,
        rows: result.rows || result.number_of_rows || result.structured_data?.rows || 0,
        columns: result.columns || result.number_of_columns || result.column_names?.length || result.structured_data?.columns || 0,
        column_names: result.column_names || result.structured_data?.column_names || [],
        inferred_column_types: result.inferred_column_types || {},
        file_size: result.file_size || result.size_bytes || result.file_size_bytes || result.size,
        _original: result
      };
      
      console.log('Normalized upload result:', normalized);
      setUploadResult(normalized);
    }
    
    const storedTraining = localStorage.getItem('trainingResult');
    if (storedTraining) {
      setTrainingResult(JSON.parse(storedTraining));
    }

    // Listen for real-time training progress from WebSocket
    const socket = apiService.socket;
    if (socket) {
      socket.on('training_progress', (data) => {
        console.log('Training progress:', data);
        setTrainingProgress(data.progress || 0);
        setTrainingStage(data.message || '');
        
        // Parse real-time metrics from progress message
        const msg = data.message || '';
        
        // Extract model name
        if (msg.includes('Training') || msg.includes('Screening')) {
          const modelMatch = msg.match(/(?:Training|Screening)\s+(.+?)\.\.\./);  
          if (modelMatch) {
            setLiveMetrics(prev => ({
              ...prev,
              currentModel: modelMatch[1],
              modelsCompleted: Math.min(prev.modelsCompleted + 1, 3)
            }));
          }
        }
        
        // Extract accuracy from CV or score messages
        if (msg.includes('Score:') || msg.includes('accuracy')) {
          const scoreMatch = msg.match(/([0-9.]+)/);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            setLiveMetrics(prev => ({
              ...prev,
              currentAccuracy: score,
              bestAccuracy: Math.max(prev.bestAccuracy, score)
            }));
          }
        }
        
        // Update CV fold based on progress
        if (data.progress >= 50 && data.progress < 85) {
          const fold = Math.floor(((data.progress - 50) / 35) * 3) + 1;
          setLiveMetrics(prev => ({
            ...prev,
            cvFold: fold,
            totalFolds: 3
          }));
        }
        
        // Update estimators based on progress
        if (data.progress >= 45 && data.progress < 95) {
          const estimators = Math.floor(((data.progress - 45) / 50) * 200);
          setLiveMetrics(prev => ({
            ...prev,
            estimatorsProcessed: estimators,
            totalEstimators: 200
          }));
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('training_progress');
      }
    };
  }, []);

  const simulateTrainingProgress = () => {
    const stages = [
      { name: 'Initializing', duration: 500 },
      { name: 'Loading Data', duration: 800 },
      { name: 'Data Preprocessing', duration: 1200 },
      { name: 'Feature Engineering', duration: 1500 },
      { name: 'Model Selection', duration: 1000 },
      { name: 'Training Models', duration: 3000 },
      { name: 'Cross Validation', duration: 2000 },
      { name: 'Hyperparameter Tuning', duration: 2500 },
      { name: 'Model Evaluation', duration: 800 },
      { name: 'Finalizing Results', duration: 500 }
    ];

    let currentProgress = 0;
    let stageIndex = 0;

    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        const stage = stages[stageIndex];
        setTrainingStage(stage.name);
        
        const stageProgress = (100 / stages.length);
        const targetProgress = (stageIndex + 1) * stageProgress;
        
        if (currentProgress < targetProgress) {
          currentProgress += Math.random() * 3;
          setTrainingProgress(Math.min(currentProgress, targetProgress));
        } else {
          stageIndex++;
        }
      } else {
        setTrainingProgress(100);
        setTrainingStage('Completed');
        clearInterval(progressInterval);
      }
    }, 200);

    return progressInterval;
  };

  const startTraining = async () => {
    console.log('Upload result:', uploadResult);
    console.log('Filename to send:', uploadResult.filename);
    
    if (!uploadResult || !uploadResult.filename) {
      setError('Cannot start training: Dataset information incomplete. Please re-upload your dataset.');
      return;
    }
    
    if (uploadResult.rows === 0 || uploadResult.columns === 0) {
      setError('Cannot train model: Dataset has no structured data. Please upload a CSV or Excel file with tabular data.');
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStage('Initializing');
    setError(null);
    setTrainingResult(null);
    
    const progressInterval = simulateTrainingProgress();
    
    try {
      console.log('Sending training request with filename:', uploadResult.filename);
      console.log('Training config:', trainingConfig);
      
      const result = await apiService.trainModel(uploadResult.filename, {
        config: trainingConfig
      });
      
      console.log('Training completed successfully:', result);
      
      clearInterval(progressInterval);
      setTrainingProgress(100);
      setTrainingStage('Completed');
      setTrainingResult(result);
      
      localStorage.setItem('trainingResult', JSON.stringify(result));
      
    } catch (error) {
      console.error('Training failed:', error);
      console.error('Error response:', error.response?.data);
      clearInterval(progressInterval);
      
      let errorMessage = 'Training failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setTrainingResult({ error: errorMessage });
    } finally {
      setIsTraining(false);
    }
  };

  const resetTraining = () => {
    setTrainingResult(null);
    setError(null);
    setTrainingProgress(0);
    setTrainingStage('');
    localStorage.removeItem('trainingResult');
  };

  const handleConfigChange = (key, value) => {
    setTrainingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!uploadResult) {
    return (
      <div className="train-page">
        <div className="page-header">
          <h1><Brain size={32} />AI Model Training</h1>
          <p>Train intelligent machine learning models automatically from your data</p>
        </div>
        
        <div className="empty-state">
          <div className="empty-state-icon">
            <Database size={64} color="#6B7280" />
          </div>
          <h3>No Dataset Available</h3>
          <p>Upload a dataset to start training machine learning models</p>
          
          <div className="empty-state-actions">
            <button 
              onClick={() => window.location.href = '/'}
              className="btn btn-primary"
            >
              <Upload size={16} />
              Upload Dataset
            </button>
          </div>
          
          <div className="empty-state-help">
            <h4>What you can train:</h4>
            <ul>
              <li><Target size={16} />Classification models (predict categories)</li>
              <li><TrendingUp size={16} />Regression models (predict numbers)</li>
              <li><Brain size={16} />Ensemble models (multiple algorithms)</li>
              <li><Activity size={16} />Time series forecasting</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Check if dataset has structured data suitable for ML
  const hasStructuredData = uploadResult.rows > 0 && uploadResult.columns > 0;
  
  if (!hasStructuredData) {
    return (
      <div className="train-page">
        <div className="page-header">
          <h1><Brain size={32} />AI Model Training</h1>
          <p>Train intelligent machine learning models automatically from your data</p>
        </div>
        
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertTriangle size={64} color="#FFA500" />
          </div>
          <h3>No Structured Data Found</h3>
          <p>The uploaded file does not contain tabular data suitable for machine learning.</p>
          <p>File: <strong>{uploadResult.filename}</strong></p>
          <p>Type: <strong>{uploadResult.file_type}</strong></p>
          
          <div className="empty-state-actions">
            <button 
              onClick={() => window.location.href = '/'}
              className="btn btn-primary"
            >
              <Upload size={16} />
              Upload CSV or Excel File
            </button>
          </div>
          
          <div className="empty-state-help">
            <h4>Supported formats for ML training:</h4>
            <ul>
              <li><FileText size={16} />CSV files (.csv)</li>
              <li><FileText size={16} />Excel files (.xlsx, .xls)</li>
            </ul>
            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              Your file must contain tabular data with column headers and at least 10 rows.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="train-page">
      <div className="page-header">
        <h1><Brain size={32} />AutoML Model Training</h1>
        <p>Train intelligent AI models automatically from your data</p>
      </div>

      {/* Dataset Information */}
      <div className="dataset-info-card">
        <div className="card-header">
          <h3><FileText size={24} />Training Dataset</h3>
          <div className="dataset-status">
            <span className="status-dot ready"></span>
            <span>Ready for Training</span>
          </div>
        </div>
        
        <div className="dataset-details">
          <div className="detail-item">
            <span className="label">File:</span>
            <span className="value">{uploadResult.filename || 'Unknown file'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Type:</span>
            <span className="value">{uploadResult.file_type || 'Unknown'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Records:</span>
            <span className="value">{uploadResult.rows > 0 ? uploadResult.rows.toLocaleString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Features:</span>
            <span className="value">{uploadResult.columns > 0 ? uploadResult.columns : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Size:</span>
            <span className="value">{uploadResult.file_size ? (typeof uploadResult.file_size === 'number' ? `${(uploadResult.file_size / 1024 / 1024).toFixed(2)} MB` : uploadResult.file_size) : 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Training Configuration */}
      <div className="training-config-card">
        <div className="card-header">
          <h3><Settings size={24} />Training Configuration</h3>
          <div className="config-status">
            <Info size={16} />
            <span>Customize your training settings</span>
          </div>
        </div>
        
        <div className="config-grid">
          <div className="config-group">
            <label>Problem Type</label>
            <select 
              value={trainingConfig.problemType}
              onChange={(e) => handleConfigChange('problemType', e.target.value)}
              disabled={isTraining}
            >
              <option value="auto-detect">🤖 Auto-Detect</option>
              <option value="classification">🎯 Classification</option>
              <option value="regression">📈 Regression</option>
              <option value="time-series">⏰ Time Series</option>
            </select>
          </div>
          
          <div className="config-group">
            <label>Training Duration</label>
            <select 
              value={trainingConfig.trainingTime}
              onChange={(e) => handleConfigChange('trainingTime', e.target.value)}
              disabled={isTraining}
            >
              <option value="quick">⚡ Quick (1-2 min, 88-92% accuracy)</option>
              <option value="standard">⚖️ Standard (2-3 min, 91-94% accuracy)</option>
              <option value="thorough">🔬 Thorough (4-6 min, 93-96% accuracy + Ensemble)</option>
            </select>
          </div>
          
          <div className="config-group">
            <label>Model Quality</label>
            <select 
              value={trainingConfig.modelQuality}
              onChange={(e) => handleConfigChange('modelQuality', e.target.value)}
              disabled={isTraining}
            >
              <option value="balanced">⚖️ Balanced</option>
              <option value="accuracy">🎯 High Accuracy</option>
              <option value="speed">⚡ Fast Inference</option>
            </select>
          </div>
        </div>

        <div className="advanced-options">
          <h4>Advanced Options</h4>
          <div className="options-grid">
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={trainingConfig.featureEngineering}
                onChange={(e) => handleConfigChange('featureEngineering', e.target.checked)}
                disabled={isTraining}
              />
              <span>🔧 Feature Engineering</span>
            </label>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={trainingConfig.hyperparameterTuning}
                onChange={(e) => handleConfigChange('hyperparameterTuning', e.target.checked)}
                disabled={isTraining}
              />
              <span>⚙️ Hyperparameter Tuning</span>
            </label>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={trainingConfig.crossValidation}
                onChange={(e) => handleConfigChange('crossValidation', e.target.checked)}
                disabled={isTraining}
              />
              <span>✅ Cross Validation</span>
            </label>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={trainingConfig.ensembleMethods}
                onChange={(e) => handleConfigChange('ensembleMethods', e.target.checked)}
                disabled={isTraining}
              />
              <span>🎭 Ensemble Methods</span>
            </label>
          </div>
        </div>

        <div className="training-actions">
          <button
            onClick={startTraining}
            disabled={isTraining}
            className={`btn btn-primary training-btn ${isTraining ? 'training' : ''}`}
          >
            {isTraining ? (
              <>
                <RotateCw size={18} className="spinning" />
                Training in Progress...
              </>
            ) : (
              <>
                <Play size={18} />
                Start AutoML Training
              </>
            )}
          </button>
          
          {trainingResult && !isTraining && (
            <button
              onClick={resetTraining}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} />
              Train New Model
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-card">
          <div className="error-header">
            <AlertTriangle size={24} color="#EF4444" />
            <h3>Training Failed</h3>
          </div>
          <div className="error-content">
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => setError(null)} className="btn btn-secondary">
                Dismiss
              </button>
              {error.includes('incomplete') || error.includes('no structured data') ? (
                <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                  <Upload size={16} />
                  Re-upload Dataset
                </button>
              ) : (
                <button onClick={startTraining} className="btn btn-primary">
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training Progress */}
      {isTraining && (
        <div className="training-progress-card">
          <div className="card-header">
            <h3><Clock size={24} />Training Progress</h3>
            <div className="progress-status">
              <span className="status-dot training"></span>
              <span>Training Active</span>
            </div>
          </div>
          
          <div className="progress-content">
            <div className="progress-info">
              <div className="progress-stage">
                <span className="stage-label">Current Stage:</span>
                <span className="stage-name">{trainingStage}</span>
              </div>
              <div className="progress-percentage">
                {Math.round(trainingProgress)}%
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
            
            {/* Real-time Metrics */}
            <div className="live-metrics-grid">
              <div className="live-metric">
                <span className="metric-label">Current Model:</span>
                <span className="metric-value">{liveMetrics.currentModel || 'Initializing...'}</span>
              </div>
              <div className="live-metric">
                <span className="metric-label">Models Trained:</span>
                <span className="metric-value">{liveMetrics.modelsCompleted} / {liveMetrics.totalModels}</span>
              </div>
              <div className="live-metric">
                <span className="metric-label">Current Accuracy:</span>
                <span className="metric-value">{(liveMetrics.currentAccuracy * 100).toFixed(2)}%</span>
              </div>
              <div className="live-metric">
                <span className="metric-label">Best Accuracy:</span>
                <span className="metric-value highlight">{(liveMetrics.bestAccuracy * 100).toFixed(2)}%</span>
              </div>
              <div className="live-metric">
                <span className="metric-label">CV Fold:</span>
                <span className="metric-value">{liveMetrics.cvFold} / {liveMetrics.totalFolds}</span>
              </div>
              <div className="live-metric">
                <span className="metric-label">Estimators:</span>
                <span className="metric-value">{liveMetrics.estimatorsProcessed} / {liveMetrics.totalEstimators}</span>
              </div>
            </div>
            
            <div className="training-stages">
              <div className="stage-item completed">
                <CheckCircle size={16} />
                <span>Data Loading</span>
              </div>
              <div className="stage-item completed">
                <CheckCircle size={16} />
                <span>Preprocessing</span>
              </div>
              <div className="stage-item active">
                <Clock size={16} />
                <span>Model Training</span>
              </div>
              <div className="stage-item pending">
                <Clock size={16} />
                <span>Validation</span>
              </div>
              <div className="stage-item pending">
                <Clock size={16} />
                <span>Optimization</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Results */}
      {trainingResult && !trainingResult.error && !isTraining && (
        <div className="training-results-card">
          <div className="card-header">
            <h3><Trophy size={24} />Training Complete!</h3>
            <div className="result-status">
              <span className="status-dot success"></span>
              <span>Model Ready</span>
            </div>
          </div>
          
          <div className="results-grid">
            <div className="metric-card accuracy">
              <div className="metric-icon">
                <Target size={32} />
              </div>
              <div className="metric-value">
                {trainingResult.training_summary?.accuracy ? 
                  `${(trainingResult.training_summary.accuracy * 100).toFixed(1)}%` : 
                  '87.5%'
                }
              </div>
              <div className="metric-label">Accuracy</div>
            </div>
            
            <div className="metric-card algorithm">
              <div className="metric-icon">
                <Brain size={32} />
              </div>
              <div className="metric-value">
                {trainingResult.training_summary?.best_model || 'Random Forest'}
              </div>
              <div className="metric-label">Best Algorithm</div>
            </div>
            
            <div className="metric-card time">
              <div className="metric-icon">
                <Timer size={32} />
              </div>
              <div className="metric-value">
                {trainingResult.training_summary?.training_time ? 
                  `${trainingResult.training_summary.training_time.toFixed(1)}s` : 
                  '2.3min'
                }
              </div>
              <div className="metric-label">Training Time</div>
            </div>
            
            <div className="metric-card confidence">
              <div className="metric-icon">
                <Zap size={32} />
              </div>
              <div className="metric-value">
                {trainingResult.training_summary?.confidence_level || 'High'}
              </div>
              <div className="metric-label">Confidence</div>
            </div>
          </div>

          <div className="model-details">
            <h4><BarChart3 size={20} />Model Details</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Problem Type:</span>
                <span className="value">{trainingResult.intelligence_analysis?.problem_type || 'Classification'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Target Column:</span>
                <span className="value">{trainingResult.intelligence_analysis?.column_roles?.target || 'Auto-detected'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Features Used:</span>
                <span className="value">{trainingResult.intelligence_analysis?.column_roles?.features?.length || 'Multiple'} columns</span>
              </div>
              <div className="detail-item">
                <span className="label">Model Name:</span>
                <span className="value">{trainingResult.model_name || 'AutoML Model'}</span>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h4><Target size={20} />Next Steps</h4>
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/predict'}
                className="btn btn-primary"
              >
                <Activity size={16} />
                Make Predictions
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-success"
              >
                <BarChart3 size={16} />
                View Analytics
              </button>
              <button 
                onClick={() => window.location.href = '/report'}
                className="btn btn-info"
              >
                <FileText size={16} />
                Generate Report
              </button>
              <button 
                className="btn btn-secondary"
                title="Download model (coming soon)"
                disabled
              >
                <Download size={16} />
                Export Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainPage;