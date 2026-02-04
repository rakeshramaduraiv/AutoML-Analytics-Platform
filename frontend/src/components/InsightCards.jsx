import React from 'react';
import { Icon, ICON_SIZES } from '../constants/icons';
import { 
  Target, CheckCircle, AlertTriangle, XCircle, Info, Search, 
  Scale, Trophy, TrendingUp, BarChart3, TreePine, Calculator,
  ChevronRight, Lightbulb, Rocket, FileText 
} from 'lucide-react';

const InsightCards = ({ trainingResults }) => {
  
  if (!trainingResults) {
    return (
      <div className="insights-loading">
        <p>No insights available. Train a model first.</p>
      </div>
    );
  }

  const { metrics, problem_type, selected_model, training_summary } = trainingResults;

  // Generate insights based on metrics and problem type
  const generateInsights = () => {
    const insights = [];

    if (problem_type?.includes('Classification')) {
      const accuracy = metrics?.accuracy || 0;
      const precision = metrics?.precision || 0;
      const recall = metrics?.recall || 0;
      const f1 = metrics?.f1_score || 0;

      // Performance insights
      if (accuracy >= 0.9) {
        insights.push({
          type: 'success',
          IconComponent: Target,
          title: 'Excellent Performance',
          message: `Model achieves outstanding ${(accuracy * 100).toFixed(1)}% accuracy`
        });
      } else if (accuracy >= 0.8) {
        insights.push({
          type: 'good',
          IconComponent: CheckCircle,
          title: 'Good Performance',
          message: `Model shows solid ${(accuracy * 100).toFixed(1)}% accuracy`
        });
      } else if (accuracy >= 0.7) {
        insights.push({
          type: 'warning',
          IconComponent: AlertTriangle,
          title: 'Fair Performance',
          message: `Model accuracy of ${(accuracy * 100).toFixed(1)}% may need improvement`
        });
      } else {
        insights.push({
          type: 'error',
          IconComponent: XCircle,
          title: 'Low Performance',
          message: `Model accuracy of ${(accuracy * 100).toFixed(1)}% requires attention`
        });
      }

      // Precision vs Recall insights
      if (precision > recall + 0.1) {
        insights.push({
          type: 'info',
          IconComponent: Target,
          title: 'High Precision Model',
          message: 'Model is conservative - fewer false positives but may miss some cases'
        });
      } else if (recall > precision + 0.1) {
        insights.push({
          type: 'info',
          IconComponent: Search,
          title: 'High Recall Model',
          message: 'Model is sensitive - catches most cases but may have false positives'
        });
      } else if (Math.abs(precision - recall) <= 0.05) {
        insights.push({
          type: 'success',
          IconComponent: Scale,
          title: 'Balanced Model',
          message: 'Good balance between precision and recall'
        });
      }

      // F1-score insight
      if (f1 >= 0.8) {
        insights.push({
          type: 'success',
          IconComponent: Trophy,
          title: 'Strong F1-Score',
          message: `F1-score of ${(f1 * 100).toFixed(1)}% indicates robust overall performance`
        });
      }

    } else if (problem_type === 'Regression') {
      const r2 = metrics?.r2_score || 0;
      const rmse = metrics?.root_mean_squared_error || 0;

      // R² insights
      if (r2 >= 0.9) {
        insights.push({
          type: 'success',
          IconComponent: TrendingUp,
          title: 'Excellent Fit',
          message: `R² of ${r2.toFixed(3)} shows model explains most variance`
        });
      } else if (r2 >= 0.7) {
        insights.push({
          type: 'good',
          IconComponent: BarChart3,
          title: 'Good Fit',
          message: `R² of ${r2.toFixed(3)} indicates reasonable predictive power`
        });
      } else if (r2 >= 0.5) {
        insights.push({
          type: 'warning',
          IconComponent: AlertTriangle,
          title: 'Moderate Fit',
          message: `R² of ${r2.toFixed(3)} suggests room for improvement`
        });
      } else {
        insights.push({
          type: 'error',
          IconComponent: XCircle,
          title: 'Poor Fit',
          message: `R² of ${r2.toFixed(3)} indicates model needs significant improvement`
        });
      }

      // RMSE insight
      if (metrics?.target_range) {
        const range = metrics.target_range.max - metrics.target_range.min;
        const rmsePercent = (rmse / range) * 100;
        
        if (rmsePercent <= 10) {
          insights.push({
            type: 'success',
            IconComponent: Target,
            title: 'Low Prediction Error',
            message: `RMSE represents only ${rmsePercent.toFixed(1)}% of target range`
          });
        } else if (rmsePercent <= 20) {
          insights.push({
            type: 'good',
            IconComponent: CheckCircle,
            title: 'Acceptable Error',
            message: `RMSE represents ${rmsePercent.toFixed(1)}% of target range`
          });
        }
      }
    }

    // Model-specific insights
    if (selected_model?.includes('Random Forest')) {
      insights.push({
        type: 'info',
        IconComponent: TreePine,
        title: 'Tree-Based Model',
        message: 'Random Forest provides feature importance and handles mixed data types well'
      });
    } else if (selected_model?.includes('Logistic')) {
      insights.push({
        type: 'info',
        IconComponent: Calculator,
        title: 'Linear Model',
        message: 'Logistic Regression offers interpretable coefficients and fast predictions'
      });
    }

    // Sample size insights
    if (metrics?.test_samples) {
      if (metrics.test_samples < 100) {
        insights.push({
          type: 'warning',
          IconComponent: BarChart3,
          title: 'Small Test Set',
          message: `Test set has only ${metrics.test_samples} samples - consider more data for robust evaluation`
        });
      } else if (metrics.test_samples >= 1000) {
        insights.push({
          type: 'success',
          IconComponent: TrendingUp,
          title: 'Large Test Set',
          message: `Test set of ${metrics.test_samples} samples provides reliable performance estimates`
        });
      }
    }

    return insights;
  };

  // Generate recommendations based on metrics
  const generateRecommendations = () => {
    const recommendations = [];

    if (problem_type?.includes('Classification')) {
      const accuracy = metrics?.accuracy || 0;
      
      if (accuracy < 0.8) {
        recommendations.push('Consider feature engineering or collecting more training data');
        recommendations.push('Try ensemble methods or hyperparameter tuning');
      }
      
      if (metrics?.precision && metrics?.recall) {
        if (metrics.precision < 0.7) {
          recommendations.push('Reduce false positives by adjusting classification threshold');
        }
        if (metrics?.recall < 0.7) {
          recommendations.push('Improve recall by addressing class imbalance or feature selection');
        }
      }
    } else if (problem_type === 'Regression') {
      const r2 = metrics?.r2_score || 0;
      
      if (r2 < 0.7) {
        recommendations.push('Consider polynomial features or interaction terms');
        recommendations.push('Evaluate feature scaling and outlier handling');
      }
    }

    // General recommendations
    if (selected_model?.includes('Random Forest')) {
      recommendations.push('Use feature importance to identify key predictors');
    }
    
    recommendations.push('Monitor model performance on new data over time');
    recommendations.push('Consider A/B testing before full deployment');

    return recommendations;
  };

  const insights = generateInsights();
  const recommendations = generateRecommendations();

  return (
    <div className="insight-cards">
      {/* Key Insights Section */}
      <div className="insights-section">
        <h3><Lightbulb size={ICON_SIZES.LARGE} style={{ marginRight: '8px' }} />Key Insights</h3>
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <insight.IconComponent size={ICON_SIZES.MEDIUM} />
                <span className="insight-title">{insight.title}</span>
              </div>
              <p className="insight-message">{insight.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="recommendations-section">
        <h3><Rocket size={ICON_SIZES.LARGE} style={{ marginRight: '8px' }} />Recommendations</h3>
        <div className="recommendations-list">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-item">
              <ChevronRight size={ICON_SIZES.SMALL} className="recommendation-bullet" />
              <span className="recommendation-text">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Training Summary */}
      {training_summary && (
        <div className="training-summary-section">
          <h3><FileText size={ICON_SIZES.LARGE} style={{ marginRight: '8px' }} />Training Summary</h3>
          <div className="training-summary">
            <p>{training_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightCards;