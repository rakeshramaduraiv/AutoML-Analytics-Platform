import threading
import time
import json
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from models.job_models import MLJob, JobQueue, JobStatus

class AsyncJobManager:
    def __init__(self, db_session):
        self.db_session = db_session
        self.worker_thread = None
        self.running = False
        self.lock = threading.Lock()
    
    def start_worker(self):
        """Start background worker thread"""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()
    
    def create_job(self, job_id, job_data):
        """Create new ML training job"""
        job = MLJob(
            id=job_id,
            filename=job_data['filename'],
            config=json.dumps(job_data.get('config', {})),
            priority=job_data.get('priority', 'normal')
        )
        
        # Add to database
        self.db_session.add(job)
        
        # Add to queue
        queue_entry = JobQueue(
            job_id=job_id,
            priority_score=self._get_priority_score(job_data.get('priority', 'normal'))
        )
        self.db_session.add(queue_entry)
        
        self.db_session.commit()
        return job
    
    def get_job(self, job_id):
        """Get job by ID"""
        return self.db_session.query(MLJob).filter_by(id=job_id).first()
    
    def list_jobs(self, status=None, limit=50):
        """List jobs with optional filtering"""
        query = self.db_session.query(MLJob)
        
        if status:
            query = query.filter_by(status=JobStatus(status))
        
        return query.order_by(MLJob.created_at.desc()).limit(limit).all()
    
    def cancel_job(self, job_id):
        """Cancel pending job"""
        job = self.get_job(job_id)
        
        if not job or job.status not in [JobStatus.PENDING, JobStatus.RUNNING]:
            return False
        
        job.status = JobStatus.CANCELLED
        job.completed_at = datetime.utcnow()
        self.db_session.commit()
        return True
    
    def _worker_loop(self):
        """Background worker that processes jobs"""
        while self.running:
            try:
                job_id = self._get_next_job()
                if job_id:
                    self._process_job(job_id)
                else:
                    time.sleep(5)  # No jobs, wait
            except Exception as e:
                print(f"Worker error: {e}")
                time.sleep(10)
    
    def _get_next_job(self):
        """Get next job from queue"""
        with self.lock:
            # Get highest priority pending job
            queue_entry = self.db_session.query(JobQueue).join(MLJob).filter(
                MLJob.status == JobStatus.PENDING
            ).order_by(JobQueue.priority_score.desc(), JobQueue.queued_at).first()
            
            if queue_entry:
                # Mark job as running
                job = self.db_session.query(MLJob).filter_by(id=queue_entry.job_id).first()
                job.status = JobStatus.RUNNING
                job.started_at = datetime.utcnow()
                
                # Remove from queue
                self.db_session.delete(queue_entry)
                self.db_session.commit()
                
                return queue_entry.job_id
        
        return None
    
    def _process_job(self, job_id):
        """Process single ML training job"""
        job = self.get_job(job_id)
        if not job:
            return
        
        try:
            # Update progress stages
            self._update_job_progress(job_id, 10, "Loading data")
            
            # Simulate ML training steps
            config = json.loads(job.config) if job.config else {}
            
            self._update_job_progress(job_id, 30, "Preprocessing")
            time.sleep(2)  # Simulate preprocessing
            
            self._update_job_progress(job_id, 60, "Training model")
            time.sleep(5)  # Simulate training
            
            self._update_job_progress(job_id, 90, "Saving model")
            model_path = f"models/model_{job_id}.joblib"
            
            # Complete job
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.stage = "Completed"
            job.completed_at = datetime.utcnow()
            job.model_path = model_path
            job.result = json.dumps({
                'accuracy': 0.87,
                'model_type': 'RandomForest',
                'features': 10
            })
            
            self.db_session.commit()
            
        except Exception as e:
            # Mark job as failed
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            self.db_session.commit()
    
    def _update_job_progress(self, job_id, progress, stage):
        """Update job progress and stage"""
        job = self.get_job(job_id)
        if job:
            job.progress = progress
            job.stage = stage
            job.updated_at = datetime.utcnow()
            self.db_session.commit()
    
    def _get_priority_score(self, priority):
        """Convert priority to numeric score"""
        priority_map = {
            'low': 1,
            'normal': 5,
            'high': 10,
            'urgent': 20
        }
        return priority_map.get(priority, 5)

# Global job manager instance
job_manager = None

def init_job_manager(db_session):
    global job_manager
    job_manager = AsyncJobManager(db_session)
    job_manager.start_worker()
    return job_manager