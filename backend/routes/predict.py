from flask import Blueprint, request, jsonify
import pandas as pd
import os
from ml_engine.prediction_engine import ProductionPredictionEngine, PredictionRequest, PredictionMode

predict_bp = Blueprint('predict', __name__)

# Initialize prediction engine
prediction_engine = ProductionPredictionEngine()

@predict_bp.route('/api/predict', methods=['POST'])
def make_prediction():
    """Enterprise prediction endpoint with comprehensive safeguards"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract request parameters
        model_name = data.get('model_name')
        input_data = data.get('input_data')
        include_confidence = data.get('include_confidence', True)
        include_explanation = data.get('include_explanation', False)
        request_id = data.get('request_id')
        
        if not model_name:
            return jsonify({'error': 'Model name is required'}), 400
        
        if not input_data:
            return jsonify({'error': 'Input data is required'}), 400
        
        # Determine prediction mode
        if isinstance(input_data, list):
            mode = PredictionMode.BATCH
        else:
            mode = PredictionMode.SINGLE
        
        # Create prediction request
        prediction_request = PredictionRequest(
            input_data=input_data,
            model_name=model_name,
            mode=mode,
            include_confidence=include_confidence,
            include_explanation=include_explanation,
            request_id=request_id
        )
        
        # Make prediction
        result = prediction_engine.predict(prediction_request)
        
        # Build response
        response = {
            'success': result.status.value == 'success',
            'predictions': result.predictions,
            'model_used': result.model_used,
            'prediction_time': round(result.prediction_time, 4),
            'prediction_reliability': result.prediction_reliability,
            'request_id': result.request_id
        }
        
        # Add optional fields
        if result.confidence_scores is not None:
            response['confidence_scores'] = result.confidence_scores
        
        if result.feature_contributions:
            response['feature_contributions'] = result.feature_contributions
        
        if result.data_quality_score is not None:
            response['data_quality_score'] = round(result.data_quality_score, 3)
        
        if result.warnings:
            response['warnings'] = result.warnings
        
        # Handle errors
        if result.status.value != 'success':
            return jsonify(response), 400 if result.status.value == 'error' else 200
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@predict_bp.route('/api/predict/<model_name>', methods=['POST'])
def make_prediction_by_model(model_name):
    """Prediction endpoint with model name in URL"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Add model name to data
        data['model_name'] = model_name
        
        # Use the main prediction endpoint
        return make_prediction()
    
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@predict_bp.route('/api/predict/batch', methods=['POST'])
def make_batch_prediction():
    """Dedicated batch prediction endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        model_name = data.get('model_name')
        batch_data = data.get('batch_data')
        
        if not model_name:
            return jsonify({'error': 'Model name is required'}), 400
        
        if not batch_data or not isinstance(batch_data, list):
            return jsonify({'error': 'Batch data must be a list of records'}), 400
        
        # Create batch prediction request
        prediction_request = PredictionRequest(
            input_data=batch_data,
            model_name=model_name,
            mode=PredictionMode.BATCH,
            include_confidence=data.get('include_confidence', True),
            include_explanation=data.get('include_explanation', False),
            request_id=data.get('request_id')
        )
        
        # Make prediction
        result = prediction_engine.predict(prediction_request)
        
        # Build response with batch-specific formatting
        response = {
            'success': result.status.value == 'success',
            'batch_size': len(batch_data),
            'predictions': result.predictions,
            'model_used': result.model_used,
            'prediction_time': round(result.prediction_time, 4),
            'average_confidence': None,
            'prediction_reliability': result.prediction_reliability,
            'request_id': result.request_id
        }
        
        # Calculate average confidence for batch
        if result.confidence_scores and isinstance(result.confidence_scores, list):
            response['average_confidence'] = round(sum(result.confidence_scores) / len(result.confidence_scores), 3)
            response['confidence_scores'] = result.confidence_scores
        
        if result.warnings:
            response['warnings'] = result.warnings
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': f'Batch prediction failed: {str(e)}'}), 500

@predict_bp.route('/api/models/<model_name>/info', methods=['GET'])
def get_model_info(model_name):
    """Get information about a specific model"""
    try:
        model_info = prediction_engine.get_model_info(model_name)
        
        if not model_info:
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        return jsonify({
            'success': True,
            'model_name': model_name,
            'model_info': model_info
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get model info: {str(e)}'}), 500

@predict_bp.route('/api/models/available', methods=['GET'])
def list_available_models():
    """List all available models for prediction"""
    try:
        models = prediction_engine.list_available_models()
        
        # Get detailed info for each model
        detailed_models = []
        for model_name in models:
            try:
                model_info = prediction_engine.get_model_info(model_name)
                detailed_models.append({
                    'name': model_name,
                    'model_type': model_info.get('model_type', 'Unknown'),
                    'performance': model_info.get('performance', {}),
                    'timestamp': model_info.get('timestamp', 'Unknown')
                })
            except:
                # Include model even if info retrieval fails
                detailed_models.append({
                    'name': model_name,
                    'model_type': 'Unknown',
                    'performance': {},
                    'timestamp': 'Unknown'
                })
        
        return jsonify({
            'success': True,
            'models': detailed_models,
            'total_models': len(detailed_models)
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to list models: {str(e)}'}), 500

@predict_bp.route('/api/health', methods=['GET'])
def health_check():
    """System health check endpoint"""
    try:
        health_status = prediction_engine.health_check()
        return jsonify(health_status)
    
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': pd.Timestamp.now().isoformat()
        }), 500

@predict_bp.route('/api/predict/validate', methods=['POST'])
def validate_prediction_input():
    """Validate prediction input without making actual prediction"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        model_name = data.get('model_name')
        input_data = data.get('input_data')
        
        if not model_name:
            return jsonify({'error': 'Model name is required'}), 400
        
        if not input_data:
            return jsonify({'error': 'Input data is required'}), 400
        
        # Load model to get expected features
        model_info = prediction_engine.get_model_info(model_name)
        if not model_info:
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        # Convert input to DataFrame for validation
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        elif isinstance(input_data, list):
            df = pd.DataFrame(input_data)
        else:
            return jsonify({'error': 'Invalid input data format'}), 400
        
        # Basic validation
        validation_result = {
            'valid': True,
            'input_columns': list(df.columns),
            'input_rows': len(df),
            'missing_values': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'warnings': []
        }
        
        # Check for missing values
        if df.isnull().any().any():
            validation_result['warnings'].append('Input contains missing values')
        
        return jsonify(validation_result)
    
    except Exception as e:
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

# Legacy endpoint for backward compatibility
@predict_bp.route('/predict', methods=['POST'])
def make_prediction_legacy():
    """Legacy predict endpoint - redirects to new enterprise endpoint"""
    return make_prediction()