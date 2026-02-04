from sqlalchemy.orm import sessionmaker
from datetime import datetime
import threading
import uuid
import json

class MLJobManager:
    """Unified job management for ML training and monitoring"""
    
    def __init__(self, db_session):
        self.db_session = db_session
        self.worker_thread = None
        self.running = False
    
    def submit_training_job(self, filename, config=None, user_id=None):
        """Submit ML training job with governance tracking"""
        job_id = str(uuid.uuid4())
        
        # Create job record
        job = MLJob(
            id=job_id,
            filename=filename,
            job_type='training',
            config=json.dumps(config or {}),
            status='PENDING',
            created_by=user_id
        )
        
        self.db_session.add(job)
        self.db_session.commit()
        
        return job_id
    
    def get_job_status(self, job_id):
        """Get current job status"""
        job = self.db_session.query(MLJob).filter_by(id=job_id).first()
        if not job:
            return None
        
        return {
            'job_id': job_id,
            'status': job.status,
            'progress': job.progress,
            'created_at': job.created_at.isoformat(),
            'result': json.loads(job.result) if job.result else None
        }
    
    def start_worker(self):
        """Start background job processor"""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._process_jobs, daemon=True)
            self.worker_thread.start()
    
    def _process_jobs(self):
        """Background job processing loop"""
        while self.running:
            # Get next pending job
            job = self.db_session.query(MLJob).filter_by(status='PENDING').first()
            
            if job:
                self._execute_job(job)
            else:
                time.sleep(5)
    
    def _execute_job(self, job):
        """Execute single ML job"""
        try:
            job.status = 'RUNNING'
            job.started_at = datetime.utcnow()
            self.db_session.commit()
            
            # Simulate ML training
            time.sleep(10)
            
            job.status = 'COMPLETED'
            job.completed_at = datetime.utcnow()
            job.result = json.dumps({'accuracy': 0.87, 'model_path': f'models/{job.id}.joblib'})
            
        except Exception as e:
            job.status = 'FAILED'
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
        
        self.db_session.commit()