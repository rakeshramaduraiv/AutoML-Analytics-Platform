import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json

class DriftDetector:
    """Statistical drift detection for ML models"""
    
    def __init__(self, model_id: int, baseline_data: pd.DataFrame, 
                 feature_columns: List[str], target_column: str = None):
        self.model_id = model_id
        self.baseline_data = baseline_data
        self.feature_columns = feature_columns
        self.target_column = target_column
        self.baseline_stats = self._calculate_baseline_stats()
    
    def _calculate_baseline_stats(self) -> Dict:
        """Calculate baseline statistics for drift comparison"""
        stats = {}
        
        for col in self.feature_columns:
            if self.baseline_data[col].dtype in ['int64', 'float64']:
                stats[col] = {
                    'type': 'numerical',
                    'mean': float(self.baseline_data[col].mean()),
                    'std': float(self.baseline_data[col].std()),
                    'min': float(self.baseline_data[col].min()),
                    'max': float(self.baseline_data[col].max()),
                    'percentiles': self.baseline_data[col].quantile([0.25, 0.5, 0.75]).to_dict()
                }
            else:
                value_counts = self.baseline_data[col].value_counts(normalize=True)
                stats[col] = {
                    'type': 'categorical',
                    'distribution': value_counts.to_dict(),
                    'unique_count': len(value_counts)
                }
        
        return stats
    
    def detect_feature_drift(self, current_data: pd.DataFrame, 
                           threshold: float = 0.1) -> Dict:
        """Detect drift in input features using PSI and KS test"""
        drift_results = {
            'drift_detected': False,
            'drift_score': 0.0,
            'feature_drifts': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        total_drift_score = 0.0
        
        for col in self.feature_columns:
            if col not in current_data.columns:
                continue
                
            baseline_stats = self.baseline_stats[col]
            
            if baseline_stats['type'] == 'numerical':
                # Use Kolmogorov-Smirnov test for numerical features
                ks_stat, p_value = stats.ks_2samp(
                    self.baseline_data[col].dropna(),
                    current_data[col].dropna()
                )
                
                drift_score = ks_stat
                is_drift = p_value < 0.05  # 95% confidence
                
            else:
                # Use Population Stability Index for categorical features
                psi_score = self._calculate_psi(
                    baseline_stats['distribution'],
                    current_data[col].value_counts(normalize=True).to_dict()
                )
                
                drift_score = psi_score
                is_drift = psi_score > threshold
            
            drift_results['feature_drifts'][col] = {
                'drift_score': float(drift_score),
                'drift_detected': is_drift,
                'severity': self._get_drift_severity(drift_score)
            }
            
            total_drift_score += drift_score
        
        # Overall drift assessment
        avg_drift_score = total_drift_score / len(self.feature_columns)
        drift_results['drift_score'] = float(avg_drift_score)
        drift_results['drift_detected'] = avg_drift_score > threshold
        
        return drift_results
    
    def detect_prediction_drift(self, current_predictions: List[float],
                              baseline_predictions: List[float] = None) -> Dict:
        """Detect drift in prediction distributions"""
        if baseline_predictions is None:
            # Use stored baseline if available
            baseline_predictions = getattr(self, 'baseline_predictions', [])
        
        if not baseline_predictions:
            return {'error': 'No baseline predictions available'}
        
        # Compare prediction distributions
        ks_stat, p_value = stats.ks_2samp(baseline_predictions, current_predictions)
        
        # Calculate prediction stability metrics
        baseline_mean = np.mean(baseline_predictions)
        current_mean = np.mean(current_predictions)
        mean_shift = abs(current_mean - baseline_mean) / baseline_mean if baseline_mean != 0 else 0
        
        return {
            'prediction_drift_detected': p_value < 0.05,
            'ks_statistic': float(ks_stat),
            'p_value': float(p_value),
            'mean_shift': float(mean_shift),
            'baseline_mean': float(baseline_mean),
            'current_mean': float(current_mean),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _calculate_psi(self, baseline_dist: Dict, current_dist: Dict) -> float:
        """Calculate Population Stability Index"""
        psi = 0.0
        
        all_categories = set(baseline_dist.keys()) | set(current_dist.keys())
        
        for category in all_categories:
            baseline_pct = baseline_dist.get(category, 0.001)  # Small value to avoid log(0)
            current_pct = current_dist.get(category, 0.001)
            
            psi += (current_pct - baseline_pct) * np.log(current_pct / baseline_pct)
        
        return psi
    
    def _get_drift_severity(self, drift_score: float) -> str:
        """Categorize drift severity"""
        if drift_score < 0.1:
            return 'low'
        elif drift_score < 0.25:
            return 'medium'
        else:
            return 'high'

class DriftMonitor:
    """Orchestrates drift detection and alerting"""
    
    def __init__(self, db_session):
        self.db_session = db_session
        self.detectors = {}  # model_id -> DriftDetector
    
    def register_model_for_monitoring(self, model_id: int, baseline_data: pd.DataFrame,
                                    feature_columns: List[str], target_column: str = None):
        """Register a model for drift monitoring"""
        detector = DriftDetector(model_id, baseline_data, feature_columns, target_column)
        self.detectors[model_id] = detector
        
        # Store baseline in database
        self._store_baseline_stats(model_id, detector.baseline_stats)
    
    def check_drift(self, model_id: int, current_data: pd.DataFrame) -> Dict:
        """Check for drift and store results"""
        if model_id not in self.detectors:
            return {'error': 'Model not registered for monitoring'}
        
        detector = self.detectors[model_id]
        drift_results = detector.detect_feature_drift(current_data)
        
        # Store drift results
        self._store_drift_results(model_id, drift_results)
        
        # Trigger alerts if drift detected
        if drift_results['drift_detected']:
            self._trigger_drift_alert(model_id, drift_results)
        
        return drift_results
    
    def _store_baseline_stats(self, model_id: int, baseline_stats: Dict):
        """Store baseline statistics in database"""
        # Implementation would store in ModelBaseline table
        pass
    
    def _store_drift_results(self, model_id: int, drift_results: Dict):
        """Store drift detection results"""
        # Implementation would store in DriftDetection table
        pass
    
    def _trigger_drift_alert(self, model_id: int, drift_results: Dict):
        """Trigger drift alert (email, Slack, etc.)"""
        alert_message = f"Drift detected for model {model_id}. Score: {drift_results['drift_score']:.3f}"
        print(f"DRIFT ALERT: {alert_message}")  # Replace with actual alerting
        
        # Could trigger automatic retraining
        if drift_results['drift_score'] > 0.3:  # High drift threshold
            self._trigger_retraining(model_id)
    
    def _trigger_retraining(self, model_id: int):
        """Trigger automatic model retraining"""
        print(f"Triggering retraining for model {model_id}")
        # Integration with existing job manager