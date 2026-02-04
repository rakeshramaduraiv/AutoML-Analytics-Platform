from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/api/jobs', methods=['POST'])
def submit_job():
    """Submit ML training job"""
    data = request.get_json()
    
    job_id = str(uuid.uuid4())
    job_data = {
        'filename': data['filename'],
        'config': data.get('config', {}),
        'priority': data.get('priority', 'normal')
    }
    
    # Create job in database
    job = job_manager.create_job(job_id, job_data)
    
    return jsonify({
        'job_id': job_id,
        'status': 'PENDING',
        'created_at': job.created_at.isoformat(),
        'estimated_duration': '5-10 minutes'
    }), 202

@jobs_bp.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get job status and results"""
    job = job_manager.get_job(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    response = {
        'job_id': job_id,
        'status': job.status,
        'progress': job.progress,
        'created_at': job.created_at.isoformat(),
        'updated_at': job.updated_at.isoformat()
    }
    
    if job.status == 'COMPLETED':
        response['result'] = job.result
        response['model_path'] = job.model_path
    elif job.status == 'FAILED':
        response['error'] = job.error_message
    
    return jsonify(response)

@jobs_bp.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List jobs with optional status filter"""
    status = request.args.get('status')
    limit = int(request.args.get('limit', 50))
    
    jobs = job_manager.list_jobs(status=status, limit=limit)
    
    return jsonify({
        'jobs': [{
            'job_id': job.id,
            'status': job.status,
            'progress': job.progress,
            'created_at': job.created_at.isoformat()
        } for job in jobs]
    })

@jobs_bp.route('/api/jobs/<job_id>', methods=['DELETE'])
def cancel_job(job_id):
    """Cancel pending job"""
    success = job_manager.cancel_job(job_id)
    
    if not success:
        return jsonify({'error': 'Cannot cancel job'}), 400
    
    return jsonify({'message': 'Job cancelled'})