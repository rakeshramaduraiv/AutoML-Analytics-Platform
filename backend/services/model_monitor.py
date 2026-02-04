import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List

class ModelMonitor:
    """Basic model performance and data monitoring"""
    
    def __init__(self, db_session):
        self.db_session = db_session
    
    def track_prediction(self, model_id, input_features, prediction, confidence):
        """Track prediction for monitoring"""
        prediction_record = Prediction(
            model_id=model_id,
            input_features=input_features,
            prediction=str(prediction),
            confidence=confidence,
            predicted_at=datetime.utcnow()
        )
        
        self.db_session.add(prediction_record)
        self.db_session.commit()
        
        # Simple drift check: compare recent vs baseline
        self._check_simple_drift(model_id)
    
    def _check_simple_drift(self, model_id):
        """Basic drift detection using prediction patterns"""
        # Get recent predictions (last 100)
        recent_predictions = self.db_session.query(Prediction).filter_by(
            model_id=model_id
        ).order_by(Prediction.predicted_at.desc()).limit(100).all()
        
        if len(recent_predictions) < 50:
            return  # Not enough data
        
        # Simple checks
        recent_confidences = [p.confidence for p in recent_predictions[:50]]
        older_confidences = [p.confidence for p in recent_predictions[50:]]
        
        if older_confidences:
            recent_avg = np.mean(recent_confidences)
            older_avg = np.mean(older_confidences)
            
            # Alert if confidence drops significantly
            if recent_avg < older_avg * 0.8:  # 20% drop
                self._create_drift_alert(model_id, 'confidence_drop', recent_avg)
    
    def _create_drift_alert(self, model_id, alert_type, metric_value):
        """Create simple drift alert"""
        print(f"DRIFT ALERT: Model {model_id} - {alert_type}: {metric_value}")
        
        # Store alert in database
        alert = DriftAlert(
            model_id=model_id,
            alert_type=alert_type,
            metric_value=metric_value,
            created_at=datetime.utcnow()
        )
        
        self.db_session.add(alert)
        self.db_session.commit()
    
    def get_model_health(self, model_id, days=7):
        """Get basic model health metrics"""
        # Get predictions from last N days
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        predictions = self.db_session.query(Prediction).filter(
            Prediction.model_id == model_id,
            Prediction.predicted_at >= cutoff_date
        ).all()
        
        if not predictions:
            return {'status': 'no_data'}
        
        confidences = [p.confidence for p in predictions]
        
        return {
            'model_id': model_id,
            'prediction_count': len(predictions),
            'avg_confidence': np.mean(confidences),
            'min_confidence': min(confidences),
            'max_confidence': max(confidences),
            'health_status': 'healthy' if np.mean(confidences) > 0.7 else 'warning'
        }