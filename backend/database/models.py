"""
Database Schema for AutoML Platform
Replaces in-memory tracking with persistent storage
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

Base = declarative_base()

class Dataset(Base):
    __tablename__ = 'datasets'
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False)
    rows = Column(Integer)
    columns = Column(Integer)
    quality_score = Column(Float)
    processing_level = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(Text)

class TrainingRun(Base):
    __tablename__ = 'training_runs'
    
    id = Column(String(36), primary_key=True)  # Use job_id as primary key
    dataset_filename = Column(String(255), nullable=False)
    target_column = Column(String(100))
    status = Column(String(20), nullable=False, default='PENDING')
    progress = Column(Integer, default=0)
    stage = Column(String(50), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    result = Column(Text)  # JSON string
    error = Column(Text)
    job_metadata = Column('metadata_json', Text)  # JSON string

class Model(Base):
    __tablename__ = 'models'
    
    id = Column(Integer, primary_key=True)
    model_name = Column(String(255), nullable=False)
    model_version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    accuracy = Column(Float)
    file_path = Column(String(500), nullable=False)
    target_column = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class DatabaseManager:
    """Database operations manager"""
    
    def __init__(self, database_url: str = "sqlite:///automl.db"):
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self):
        return self.SessionLocal()
    
    def create_dataset(self, filename: str, file_hash: str, metadata: dict):
        session = self.get_session()
        try:
            dataset = Dataset(
                filename=filename,
                file_hash=file_hash,
                rows=metadata.get('rows'),
                columns=metadata.get('columns'),
                quality_score=metadata.get('quality_score'),
                processing_level=metadata.get('processing_level'),
                metadata_json=json.dumps(metadata)
            )
            session.add(dataset)
            session.commit()
            return dataset.id
        finally:
            session.close()
    
    def create_training_run(self, job_id: str, dataset_id: int):
        session = self.get_session()
        try:
            training_run = TrainingRun(
                job_id=job_id,
                dataset_id=dataset_id,
                status='PENDING'
            )
            session.add(training_run)
            session.commit()
            return training_run.id
        finally:
            session.close()
    
    def update_training_run(self, job_id: str, **updates):
        session = self.get_session()
        try:
            training_run = session.query(TrainingRun).filter_by(job_id=job_id).first()
            if training_run:
                for key, value in updates.items():
                    if hasattr(training_run, key):
                        setattr(training_run, key, value)
                session.commit()
        finally:
            session.close()

db_manager = DatabaseManager()