from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
import os
import joblib

predict_bp = Blueprint('predict', __name__)

@predict_bp.route('/api/predict', methods=['POST'])
def make_prediction():
    """Simple prediction endpoint"""
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
        
        # Load model
        model_path = os.path.join('models', f"{model_name}.joblib")
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        model_package = joblib.load(model_path)
        model = model_package['model']
        scaler = model_package['scaler']
        feature_columns = model_package['feature_columns']
        
        # Prepare input data
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = pd.DataFrame(input_data)
        
        # Ensure all required features are present
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0  # Default value for missing features
        
        # Select and order features
        X = df[feature_columns]
        
        # Handle missing values
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = X[col].fillna('Unknown')
            else:
                X[col] = X[col].fillna(X[col].median())
        
        # Encode categorical variables
        from sklearn.preprocessing import LabelEncoder
        for col in X.columns:
            if X[col].dtype == 'object':
                le = LabelEncoder()
                # Fit with known values + unknown
                unique_vals = list(X[col].unique()) + ['Unknown']
                le.fit(unique_vals)
                X[col] = le.transform(X[col].astype(str))
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        predictions = model.predict(X_scaled)
        
        # Get prediction probabilities if available
        confidence_scores = None
        if hasattr(model, 'predict_proba'):
            try:
                probabilities = model.predict_proba(X_scaled)
                confidence_scores = np.max(probabilities, axis=1).tolist()
            except:
                confidence_scores = [0.8] * len(predictions)  # Default confidence
        else:
            confidence_scores = [0.8] * len(predictions)
        
        # Feature importance if available
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            importance_scores = model.feature_importances_
            feature_importance = dict(zip(feature_columns, importance_scores.tolist()))
        
        response = {
            'success': True,
            'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else [predictions],
            'confidence_scores': confidence_scores,
            'feature_importance': feature_importance,
            'model_used': model_name
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@predict_bp.route('/api/models', methods=['GET'])
def list_models():
    """List available models"""
    try:
        models_dir = 'models'
        if not os.path.exists(models_dir):
            return jsonify({'models': []})
        
        models = []
        for file in os.listdir(models_dir):
            if file.endswith('.joblib'):
                models.append(file.replace('.joblib', ''))
        
        return jsonify({'models': models})
    
    except Exception as e:
        return jsonify({'error': f'Failed to list models: {str(e)}'}), 500