from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Dataset(db.Model):
    __tablename__ = 'dataset'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False, index=True)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    rows = db.Column(db.Integer)
    columns = db.Column(db.Integer)
    file_size = db.Column(db.Integer)
    status = db.Column(db.String(50), default='uploaded', nullable=False)
    
    def __repr__(self):
        return f'<Dataset {self.filename}>'

class TrainingRun(db.Model):
    __tablename__ = 'training_run'
    
    id = db.Column(db.Integer, primary_key=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey('dataset.id'), nullable=False)
    model_name = db.Column(db.String(255), nullable=False, index=True)
    algorithm = db.Column(db.String(100))
    accuracy = db.Column(db.Float)
    training_time = db.Column(db.Float)
    status = db.Column(db.String(50), default='pending', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime)
    
    dataset = db.relationship('Dataset', backref=db.backref('training_runs', lazy=True))
    
    def __repr__(self):
        return f'<TrainingRun {self.model_name}>'
    
class PredictionJob(db.Model):
    __tablename__ = 'prediction_job'
    
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(255), nullable=False, index=True)
    input_data = db.Column(db.Text)
    prediction = db.Column(db.Text)
    confidence = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<PredictionJob {self.id}>'