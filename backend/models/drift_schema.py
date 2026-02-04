from sqlalchemy import Column, String, Integer, DateTime, Text, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class ModelBaseline(Base):
    __tablename__ = 'model_baselines'
    
    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey('models.id'), nullable=False)
    
    # Baseline data characteristics
    feature_statistics = Column(JSON)  # Statistical summaries per feature
    prediction_statistics = Column(JSON)  # Baseline prediction patterns
    data_sample_size = Column(Integer)
    
    # Monitoring configuration
    drift_threshold = Column(Float, default=0.1)
    monitoring_enabled = Column(Boolean, default=True)
    alert_threshold = Column(Float, default=0.25)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    model = relationship("Model", backref="baseline")
    drift_detections = relationship("DriftDetection", back_populates="baseline")

class DriftDetection(Base):
    __tablename__ = 'drift_detections'
    
    id = Column(Integer, primary_key=True)
    baseline_id = Column(Integer, ForeignKey('model_baselines.id'), nullable=False)
    
    # Drift metrics
    overall_drift_score = Column(Float, nullable=False)
    drift_detected = Column(Boolean, nullable=False)
    feature_drift_details = Column(JSON)  # Per-feature drift scores
    
    # Data characteristics
    sample_size = Column(Integer)
    data_period_start = Column(DateTime)
    data_period_end = Column(DateTime)
    
    # Detection metadata
    detection_method = Column(String(50))  # 'psi', 'ks_test', 'chi_square'
    detected_at = Column(DateTime, default=datetime.utcnow)
    
    # Alert status
    alert_triggered = Column(Boolean, default=False)
    alert_sent_at = Column(DateTime)
    retraining_triggered = Column(Boolean, default=False)
    
    # Relationships
    baseline = relationship("ModelBaseline", back_populates="drift_detections")

class ModelPerformanceMetric(Base):
    __tablename__ = 'model_performance_metrics'
    
    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey('models.id'), nullable=False)
    
    # Performance tracking
    metric_name = Column(String(50))  # 'accuracy', 'precision', 'recall', 'f1'
    metric_value = Column(Float)
    baseline_value = Column(Float)  # Original training performance
    
    # Time period
    measurement_date = Column(DateTime, default=datetime.utcnow)
    data_period_start = Column(DateTime)
    data_period_end = Column(DateTime)
    sample_size = Column(Integer)
    
    # Performance drift
    performance_drift = Column(Float)  # Difference from baseline
    drift_severity = Column(String(20))  # 'low', 'medium', 'high'
    
    # Relationships
    model = relationship("Model", backref="performance_metrics")

# Add to existing Model class
class Model(Base):
    # ... existing fields ...
    
    # Monitoring status
    monitoring_enabled = Column(Boolean, default=False)
    last_drift_check = Column(DateTime)
    drift_status = Column(String(20), default='stable')  # 'stable', 'warning', 'critical'