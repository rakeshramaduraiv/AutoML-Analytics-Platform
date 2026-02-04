from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
import os
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error
from ml_engine.data_quality_v2 import DataQualityEngine
from ml_engine.decision_log_v2 import MLDecisionEngine
import hashlib

train_bp = Blueprint('train', __name__)

class ModelLifecycleManager:
    """Manages model versioning, training status, and lifecycle"""
    
    def __init__(self):
        self.training_jobs = {}  # In production, use Redis/database
        self.quality_engine = DataQualityEngine()
        self.decision_engine = MLDecisionEngine()
    
    def start_training(self, filename: str) -> str:
        """Start training job with status tracking"""
        job_id = self._generate_job_id(filename)
        
        self.training_jobs[job_id] = {
            'status': 'PENDING',
            'progress': 0,
            'stage': 'initializing',
            'started_at': datetime.now().isoformat(),
            'filename': filename
        }
        
        # Execute training (in production, this would be async)
        result = self._execute_training(filename, job_id)
        
        return job_id
    
    def get_training_status(self, job_id: str) -> dict:
        """Get current training status"""
        return self.training_jobs.get(job_id, {'status': 'NOT_FOUND'})
    
    def _execute_training(self, filename: str, job_id: str) -> dict:
        """Execute training with proper lifecycle management"""
        try:
            self._update_status(job_id, 'RUNNING', 10, 'loading_data')
            
            # Load and validate data
            filepath = os.path.join('uploads', filename)
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(filepath)
            else:
                raise ValueError('Only CSV and Excel files supported')
            
            # Data quality assessment
            self._update_status(job_id, 'RUNNING', 25, 'assessing_quality')
            quality_metrics = self.quality_engine.calculate_quality_score(df)
            
            if not quality_metrics.ml_ready:
                raise ValueError(f"Data quality insufficient: {quality_metrics.blocking_issues}")
            
            # Generate dataset fingerprint
            dataset_hash = self._generate_dataset_hash(df)
            
            # Feature engineering
            self._update_status(job_id, 'RUNNING', 40, 'feature_engineering')
            target_col = df.columns[-1]
            feature_cols = df.columns[:-1].tolist()
            
            X, y = self._prepare_features(df, feature_cols, target_col)
            
            # Create decision log
            self._update_status(job_id, 'RUNNING', 55, 'creating_decision_log')
            decision_log = self.decision_engine.create_decision_log(
                df, 'RandomForestClassifier', target_col, feature_cols,
                quality_metrics.overall_score, dataset_hash
            )
            
            # Model training
            self._update_status(job_id, 'RUNNING', 70, 'training_model')
            model, scaler, metrics = self._train_model(X, y, decision_log.selected_algorithm)
            
            # Model persistence with versioning
            self._update_status(job_id, 'RUNNING', 90, 'saving_model')
            model_info = self._save_versioned_model(
                model, scaler, decision_log, quality_metrics, 
                feature_cols, target_col, metrics, dataset_hash
            )
            
            self._update_status(job_id, 'COMPLETED', 100, 'completed')
            
            return {
                'success': True,
                'model_info': model_info,
                'quality_metrics': quality_metrics.to_dict(),
                'decision_log': decision_log.to_dict()
            }
            
        except Exception as e:
            self._update_status(job_id, 'FAILED', 0, f'error: {str(e)}')
            return {'success': False, 'error': str(e)}
    
    def _prepare_features(self, df, feature_cols, target_col):
        """Prepare features with proper encoding"""
        X = df[feature_cols].copy()
        y = df[target_col].copy()
        
        # Handle missing values
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = X[col].fillna('Unknown')
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            else:
                X[col] = X[col].fillna(X[col].median())
        
        # Handle target
        if y.dtype == 'object':
            le_target = LabelEncoder()
            y = le_target.fit_transform(y.astype(str))
        else:
            y = y.fillna(y.median())
        
        return X, y
    
    def _train_model(self, X, y, algorithm):
        """Train model with proper validation"""
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Select model based on algorithm
        if algorithm == 'RandomForestClassifier':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif algorithm == 'RandomForestRegressor':
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        elif algorithm == 'LogisticRegression':
            model = LogisticRegression(random_state=42, max_iter=1000)
        else:
            model = LinearRegression()
        
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        if hasattr(model, 'predict_proba'):
            accuracy = accuracy_score(y_test, y_pred)
            metrics = {'accuracy': accuracy, 'type': 'classification'}
        else:
            r2_score = 1 - (mean_squared_error(y_test, y_pred) / np.var(y_test))
            metrics = {'r2_score': r2_score, 'type': 'regression'}
        
        return model, scaler, metrics
    
    def _save_versioned_model(self, model, scaler, decision_log, quality_metrics,
                            feature_cols, target_col, metrics, dataset_hash):
        """Save model with proper versioning and metadata"""
        
        model_name = f"model_{decision_log.model_version}_{dataset_hash[:8]}"
        model_path = os.path.join('models', f"{model_name}.joblib")
        
        os.makedirs('models', exist_ok=True)
        
        model_package = {
            # Core model components
            'model': model,
            'scaler': scaler,
            'feature_columns': feature_cols,
            'target_column': target_col,
            
            # Versioning and identification
            'model_id': decision_log.model_id,
            'model_version': decision_log.model_version,
            'dataset_hash': dataset_hash,
            'created_at': datetime.now().isoformat(),
            
            # Performance and quality
            'performance_metrics': metrics,
            'data_quality_score': quality_metrics.overall_score,
            
            # Governance and traceability
            'decision_log': decision_log.to_dict(),
            'quality_assessment': quality_metrics.to_dict(),
            
            # Reproducibility
            'training_config': {
                'algorithm': decision_log.selected_algorithm,
                'hyperparameters': decision_log.hyperparameters,
                'random_seed': decision_log.random_seed
            }
        }
        
        joblib.dump(model_package, model_path)
        
        return {
            'model_name': model_name,
            'model_version': decision_log.model_version,
            'model_id': decision_log.model_id,
            'performance': metrics,
            'data_quality': quality_metrics.overall_score
        }
    
    def list_models(self):
        """List all models with version information"""
        models_dir = 'models'
        if not os.path.exists(models_dir):
            return []
        
        models = []
        for file in os.listdir(models_dir):
            if file.endswith('.joblib'):
                try:
                    model_path = os.path.join(models_dir, file)
                    model_package = joblib.load(model_path)
                    
                    models.append({
                        'name': file.replace('.joblib', ''),
                        'model_id': model_package.get('model_id', 'unknown'),
                        'version': model_package.get('model_version', 'v1.0'),
                        'created_at': model_package.get('created_at', 'unknown'),
                        'algorithm': model_package.get('training_config', {}).get('algorithm', 'unknown'),
                        'performance': model_package.get('performance_metrics', {}),
                        'data_quality': model_package.get('data_quality_score', 0),
                        'dataset_hash': model_package.get('dataset_hash', 'unknown')
                    })
                except Exception as e:
                    continue
        
        # Sort by creation date, newest first
        models.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return models
    
    def _generate_job_id(self, filename):
        """Generate unique job ID"""
        timestamp = datetime.now().isoformat()
        combined = f"{filename}_{timestamp}"
        return hashlib.md5(combined.encode()).hexdigest()[:12]
    
    def _generate_dataset_hash(self, df):
        """Generate reproducible dataset fingerprint"""
        # Create hash based on shape, columns, and sample of data
        shape_str = f"{df.shape[0]}x{df.shape[1]}"
        columns_str = "|".join(sorted(df.columns.tolist()))
        
        # Sample first few rows for content hash (deterministic)
        sample_data = df.head(5).to_string()
        
        combined = f"{shape_str}_{columns_str}_{sample_data}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    def _update_status(self, job_id, status, progress, stage):
        """Update training job status"""
        if job_id in self.training_jobs:
            self.training_jobs[job_id].update({
                'status': status,
                'progress': progress,
                'stage': stage,
                'updated_at': datetime.now().isoformat()
            })

# Global manager instance
model_manager = ModelLifecycleManager()

@train_bp.route('/api/train', methods=['POST'])
def train_model():
    """Start model training with lifecycle management"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Filename required'}), 400
        
        filepath = os.path.join('uploads', filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        job_id = model_manager.start_training(filename)
        result = model_manager.get_training_status(job_id)
        
        if result['status'] == 'COMPLETED':
            return jsonify(result)
        else:
            return jsonify({'job_id': job_id, 'status': result['status']})
    
    except Exception as e:
        return jsonify({'error': f'Training failed: {str(e)}'}), 500

@train_bp.route('/api/training-status/<job_id>', methods=['GET'])
def get_training_status(job_id):
    """Get training job status"""
    status = model_manager.get_training_status(job_id)
    return jsonify(status)

@train_bp.route('/api/models', methods=['GET'])
def list_models():
    """List all trained models with version info"""
    try:
        models = model_manager.list_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': f'Failed to list models: {str(e)}'}), 500