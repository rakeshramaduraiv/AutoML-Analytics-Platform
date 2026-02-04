from flask import Blueprint, request, jsonify
from monitoring.drift_detection import DriftMonitor
from models.drift_schema import ModelBaseline, DriftDetection
import pandas as pd

drift_bp = Blueprint('drift', __name__)

@drift_bp.route('/api/models/<int:model_id>/monitoring/enable', methods=['POST'])
def enable_drift_monitoring(model_id):
    """Enable drift monitoring for a model"""
    data = request.get_json()
    
    # Load baseline data (from training set or specified dataset)
    baseline_file = data.get('baseline_file')
    feature_columns = data.get('feature_columns')
    drift_threshold = data.get('drift_threshold', 0.1)
    
    if not baseline_file or not feature_columns:
        return jsonify({'error': 'baseline_file and feature_columns required'}), 400
    
    # Load baseline data
    baseline_data = pd.read_csv(f'uploads/{baseline_file}')
    
    # Initialize drift monitor
    drift_monitor = DriftMonitor(db_session)
    drift_monitor.register_model_for_monitoring(
        model_id=model_id,
        baseline_data=baseline_data,
        feature_columns=feature_columns
    )
    
    return jsonify({
        'message': 'Drift monitoring enabled',
        'model_id': model_id,
        'baseline_samples': len(baseline_data),
        'monitored_features': len(feature_columns),
        'drift_threshold': drift_threshold
    })

@drift_bp.route('/api/models/<int:model_id>/drift/check', methods=['POST'])
def check_model_drift(model_id):
    """Check for drift in current data"""
    data = request.get_json()
    
    # Get current data for comparison
    current_file = data.get('current_file')
    if not current_file:
        return jsonify({'error': 'current_file required'}), 400
    
    current_data = pd.read_csv(f'uploads/{current_file}')
    
    # Run drift detection
    drift_monitor = DriftMonitor(db_session)
    drift_results = drift_monitor.check_drift(model_id, current_data)
    
    return jsonify(drift_results)

@drift_bp.route('/api/models/<int:model_id>/drift/history', methods=['GET'])
def get_drift_history(model_id):
    """Get drift detection history for a model"""
    days = request.args.get('days', 30, type=int)
    
    # Query drift history from database
    drift_history = db_session.query(DriftDetection).join(ModelBaseline).filter(
        ModelBaseline.model_id == model_id
    ).order_by(DriftDetection.detected_at.desc()).limit(100).all()
    
    history_data = [{
        'detected_at': detection.detected_at.isoformat(),
        'drift_score': detection.overall_drift_score,
        'drift_detected': detection.drift_detected,
        'alert_triggered': detection.alert_triggered,
        'sample_size': detection.sample_size
    } for detection in drift_history]
    
    return jsonify({
        'model_id': model_id,
        'drift_history': history_data,
        'total_checks': len(history_data)
    })

@drift_bp.route('/api/drift/dashboard', methods=['GET'])
def drift_dashboard():
    """Get drift monitoring dashboard data"""
    # Get all models with monitoring enabled
    monitored_models = db_session.query(ModelBaseline).filter_by(
        monitoring_enabled=True
    ).all()
    
    dashboard_data = []
    
    for baseline in monitored_models:
        # Get latest drift detection
        latest_drift = db_session.query(DriftDetection).filter_by(
            baseline_id=baseline.id
        ).order_by(DriftDetection.detected_at.desc()).first()
        
        model_status = {
            'model_id': baseline.model_id,
            'model_name': baseline.model.name if baseline.model else f'Model {baseline.model_id}',
            'monitoring_enabled': baseline.monitoring_enabled,
            'drift_threshold': baseline.drift_threshold,
            'last_check': latest_drift.detected_at.isoformat() if latest_drift else None,
            'current_drift_score': latest_drift.overall_drift_score if latest_drift else 0,
            'drift_status': 'critical' if latest_drift and latest_drift.overall_drift_score > 0.25 
                          else 'warning' if latest_drift and latest_drift.overall_drift_score > 0.1 
                          else 'stable'
        }
        
        dashboard_data.append(model_status)
    
    return jsonify({
        'monitored_models': dashboard_data,
        'total_models': len(dashboard_data),
        'models_with_drift': len([m for m in dashboard_data if m['drift_status'] != 'stable'])
    })

@drift_bp.route('/api/models/<int:model_id>/performance/track', methods=['POST'])
def track_model_performance(model_id):
    """Track model performance metrics over time"""
    data = request.get_json()
    
    metrics = data.get('metrics', {})  # {'accuracy': 0.85, 'precision': 0.82}
    sample_size = data.get('sample_size', 0)
    
    # Store performance metrics
    for metric_name, metric_value in metrics.items():
        performance_metric = ModelPerformanceMetric(
            model_id=model_id,
            metric_name=metric_name,
            metric_value=metric_value,
            sample_size=sample_size
        )
        db_session.add(performance_metric)
    
    db_session.commit()
    
    return jsonify({
        'message': 'Performance metrics tracked',
        'model_id': model_id,
        'metrics_count': len(metrics)
    })