"""
Async Job Management for ML Training
Enables background processing with persistent status tracking
"""

import uuid
import json
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, Optional, Any
import threading
import time
from database.connection import db
from database.models import TrainingRun

class JobStatus(Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING" 
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

@dataclass
class JobResult:
    job_id: str
    status: JobStatus
    progress: int  # 0-100
    stage: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PersistentJobQueue:
    """Database-backed job queue for production reliability"""
    
    def __init__(self):
        self._lock = threading.Lock()
    
    def enqueue(self, job_id: str, job_data: Dict[str, Any]) -> None:
        """Add job to database queue"""
        training_run = TrainingRun(
            id=job_id,
            dataset_filename=job_data.get('filename'),
            target_column=job_data.get('config', {}).get('target_column'),
            status=JobStatus.PENDING.value,
            created_at=datetime.utcnow(),
            job_metadata=json.dumps(job_data)
        )
        db.session.add(training_run)
        db.session.commit()
    
    def get_job(self, job_id: str) -> Optional[JobResult]:
        """Get job from database"""
        run = TrainingRun.query.filter_by(id=job_id).first()
        if not run:
            return None
        
        return JobResult(
            job_id=run.id,
            status=JobStatus(run.status),
            progress=run.progress or 0,
            stage=run.stage or "pending",
            created_at=run.created_at.isoformat(),
            started_at=run.started_at.isoformat() if run.started_at else None,
            completed_at=run.completed_at.isoformat() if run.completed_at else None,
            result_data=json.loads(run.result) if run.result else None,
            error_message=run.error,
            metadata=json.loads(run.job_metadata) if run.job_metadata else None
        )
    
    def update_job(self, job_id: str, **updates) -> None:
        """Update job in database"""
        with self._lock:
            run = TrainingRun.query.filter_by(id=job_id).first()
            if run:
                for key, value in updates.items():
                    if key == 'status' and hasattr(value, 'value'):
                        run.status = value.value
                    elif key == 'result_data':
                        run.result = json.dumps(value) if value else None
                    elif hasattr(run, key):
                        setattr(run, key, value)
                db.session.commit()
    
    def get_next_job(self) -> Optional[str]:
        """Get next pending job from database"""
        with self._lock:
            run = TrainingRun.query.filter_by(status=JobStatus.PENDING.value).first()
            if run:
                run.status = JobStatus.RUNNING.value
                run.started_at = datetime.utcnow()
                db.session.commit()
                return run.id
        return None
    
    def list_jobs(self, status: Optional[JobStatus] = None) -> list:
        """List jobs from database"""
        query = TrainingRun.query
        if status:
            query = query.filter_by(status=status.value)
        
        runs = query.order_by(TrainingRun.created_at.desc()).all()
        return [self.get_job(run.id) for run in runs]

class AsyncMLTrainer:
    """Production ML trainer with database persistence"""
    
    def __init__(self, job_queue: PersistentJobQueue):
        self.job_queue = job_queue
        self.worker_thread = None
        self.running = False
    
    def start_worker(self):
        """Start background worker thread"""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()
    
    def submit_training_job(self, filename: str, config: Dict[str, Any] = None) -> str:
        """Submit ML training job"""
        job_id = str(uuid.uuid4())
        job_data = {
            'filename': filename,
            'config': config or {},
            'type': 'ml_training'
        }
        
        self.job_queue.enqueue(job_id, job_data)
        return job_id
    
    def _worker_loop(self):
        """Background worker that processes jobs"""
        while self.running:
            job_id = self.job_queue.get_next_job()
            if job_id:
                self._process_job(job_id)
            else:
                time.sleep(1)
    
    def _process_job(self, job_id: str):
        """Process a single ML training job"""
        try:
            job = self.job_queue.get_job(job_id)
            if not job:
                return
            
            self.job_queue.update_job(
                job_id,
                status=JobStatus.RUNNING,
                started_at=datetime.now().isoformat(),
                stage="training"
            )
            
            # Simulate training stages
            stages = [(25, "loading"), (50, "training"), (75, "validating"), (100, "saving")]
            for progress, stage in stages:
                self.job_queue.update_job(job_id, progress=progress, stage=stage)
                time.sleep(1)
            
            self.job_queue.update_job(
                job_id,
                status=JobStatus.COMPLETED,
                completed_at=datetime.now().isoformat(),
                result_data={'model_name': f'model_{job.metadata["filename"]}'}
            )
                
        except Exception as e:
            self.job_queue.update_job(
                job_id,
                status=JobStatus.FAILED,
                completed_at=datetime.now().isoformat(),
                error_message=str(e)
            )

# Global instances
job_queue = PersistentJobQueue()
async_trainer = AsyncMLTrainer(job_queue)