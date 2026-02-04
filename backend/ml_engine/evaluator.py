from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    r2_score, mean_squared_error, mean_absolute_error
)
import numpy as np

class ModelEvaluator:
    """Evaluates model performance and generates metrics"""
    
    def evaluate_model(self, model, X_test, y_test, problem_type):
        """
        Evaluate trained model and return appropriate metrics
        
        Args:
            model: Trained sklearn model
            X_test: Test features
            y_test: Test targets
            problem_type (str): Type of ML problem
            
        Returns:
            dict: Evaluation metrics and summary
        """
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Get metrics based on problem type
        if problem_type in ['Binary Classification', 'Multiclass Classification']:
            metrics = self._evaluate_classification(y_test, y_pred, problem_type)
        elif problem_type == 'Regression':
            metrics = self._evaluate_regression(y_test, y_pred)
        elif problem_type == 'Time Series':
            metrics = self._evaluate_time_series(y_test, y_pred)
        else:
            metrics = {'error': f'Unsupported problem type: {problem_type}'}
        
        # Add general metrics
        metrics['test_samples'] = len(y_test)
        metrics['problem_type'] = problem_type
        
        return metrics
    
    def _evaluate_classification(self, y_true, y_pred, problem_type):
        """Evaluate classification models"""
        
        # Determine averaging strategy
        average = 'binary' if problem_type == 'Binary Classification' else 'weighted'
        
        metrics = {
            'accuracy': round(accuracy_score(y_true, y_pred), 4),
            'precision': round(precision_score(y_true, y_pred, average=average, zero_division=0), 4),
            'recall': round(recall_score(y_true, y_pred, average=average, zero_division=0), 4),
            'f1_score': round(f1_score(y_true, y_pred, average=average, zero_division=0), 4)
        }
        
        # Add classification-specific info
        unique_classes = len(np.unique(y_true))
        metrics['num_classes'] = unique_classes
        metrics['class_distribution'] = {
            str(cls): int(count) for cls, count in zip(*np.unique(y_true, return_counts=True))
        }
        
        return metrics
    
    def _evaluate_regression(self, y_true, y_pred):
        """Evaluate regression models"""
        
        metrics = {
            'r2_score': round(r2_score(y_true, y_pred), 4),
            'mean_squared_error': round(mean_squared_error(y_true, y_pred), 4),
            'root_mean_squared_error': round(np.sqrt(mean_squared_error(y_true, y_pred)), 4),
            'mean_absolute_error': round(mean_absolute_error(y_true, y_pred), 4)
        }
        
        # Add regression-specific info
        metrics['target_range'] = {
            'min': round(float(np.min(y_true)), 4),
            'max': round(float(np.max(y_true)), 4),
            'mean': round(float(np.mean(y_true)), 4)
        }
        
        return metrics
    
    def _evaluate_time_series(self, y_true, y_pred):
        """Evaluate time series models (placeholder)"""
        
        # Placeholder metrics for time series
        # In a real implementation, you'd use time series specific metrics
        metrics = {
            'mae': round(mean_absolute_error(y_true, y_pred), 4),
            'rmse': round(np.sqrt(mean_squared_error(y_true, y_pred)), 4),
            'note': 'Time series evaluation is simplified - specialized metrics needed'
        }
        
        return metrics
    
    def generate_performance_summary(self, metrics, problem_type):
        """Generate human-readable performance summary"""
        
        if problem_type in ['Binary Classification', 'Multiclass Classification']:
            accuracy = metrics.get('accuracy', 0)
            if accuracy >= 0.9:
                performance = "Excellent"
            elif accuracy >= 0.8:
                performance = "Good"
            elif accuracy >= 0.7:
                performance = "Fair"
            else:
                performance = "Needs Improvement"
            
            summary = f"{performance} performance with {accuracy:.1%} accuracy. "
            summary += f"F1-score: {metrics.get('f1_score', 0):.3f}, "
            summary += f"Precision: {metrics.get('precision', 0):.3f}, "
            summary += f"Recall: {metrics.get('recall', 0):.3f}."
            
        elif problem_type == 'Regression':
            r2 = metrics.get('r2_score', 0)
            if r2 >= 0.9:
                performance = "Excellent"
            elif r2 >= 0.7:
                performance = "Good"
            elif r2 >= 0.5:
                performance = "Fair"
            else:
                performance = "Needs Improvement"
            
            summary = f"{performance} performance with R² = {r2:.3f}. "
            summary += f"RMSE: {metrics.get('root_mean_squared_error', 0):.3f}, "
            summary += f"MAE: {metrics.get('mean_absolute_error', 0):.3f}."
            
        else:
            summary = f"Model trained for {problem_type}. Specialized evaluation metrics applied."
        
        return summary