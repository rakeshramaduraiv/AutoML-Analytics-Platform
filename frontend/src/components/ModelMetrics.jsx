import React, { useState } from 'react';
import { Icon, ICON_SIZES } from '../constants/icons';
import { Target, Trophy, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const ModelMetrics = ({ trainingResults }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  if (!trainingResults) {
    return (
      <div className="model-metrics">
        <div className="empty-state-small">
          <p>No model metrics available. Train a model first.</p>
        </div>
      </div>
    );
  }

  const { metrics, problem_type, selected_model } = trainingResults;

  // Format percentage values
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format decimal values
  const formatDecimal = (value, decimals = 3) => {
    if (typeof value !== 'number') return 'N/A';
    return value.toFixed(decimals);
  };

  // Get metrics based on problem type
  const getMetricsDisplay = () => {
    if (problem_type?.includes('Classification')) {
      return [
        { 
          label: 'Accuracy', 
          value: formatPercentage(metrics?.accuracy), 
          color: '#3498db',
          tooltip: 'Percentage of correct predictions out of all predictions made'
        },
        { 
          label: 'Precision', 
          value: formatPercentage(metrics?.precision), 
          color: '#2ecc71',
          tooltip: 'Percentage of positive predictions that were actually correct'
        },
        { 
          label: 'Recall', 
          value: formatPercentage(metrics?.recall), 
          color: '#e74c3c',
          tooltip: 'Percentage of actual positive cases that were correctly identified'
        },
        { 
          label: 'F1-Score', 
          value: formatPercentage(metrics?.f1_score), 
          color: '#f39c12',
          tooltip: 'Harmonic mean of precision and recall, balancing both metrics'
        }
      ];
    } else if (problem_type === 'Regression') {
      return [
        { 
          label: 'R² Score', 
          value: formatDecimal(metrics?.r2_score), 
          color: '#3498db',
          tooltip: 'Coefficient of determination - how well the model explains variance (1.0 = perfect)'
        },
        { 
          label: 'MSE', 
          value: formatDecimal(metrics?.mean_squared_error), 
          color: '#e74c3c',
          tooltip: 'Mean Squared Error - average of squared differences between actual and predicted values'
        },
        { 
          label: 'RMSE', 
          value: formatDecimal(metrics?.root_mean_squared_error), 
          color: '#f39c12',
          tooltip: 'Root Mean Squared Error - square root of MSE, in same units as target variable'
        },
        { 
          label: 'MAE', 
          value: formatDecimal(metrics?.mean_absolute_error), 
          color: '#9b59b6',
          tooltip: 'Mean Absolute Error - average of absolute differences between actual and predicted values'
        }
      ];
    }
    return [];
  };

  // Get performance level based on primary metric
  const getPerformanceLevel = () => {
    let primaryMetric = 0;
    
    if (problem_type?.includes('Classification')) {
      primaryMetric = metrics?.accuracy || 0;
    } else if (problem_type === 'Regression') {
      primaryMetric = metrics?.r2_score || 0;
    }

    if (primaryMetric >= 0.9) return { level: 'Excellent', color: '#27ae60', IconComponent: Trophy };
    if (primaryMetric >= 0.8) return { level: 'Good', color: '#2ecc71', IconComponent: CheckCircle };
    if (primaryMetric >= 0.7) return { level: 'Fair', color: '#f39c12', IconComponent: AlertTriangle };
    return { level: 'Needs Improvement', color: '#e74c3c', IconComponent: XCircle };
  };

  const metricsDisplay = getMetricsDisplay();
  const performance = getPerformanceLevel();

  return (
    <div className="model-metrics">
      <div className="card-header">
        <h3><Target size={ICON_SIZES.LARGE} style={{ marginRight: '8px' }} />Model Performance</h3>
        <p>Evaluation metrics for your trained model</p>
      </div>

      <div className="card-content">
        {/* Model Info */}
        <div className="model-info-section">
          <div className="model-badges">
            <span className="model-badge primary">{selected_model}</span>
            <span className="model-badge secondary">{problem_type}</span>
          </div>
          
          <div className="performance-indicator">
            <performance.IconComponent size={ICON_SIZES.MEDIUM} color={performance.color} />
            <span 
              className="performance-level" 
              style={{ color: performance.color, marginLeft: '8px' }}
            >
              {performance.level}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          {metricsDisplay.map((metric, index) => (
            <div 
              key={index} 
              className="metric-card"
              onMouseEnter={() => setActiveTooltip(index)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div className="metric-header">
                <span className="metric-label">
                  {metric.label}
                  <Info size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />
                </span>
                
                {/* Tooltip */}
                {activeTooltip === index && (
                  <div className="tooltip">
                    {metric.tooltip}
                  </div>
                )}
              </div>
              
              <div className="metric-value" style={{ color: metric.color }}>
                {metric.value}
              </div>
              
              {/* Progress bar for percentage metrics */}
              {metric.value.includes('%') && (
                <div className="metric-progress">
                  <div 
                    className="metric-progress-fill"
                    style={{ 
                      width: metric.value,
                      backgroundColor: metric.color 
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="metrics-footer">
          <div className="metric-details">
            <div className="detail-item">
              <span className="detail-label">Test Samples:</span>
              <span className="detail-value">{metrics?.test_samples || 'N/A'}</span>
            </div>
            {metrics?.num_classes && (
              <div className="detail-item">
                <span className="detail-label">Classes:</span>
                <span className="detail-value">{metrics?.num_classes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMetrics;