from sqlalchemy import Column, String, Integer, DateTime, Text, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import hashlib

Base = declarative_base()

class Dataset(Base):
    __tablename__ = 'datasets'
    
    # Identity
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    content_hash = Column(String(64), unique=True, nullable=False)  # SHA-256 of file content
    
    # Metadata
    rows = Column(Integer)
    columns = Column(Integer)
    size_bytes = Column(Integer)
    quality_score = Column(Float)  # 0-100
    
    # Governance
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String(100))  # User ID
    data_classification = Column(String(50))  # public, internal, confidential
    retention_days = Column(Integer, default=365)
    
    # Relationships
    training_runs = relationship("TrainingRun", back_populates="dataset")

class TrainingRun(Base):
    __tablename__ = 'training_runs'
    
    # Identity
    id = Column(String(36), primary_key=True)  # UUID
    dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)
    
    # Configuration (for reproducibility)
    target_column = Column(String(100))
    feature_columns = Column(JSON)  # List of feature column names
    algorithm = Column(String(100))
    hyperparameters = Column(JSON)
    random_seed = Column(Integer)
    
    # Execution tracking
    status = Column(String(20), default='PENDING')
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Float)
    
    # Results
    metrics = Column(JSON)  # accuracy, precision, recall, etc.
    cross_validation_scores = Column(JSON)
    feature_importance = Column(JSON)
    
    # Governance
    created_by = Column(String(100))
    experiment_name = Column(String(200))
    tags = Column(JSON)  # For categorization
    
    # Relationships
    dataset = relationship("Dataset", back_populates="training_runs")
    models = relationship("Model", back_populates="training_run")
    decisions = relationship("Decision", back_populates="training_run")

class Model(Base):
    __tablename__ = 'models'
    
    # Identity
    id = Column(Integer, primary_key=True)
    training_run_id = Column(String(36), ForeignKey('training_runs.id'), nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)  # semantic versioning
    
    # Storage
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64))  # SHA-256 of model file
    size_bytes = Column(Integer)
    
    # Performance
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    
    # Lifecycle
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    deployed_at = Column(DateTime)
    retired_at = Column(DateTime)
    
    # Governance
    approved_by = Column(String(100))
    approval_date = Column(DateTime)
    compliance_status = Column(String(50))  # pending, approved, rejected
    
    # Relationships
    training_run = relationship("TrainingRun", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")

class Decision(Base):
    __tablename__ = 'decisions'
    
    # Identity
    id = Column(Integer, primary_key=True)
    training_run_id = Column(String(36), ForeignKey('training_runs.id'), nullable=False)
    
    # Decision context
    decision_type = Column(String(100))  # algorithm_selection, feature_selection, etc.
    decision_point = Column(String(200))  # What was being decided
    options_considered = Column(JSON)  # List of alternatives
    chosen_option = Column(String(200))
    
    # Reasoning
    reasoning = Column(Text)
    confidence_score = Column(Float)  # 0-1
    automated = Column(Boolean, default=True)  # True if ML-driven, False if human
    
    # Context
    data_characteristics = Column(JSON)  # Dataset stats that influenced decision
    performance_impact = Column(JSON)  # Expected/actual impact on metrics
    
    # Audit
    decided_at = Column(DateTime, default=datetime.utcnow)
    decided_by = Column(String(100))  # system or user ID
    
    # Relationships
    training_run = relationship("TrainingRun", back_populates="decisions")

class Prediction(Base):
    __tablename__ = 'predictions'
    
    # Identity
    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey('models.id'), nullable=False)
    
    # Input/Output
    input_hash = Column(String(64))  # Hash of input features
    input_features = Column(JSON)
    prediction = Column(String(500))
    confidence = Column(Float)
    
    # Audit
    predicted_at = Column(DateTime, default=datetime.utcnow)
    request_id = Column(String(36))  # For tracing
    user_id = Column(String(100))
    
    # Feedback (for model improvement)
    actual_outcome = Column(String(500))  # Ground truth if available
    feedback_received_at = Column(DateTime)
    
    # Relationships
    model = relationship("Model", back_populates="predictions")