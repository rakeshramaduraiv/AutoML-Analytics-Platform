from flask import Blueprint, request, jsonify
from services.ml_job_manager import MLJobManager
from services.model_monitor import ModelMonitor

api_bp = Blueprint('api', __name__)

# Initialize services
job_manager = MLJobManager(db_session)
model_monitor = ModelMonitor(db_session)

@api_bp.route('/api/train', methods=['POST'])
def train_model():
    """Submit training job"""
    data = request.get_json()
    
    job_id = job_manager.submit_training_job(
        filename=data['filename'],
        config=data.get('config', {}),
        user_id=data.get('user_id')
    )
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'status': 'PENDING',
        'message': 'Training job submitted'
    })

@api_bp.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get job status"""
    status = job_manager.get_job_status(job_id)
    
    if not status:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    
    return jsonify({'success': True, 'data': status})

@api_bp.route('/api/predict', methods=['POST'])
def predict():
    """Make prediction with monitoring"""
    data = request.get_json()
    
    # Make prediction (simplified)
    prediction = 'positive'  # Replace with actual model inference
    confidence = 0.85
    
    # Track for monitoring
    model_monitor.track_prediction(
        model_id=data['model_id'],
        input_features=data['features'],
        prediction=prediction,
        confidence=confidence
    )
    
    return jsonify({
        'success': True,
        'data': {
            'prediction': prediction,
            'confidence': confidence
        }
    })

@api_bp.route('/api/models/<int:model_id>/health', methods=['GET'])
def get_model_health(model_id):
    """Get model health status"""
    health = model_monitor.get_model_health(model_id)
    
    return jsonify({
        'success': True,
        'data': health
    })