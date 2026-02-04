from flask import Blueprint, request
from middleware.validation import validate_json
from middleware.error_handling import with_error_handling, ValidationError, ProcessingError
from middleware.rate_limiting import rate_limit
from utils.api_response import APIResponse
from utils.resource_manager import resource_manager
from monitoring.metrics import metrics
import os

train_bp = Blueprint('train', __name__)

@train_bp.route('/api/v1/train', methods=['POST'])
@rate_limit(requests_per_minute=10)
@validate_json(required_fields=['filename'])
@with_error_handling
def train_model():
    """Submit ML training job with production safeguards"""
    data = request.get_json()
    filename = data['filename']
    
    # Resource checks
    memory_usage = resource_manager.check_memory_usage()
    
    # File validation
    file_path = os.path.join('uploads', filename)
    if not os.path.exists(file_path):
        raise ValidationError(f"File not found: {filename}", 'filename')
    
    file_size = os.path.getsize(file_path)
    if file_size > 100 * 1024 * 1024:  # 100MB
        raise ProcessingError("File exceeds size limit")
    
    # Submit job (simplified for production patterns demo)
    job_id = f"job_{filename}_{int(time.time())}"
    
    # Metrics
    metrics.increment('training_jobs_submitted')
    metrics.gauge('memory_usage_mb', memory_usage)
    
    return APIResponse.job_status(job_id, 'PENDING')

@train_bp.route('/api/v1/train/<job_id>/status', methods=['GET'])
@with_error_handling
def get_job_status(job_id):
    """Get training job status"""
    # In production, query from database
    return APIResponse.job_status(job_id, 'RUNNING', progress=50)