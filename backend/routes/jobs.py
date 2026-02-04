"""
Job Management API Endpoints
Provides async job status and management
"""

from flask import Blueprint, request, jsonify
from job_manager.async_trainer import job_queue, async_trainer, JobStatus
from dataclasses import asdict

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/api/jobs', methods=['POST'])
def create_job():
    """Create new ML training job"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        config = data.get('config', {})
        
        if not filename:
            return jsonify({'error': 'filename required'}), 400
        
        # Start worker if not running
        async_trainer.start_worker()
        
        job_id = async_trainer.submit_training_job(filename, config)
        
        return jsonify({
            'job_id': job_id,
            'status': 'PENDING',
            'message': 'Job queued successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/api/jobs/<job_id>/status', methods=['GET'])
def get_job_status(job_id):
    """Get job status by ID"""
    job = job_queue.get_job(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify({
        'job_id': job.job_id,
        'status': job.status.value,
        'progress': job.progress,
        'stage': job.stage,
        'created_at': job.created_at,
        'started_at': job.started_at,
        'completed_at': job.completed_at,
        'result_data': job.result_data,
        'error_message': job.error_message
    })

@jobs_bp.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all jobs with optional status filter"""
    status_filter = request.args.get('status')
    
    try:
        if status_filter:
            status_enum = JobStatus(status_filter.upper())
            jobs = job_queue.list_jobs(status_enum)
        else:
            jobs = job_queue.list_jobs()
        
        return jsonify({
            'jobs': [
                {
                    'job_id': job.job_id,
                    'status': job.status.value,
                    'progress': job.progress,
                    'stage': job.stage,
                    'created_at': job.created_at,
                    'completed_at': job.completed_at
                }
                for job in jobs
            ]
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid status filter'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500