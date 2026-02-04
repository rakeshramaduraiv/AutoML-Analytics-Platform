from sqlalchemy import Column, String, Integer, DateTime, Text, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class JobStatus(enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class MLJob(Base):
    __tablename__ = 'ml_jobs'
    
    # Core identification
    id = Column(String(36), primary_key=True)
    filename = Column(String(255), nullable=False)
    job_type = Column(String(50), default='ml_training')
    
    # Status tracking
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    progress = Column(Integer, default=0)  # 0-100
    stage = Column(String(100))  # Current processing stage
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Configuration and results
    config = Column(Text)  # JSON config
    result = Column(Text)  # JSON result
    model_path = Column(String(500))
    error_message = Column(Text)
    
    # Performance metrics
    duration_seconds = Column(Float)
    memory_peak_mb = Column(Float)
    
    # Priority and retry
    priority = Column(String(20), default='normal')
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

class JobQueue(Base):
    __tablename__ = 'job_queue'
    
    id = Column(Integer, primary_key=True)
    job_id = Column(String(36), nullable=False, index=True)
    queue_name = Column(String(50), default='default')
    priority_score = Column(Integer, default=0)  # Higher = more priority
    queued_at = Column(DateTime, default=datetime.utcnow)
    
    # For ordered processing
    sequence_number = Column(Integer, autoincrement=True)