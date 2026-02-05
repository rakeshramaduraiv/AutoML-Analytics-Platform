import React, { useState, useEffect } from 'react';
import { 
  Database, Filter, Eye, RefreshCw,
  CheckCircle, Info, Trash2,
  Play, Download, BarChart3, Zap, Settings
} from 'lucide-react';

const ImprovedDataPreprocessingPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const [dataQuality, setDataQuality] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setUploadResult(result);
      generateSampleData(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (uploadResult && dataPreview.length > 0) {
      analyzeDataQuality(uploadResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPreview]);

  const generateSampleData = (metadata) => {
    if (!metadata) return;
    
    const { column_names, inferred_column_types, number_of_rows } = metadata;
    const sampleSize = Math.min(100, number_of_rows || 50);
    const sample = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const row = {};
      column_names?.forEach(column => {
        const columnType = inferred_column_types?.[column];
        
        // Add some missing values intentionally for demonstration
        if (Math.random() < 0.1) {
          row[column] = null;
          return;
        }
        
        if (columnType === 'numeric') {
          if (column.toLowerCase().includes('age')) {
            row[column] = Math.floor(Math.random() * 60) + 18;
          } else if (column.toLowerCase().includes('salary')) {
            row[column] = Math.floor(Math.random() * 80000) + 30000;
          } else if (column.toLowerCase().includes('score')) {
            row[column] = Math.floor(Math.random() * 100) + 1;
          } else {
            row[column] = Math.round(Math.random() * 1000) / 10;
          }
        } else {
          if (column.toLowerCase().includes('name')) {
            const names = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', ''];
            row[column] = names[Math.floor(Math.random() * names.length)];
          } else if (column.toLowerCase().includes('category')) {
            const categories = ['Premium', 'Standard', 'Basic', 'Enterprise', ''];
            row[column] = categories[Math.floor(Math.random() * categories.length)];
          } else if (column.toLowerCase().includes('status')) {
            const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
            row[column] = statuses[Math.floor(Math.random() * statuses.length)];
          } else {
            const values = ['Option A', 'Option B', 'Option C', 'Option D'];
            row[column] = values[Math.floor(Math.random() * values.length)];
          }
        }
      });
      sample.push(row);
    }
    
    setDataPreview(sample);
    setProcessedData(sample);
  };

  const analyzeDataQuality = (metadata) => {
    if (!metadata || !dataPreview.length) return;
    
    const columns = Object.keys(dataPreview[0]);
    const analysis = {
      totalRows: dataPreview.length,
      totalColumns: columns.length,
      missingValues: {},
      dataTypes: {},
      uniqueValues: {},
      outliers: {},
      overallScore: 0
    };

    columns.forEach(column => {
      const values = dataPreview.map(row => row[column]).filter(val => val !== null && val !== '');
      const totalValues = dataPreview.length;
      const missingCount = totalValues - values.length;
      
      analysis.missingValues[column] = {
        count: missingCount,
        percentage: (missingCount / totalValues * 100).toFixed(1)
      };
      
      analysis.dataTypes[column] = typeof values[0];
      analysis.uniqueValues[column] = new Set(values).size;
      
      // Simple outlier detection for numeric columns
      if (typeof values[0] === 'number') {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const outlierCount = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
        analysis.outliers[column] = outlierCount;
      }
    });

    // Calculate overall quality score
    const avgMissingPercentage = Object.values(analysis.missingValues)
      .reduce((sum, mv) => sum + parseFloat(mv.percentage), 0) / columns.length;
    analysis.overallScore = Math.max(0, 100 - avgMissingPercentage * 2);

    setDataQuality(analysis);
  };

  const addProcessingStep = (stepType, config) => {
    const newStep = {
      id: Date.now(),
      type: stepType,
      config,
      applied: false,
      description: getStepDescription(stepType, config)
    };
    
    setProcessingSteps(prev => [...prev, newStep]);
  };

  const getStepDescription = (stepType, config) => {
    switch (stepType) {
      case 'remove_missing':
        return `Remove rows with missing values in ${config.columns?.join(', ') || 'all columns'}`;
      case 'fill_missing':
        return `Fill missing values in ${config.column} with ${config.method}`;
      case 'remove_outliers':
        return `Remove outliers from ${config.column} using ${config.method} method`;
      case 'normalize':
        return `Normalize ${config.column} using ${config.method}`;
      case 'encode_categorical':
        return `Encode categorical column ${config.column}`;
      default:
        return stepType;
    }
  };

  const applyProcessingSteps = async () => {
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let processed = [...dataPreview];
    
    processingSteps.forEach(step => {
      switch (step.type) {
        case 'remove_missing':
          processed = processed.filter(row => {
            const columns = step.config.columns || Object.keys(row);
            return columns.every(col => row[col] !== null && row[col] !== '');
          });
          break;
          
        case 'fill_missing':
          const column = step.config.column;
          const method = step.config.method;
          
          if (method === 'mean') {
            const values = processed.map(row => row[column]).filter(val => val !== null && val !== '');
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            processed = processed.map(row => ({
              ...row,
              [column]: row[column] === null || row[column] === '' ? mean : row[column]
            }));
          } else if (method === 'mode') {
            const values = processed.map(row => row[column]).filter(val => val !== null && val !== '');
            const mode = values.sort((a,b) =>
              values.filter(v => v === a).length - values.filter(v => v === b).length
            ).pop();
            processed = processed.map(row => ({
              ...row,
              [column]: row[column] === null || row[column] === '' ? mode : row[column]
            }));
          }
          break;
          
        case 'remove_outliers':
          const col = step.config.column;
          const values = processed.map(row => row[col]).filter(val => typeof val === 'number');
          const sorted = values.sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          
          processed = processed.filter(row => {
            const value = row[col];
            return typeof value !== 'number' || (value >= lowerBound && value <= upperBound);
          });
          break;
          
        default:
          break;
      }
    });
    
    setProcessedData(processed);
    setIsProcessing(false);
    
    // Update processing steps as applied
    setProcessingSteps(prev => prev.map(step => ({ ...step, applied: true })));
  };

  const removeProcessingStep = (stepId) => {
    setProcessingSteps(prev => prev.filter(step => step.id !== stepId));
  };

  if (!uploadResult) {
    return (
      <div className="preprocessing-page">
        <div className="page-header">
          <h1><Settings size={32} />Data Preprocessing</h1>
          <p>Clean and prepare your data for machine learning</p>
          <div className="dataset-info-inline">
            <span>Dataset: {uploadResult?.filename || uploadResult?.name || 'Unknown'}</span>
            <span>{uploadResult?.rows?.toLocaleString() || uploadResult?.number_of_rows?.toLocaleString() || 'N/A'} rows × {uploadResult?.columns || uploadResult?.number_of_columns || uploadResult?.column_names?.length || 'N/A'} columns</span>
          </div>
        </div>
        
        <div className="empty-state">
          <Database size={64} color="#6B7280" />
          <h3>No Data Available</h3>
          <p>Upload a dataset to start data preprocessing</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Upload Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="preprocessing-page">
      <div className="page-header">
        <h1><Settings size={32} />Data Preprocessing</h1>
        <p>Clean and prepare your data for machine learning</p>
      </div>

      <div className="preprocessing-workspace">
        {/* Left Panel - Data Quality Analysis */}
        <div className="quality-panel">
          <div className="panel-header">
            <h3><BarChart3 size={20} />Data Quality Analysis</h3>
          </div>
          
          {dataQuality && (
            <div className="quality-content">
              <div className="quality-score">
                <div className="score-circle">
                  <span className="score-value">{Math.round(dataQuality.overallScore)}</span>
                  <span className="score-label">Quality Score</span>
                </div>
              </div>
              
              <div className="quality-metrics">
                <div className="metric-item">
                  <span className="metric-label">Total Rows:</span>
                  <span className="metric-value">{dataQuality.totalRows.toLocaleString()}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Columns:</span>
                  <span className="metric-value">{dataQuality.totalColumns}</span>
                </div>
              </div>
              
              <div className="column-analysis">
                <h4>Column Analysis</h4>
                {Object.keys(dataQuality.missingValues).map(column => (
                  <div key={column} className="column-item">
                    <div className="column-header">
                      <span className="column-name">{column}</span>
                      <span className="column-type">{dataQuality.dataTypes[column]}</span>
                    </div>
                    <div className="column-stats">
                      <div className="stat">
                        <span>Missing: {dataQuality.missingValues[column].percentage}%</span>
                      </div>
                      <div className="stat">
                        <span>Unique: {dataQuality.uniqueValues[column]}</span>
                      </div>
                      {dataQuality.outliers[column] !== undefined && (
                        <div className="stat">
                          <span>Outliers: {dataQuality.outliers[column]}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="column-actions">
                      {parseFloat(dataQuality.missingValues[column].percentage) > 0 && (
                        <>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => addProcessingStep('fill_missing', { 
                              column, 
                              method: dataQuality.dataTypes[column] === 'number' ? 'mean' : 'mode' 
                            })}
                          >
                            Fill Missing
                          </button>
                        </>
                      )}
                      {dataQuality.outliers[column] > 0 && (
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => addProcessingStep('remove_outliers', { column, method: 'iqr' })}
                        >
                          Remove Outliers
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Processing Steps */}
        <div className="steps-panel">
          <div className="panel-header">
            <h3><Filter size={20} />Processing Pipeline</h3>
            <button 
              className="btn btn-primary"
              onClick={applyProcessingSteps}
              disabled={isProcessing || processingSteps.length === 0}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Apply Steps
                </>
              )}
            </button>
          </div>
          
          <div className="steps-list">
            {processingSteps.length === 0 ? (
              <div className="no-steps">
                <Info size={32} color="#6B7280" />
                <p>No processing steps added yet</p>
                <p>Use the data quality analysis to add preprocessing steps</p>
              </div>
            ) : (
              processingSteps.map((step, index) => (
                <div key={step.id} className={`step-item ${step.applied ? 'applied' : ''}`}>
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <div className="step-description">{step.description}</div>
                    <div className="step-type">{step.type.replace('_', ' ').toUpperCase()}</div>
                  </div>
                  <div className="step-status">
                    {step.applied ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <button 
                        className="btn-icon"
                        onClick={() => removeProcessingStep(step.id)}
                        title="Remove Step"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => addProcessingStep('remove_missing', { columns: null })}
              >
                Remove All Missing Rows
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const numericColumns = Object.keys(dataQuality?.dataTypes || {})
                    .filter(col => dataQuality.dataTypes[col] === 'number');
                  numericColumns.forEach(col => {
                    addProcessingStep('normalize', { column: col, method: 'standard' });
                  });
                }}
              >
                Normalize All Numeric
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Data Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h3><Eye size={20} />Data Preview</h3>
            <div className="preview-stats">
              <span>{processedData.length} rows</span>
              <span>{Object.keys(processedData[0] || {}).length} columns</span>
            </div>
          </div>
          
          <div className="data-table-container">
            {processedData.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(processedData[0]).map(column => (
                      <th key={column}>
                        <div className="column-header">
                          <span>{column}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.slice(0, 20).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className={value === null || value === '' ? 'missing-value' : ''}>
                          {value === null || value === '' ? 
                            <span className="missing-indicator">NULL</span> : 
                            (typeof value === 'number' ? value.toLocaleString() : String(value))
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="preview-actions">
            <button className="btn btn-secondary">
              <Download size={16} />
              Export Processed Data
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem('processedData', JSON.stringify(processedData));
                window.location.href = '/train';
              }}
            >
              <Zap size={16} />
              Continue to Training
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedDataPreprocessingPage;