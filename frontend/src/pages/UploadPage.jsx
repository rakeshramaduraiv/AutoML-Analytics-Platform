import React, { useState } from 'react';
import { apiService } from '../services/api';
import { 
  FolderOpen, BarChart3, CheckCircle, AlertTriangle, Zap, 
  Upload, Target, Search, FileText, HelpCircle 
} from 'lucide-react';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await apiService.uploadDataset(selectedFile);
      setUploadResult(result);
      localStorage.setItem('uploadResult', JSON.stringify(result));
      
      // Trigger storage event for sidebar stats update
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1><FolderOpen size={32} style={{ marginRight: '12px' }} />Upload Your Dataset</h1>
        <p className="page-subtitle">
          Start your AutoML journey by uploading a CSV file. Our platform will automatically 
          analyze your data and suggest the best machine learning approach.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <h3>Select Your CSV File</h3>
          
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              {!selectedFile ? (
                <>
                  <div className="upload-icon"><BarChart3 size={48} color="#007bff" /></div>
                  <h4>Drag & drop your CSV file here</h4>
                  <p>or click to browse files</p>
                  <div className="upload-requirements">
                    <small>• Supported format: CSV (.csv)</small>
                    <small>• Maximum size: 16MB</small>
                    <small>• Include column headers</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-icon success"><CheckCircle size={48} color="#28a745" /></div>
                  <h4>File Selected</h4>
                  <p>{selectedFile.name}</p>
                  <div className="file-details">
                    <small>Size: {(selectedFile.size / 1024).toFixed(2)} KB</small>
                  </div>
                </>
              )}
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <div className="upload-actions">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary upload-btn"
              >
                {uploading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Analyzing Dataset...
                  </>
                ) : (
                  <>
                    <Zap size={16} style={{ marginRight: '8px' }} />
                    Upload & Analyze
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  setUploadResult(null);
                }}
                className="btn btn-secondary"
                disabled={uploading}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-icon"><AlertTriangle size={20} color="#dc3545" /></div>
          <div className="alert-content">
            <h4>Upload Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="upload-results">
          <div className="results-header">
            <h3><CheckCircle size={24} style={{ marginRight: '8px' }} />Dataset Analysis Complete</h3>
            <p>Your dataset has been successfully analyzed. Here's what we found:</p>
          </div>
          
          <div className="results-grid">
            <div className="result-card primary">
              <div className="card-header">
                <h4><BarChart3 size={20} style={{ marginRight: '8px' }} />Dataset Overview</h4>
              </div>
              <div className="card-content">
                <div className="metric-row">
                  <span className="metric-label">Filename:</span>
                  <span className="metric-value">{uploadResult.filename}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Rows:</span>
                  <span className="metric-value highlight">{uploadResult.number_of_rows.toLocaleString()}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Columns:</span>
                  <span className="metric-value highlight">{uploadResult.number_of_columns}</span>
                </div>
              </div>
            </div>

            <div className="result-card">
              <div className="card-header">
                <h4><FileText size={20} style={{ marginRight: '8px' }} />Column Information</h4>
              </div>
              <div className="card-content">
                <div className="column-types-summary">
                  <div className="type-count">
                    <span className="type-badge numeric">
                      {Object.values(uploadResult.inferred_column_types).filter(type => type === 'numeric').length}
                    </span>
                    <span>Numeric</span>
                  </div>
                  <div className="type-count">
                    <span className="type-badge categorical">
                      {Object.values(uploadResult.inferred_column_types).filter(type => type === 'categorical').length}
                    </span>
                    <span>Categorical</span>
                  </div>
                </div>
                
                <div className="column-list">
                  {uploadResult.column_names.map((col, index) => (
                    <div key={index} className="column-item">
                      <span className="column-name">{col}</span>
                      <span className={`column-type ${uploadResult.inferred_column_types[col]}`}>
                        {uploadResult.inferred_column_types[col]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <div className="next-steps-content">
              <h4><Target size={20} style={{ marginRight: '8px' }} />What's Next?</h4>
              <p>Your dataset is ready for machine learning! Head to the Dashboard to:</p>
              <ul>
                <li>Explore data visualizations</li>
                <li>Train automated ML models</li>
                <li>Get business insights</li>
                <li>Make predictions</li>
              </ul>
              
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/dashboard'}
              >
                <BarChart3 size={16} style={{ marginRight: '8px' }} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Help */}
      {!selectedFile && !uploadResult && !error && (
        <div className="help-section">
          <div className="help-card">
            <h4><HelpCircle size={20} style={{ marginRight: '8px' }} />Need Help Getting Started?</h4>
            <div className="help-content">
              <div className="help-item">
                <span className="help-icon"><FileText size={20} /></span>
                <div>
                  <strong>Prepare Your Data</strong>
                  <p>Ensure your CSV has column headers and clean data</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon"><Target size={20} /></span>
                <div>
                  <strong>Include Target Column</strong>
                  <p>Make sure you have a column with the values you want to predict</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon"><Search size={20} /></span>
                <div>
                  <strong>Check Data Quality</strong>
                  <p>Remove or handle missing values for best results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;