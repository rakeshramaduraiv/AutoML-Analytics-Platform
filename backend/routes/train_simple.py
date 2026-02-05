from flask import Blueprint, request, jsonify
from flask_socketio import emit
import pandas as pd
import numpy as np
import os
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor, ExtraTreesClassifier, ExtraTreesRegressor, VotingClassifier, VotingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score, mean_absolute_error
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, mutual_info_classif, mutual_info_regression
from sklearn.impute import SimpleImputer
import hashlib
import time
import warnings
warnings.filterwarnings('ignore')

train_simple_bp = Blueprint('train_simple', __name__)
SAMPLE_THRESHOLD = 50000

def emit_progress(message, progress, socketio=None):
    """Emit training progress via WebSocket"""
    if socketio:
        socketio.emit('training_progress', {
            'message': message,
            'progress': progress,
            'timestamp': datetime.now().isoformat()
        })
    print(f"[{progress}%] {message}")

@train_simple_bp.route('/api/train', methods=['POST'])
def train_model():
    """Industry-level ML training with real-time progress"""
    start_time = time.time()
    
    try:
        from app import socketio
        
        emit_progress("Initializing training pipeline...", 5, socketio)
        
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        filename = data.get('filename')
        
        # Get training configuration from request
        config = data.get('config', {})
        training_mode = config.get('trainingTime', 'standard')
        
        # Map UI options to optimized internal settings
        if training_mode == 'quick':
            cv_folds = 2
            n_estimators = 100
            max_depth = 12
            use_ensemble = False
            feature_selection_k = 15
        elif training_mode == 'thorough':
            cv_folds = 5
            n_estimators = 400
            max_depth = None
            use_ensemble = True
            feature_selection_k = 25
        else:  # standard
            cv_folds = 3
            n_estimators = 200
            max_depth = 20
            use_ensemble = False
            feature_selection_k = 20
        
        if not filename:
            return jsonify({'error': 'Filename required'}), 400
        
        filepath = os.path.join('uploads', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': f'File not found: {filename}'}), 404
        
        emit_progress("Loading dataset...", 10, socketio)
        
        # Load data
        if filename.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath, engine='openpyxl')
        else:
            return jsonify({'error': 'Only CSV and Excel files supported'}), 400
        
        # Data validation
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        if len(df) < 20:
            return jsonify({'error': 'Dataset too small (minimum 20 rows required)'}), 400
        
        if len(df.columns) < 2:
            return jsonify({'error': 'Need at least 2 columns'}), 400
        
        emit_progress("Analyzing data structure...", 15, socketio)
        
        # Smart sampling for large datasets
        original_size = len(df)
        if len(df) > SAMPLE_THRESHOLD:
            emit_progress(f"Smart sampling ({len(df)} rows)...", 18, socketio)
            sample_size = min(SAMPLE_THRESHOLD, len(df))
            df = df.sample(n=sample_size, random_state=42)
            emit_progress(f"Using {len(df)} samples", 20, socketio)
        
        target_col = df.columns[-1]
        feature_cols = df.columns[:-1].tolist()
        
        X = df[feature_cols].copy()
        y = df[target_col].copy()
        
        emit_progress("Preprocessing features...", 25, socketio)
        
        # Optimized preprocessing with better imputation
        label_encoders = {}
        for col in X.columns:
            if pd.api.types.is_datetime64_any_dtype(X[col]):
                X[col] = pd.to_numeric(X[col].astype('int64') / 10**9, errors='coerce')
                X[col] = X[col].fillna(X[col].median())
            elif X[col].dtype == 'object' or not pd.api.types.is_numeric_dtype(X[col]):
                # Use mode for categorical
                mode_val = X[col].mode()[0] if len(X[col].mode()) > 0 else 'Unknown'
                X[col] = X[col].fillna(mode_val)
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                label_encoders[col] = le
            else:
                # Use median for numerical
                X[col] = X[col].fillna(X[col].median())
        
        # Ensure all numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
        
        # Determine problem type
        is_classification = False
        if pd.api.types.is_datetime64_any_dtype(y):
            y = pd.to_numeric(y.astype('int64') / 10**9, errors='coerce').fillna(0)
        elif y.dtype == 'object' or not pd.api.types.is_numeric_dtype(y):
            is_classification = True
            y = y.fillna(y.mode()[0] if len(y.mode()) > 0 else 'Unknown')
            le_target = LabelEncoder()
            y = le_target.fit_transform(y.astype(str))
            label_encoders['_target_'] = le_target
        else:
            unique_values = len(y.unique())
            if unique_values < 10 or (unique_values / len(y)) < 0.05:
                is_classification = True
            y = pd.to_numeric(y, errors='coerce').fillna(y.median())
        
        emit_progress(f"Problem type: {'Classification' if is_classification else 'Regression'}", 30, socketio)
        
        # Smart feature selection with mutual information
        if len(X.columns) > feature_selection_k:
            emit_progress("Selecting top features...", 35, socketio)
            if is_classification:
                selector = SelectKBest(mutual_info_classif, k=min(feature_selection_k, len(X.columns)))
            else:
                selector = SelectKBest(mutual_info_regression, k=min(feature_selection_k, len(X.columns)))
            X = pd.DataFrame(selector.fit_transform(X, y), columns=X.columns[selector.get_support()])
        
        # Optimized train/test split
        test_size = 0.15
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42, stratify=y if is_classification else None)
        
        emit_progress("Scaling features...", 40, socketio)
        
        # Use RobustScaler for better outlier handling
        scaler = RobustScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Optimized model training
        emit_progress("Training models...", 45, socketio)
        
        if is_classification:
            models_to_try = [
                ('Random Forest', RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, min_samples_split=2, min_samples_leaf=1, max_features='sqrt', n_jobs=-1, random_state=42, class_weight='balanced')),
                ('Gradient Boosting', GradientBoostingClassifier(n_estimators=n_estimators, learning_rate=0.1, max_depth=5, subsample=0.8, n_jobs=-1, random_state=42)),
                ('Extra Trees', ExtraTreesClassifier(n_estimators=n_estimators, max_depth=max_depth, min_samples_split=2, min_samples_leaf=1, n_jobs=-1, random_state=42, class_weight='balanced'))
            ]
        else:
            models_to_try = [
                ('Random Forest', RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, min_samples_split=2, min_samples_leaf=1, max_features='sqrt', n_jobs=-1, random_state=42)),
                ('Gradient Boosting', GradientBoostingRegressor(n_estimators=n_estimators, learning_rate=0.1, max_depth=5, subsample=0.8, n_jobs=-1, random_state=42)),
                ('Extra Trees', ExtraTreesRegressor(n_estimators=n_estimators, max_depth=max_depth, min_samples_split=2, min_samples_leaf=1, n_jobs=-1, random_state=42))
            ]
        
        results = []
        best_score = -np.inf
        best_model = None
        best_model_name = None
        trained_models = []
        
        # Parallel training with optimized CV
        for idx, (name, model) in enumerate(models_to_try):
            progress = 50 + (idx * 12)
            emit_progress(f"Training {name}...", progress, socketio)
            
            try:
                # Stratified CV for classification
                if is_classification:
                    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
                else:
                    cv = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
                
                emit_progress(f"CV evaluation for {name}...", progress + 2, socketio)
                cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='accuracy' if is_classification else 'r2', n_jobs=-1)
                
                emit_progress(f"Training {name} on full dataset...", progress + 5, socketio)
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                
                trained_models.append((name, model))
            except Exception as e:
                print(f"Error training {name}: {e}")
                continue
            
            if is_classification:
                accuracy = accuracy_score(y_test, y_pred)
                precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                
                score = accuracy
                emit_progress(f"{name} accuracy: {accuracy:.4f}", progress + 8, socketio)
                
                results.append({
                    'model': name,
                    'accuracy': float(accuracy),
                    'precision': float(precision),
                    'recall': float(recall),
                    'f1_score': float(f1),
                    'cv_mean': float(cv_scores.mean()),
                    'cv_std': float(cv_scores.std())
                })
            else:
                r2 = r2_score(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                mae = mean_absolute_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                
                score = r2
                emit_progress(f"{name} R² score: {r2:.4f}", progress + 8, socketio)
                
                results.append({
                    'model': name,
                    'r2_score': float(r2),
                    'mse': float(mse),
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'cv_mean': float(cv_scores.mean()),
                    'cv_std': float(cv_scores.std())
                })
            
            if score > best_score:
                best_score = score
                best_model = model
                best_model_name = name
        
        # Ensemble method for thorough mode
        if use_ensemble and len(trained_models) >= 2:
            emit_progress("Creating ensemble model...", 88, socketio)
            try:
                if is_classification:
                    ensemble = VotingClassifier(estimators=trained_models, voting='soft', n_jobs=-1)
                else:
                    ensemble = VotingRegressor(estimators=trained_models, n_jobs=-1)
                
                ensemble.fit(X_train_scaled, y_train)
                y_pred_ensemble = ensemble.predict(X_test_scaled)
                
                if is_classification:
                    ensemble_score = accuracy_score(y_test, y_pred_ensemble)
                else:
                    ensemble_score = r2_score(y_test, y_pred_ensemble)
                
                if ensemble_score > best_score:
                    best_model = ensemble
                    best_model_name = 'Ensemble'
                    best_score = ensemble_score
                    emit_progress(f"Ensemble improved score to {best_score:.4f}", 92, socketio)
            except Exception as e:
                print(f"Ensemble failed: {e}")
        
        emit_progress(f"Best: {best_model_name} ({best_score:.4f})", 95, socketio)
        
        # Save model
        emit_progress("Saving model...", 97, socketio)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        dataset_hash = hashlib.md5(filename.encode()).hexdigest()[:8]
        model_name = f"model_{target_col}_{timestamp}_{dataset_hash}"
        model_path = os.path.join('models', f"{model_name}.joblib")
        
        os.makedirs('models', exist_ok=True)
        
        training_time = time.time() - start_time
        
        model_package = {
            'model': best_model,
            'scaler': scaler,
            'label_encoders': label_encoders,
            'feature_columns': list(X.columns),
            'target_column': target_col,
            'model_name': model_name,
            'created_at': datetime.now().isoformat(),
            'is_classification': is_classification,
            'best_model_name': best_model_name,
            'all_results': results,
            'training_time': training_time,
            'dataset_info': {
                'rows': original_size,
                'training_rows': len(df),
                'features': len(X.columns),
                'filename': filename,
                'training_mode': training_mode,
                'cv_folds': cv_folds
            }
        }
        
        joblib.dump(model_package, model_path)
        
        emit_progress("Training complete!", 100, socketio)
        
        # Prepare response
        best_result = next(r for r in results if r['model'] == best_model_name)
        
        response = {
            'success': True,
            'model_name': model_name,
            'best_model': best_model_name,
            'performance_metrics': best_result,
            'all_models': results,
            'training_time': round(training_time, 2),
            'problem_type': 'Classification' if is_classification else 'Regression',
            'dataset_info': {
                'rows': len(df),
                'features': len(X.columns),
                'target': target_col
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Training failed: {str(e)}'}), 500

@train_simple_bp.route('/api/models', methods=['GET'])
def list_models():
    """List all trained models with complete metadata"""
    try:
        models_dir = 'models'
        if not os.path.exists(models_dir):
            return jsonify({'models': []})
        
        models = []
        for file in os.listdir(models_dir):
            if file.endswith('.joblib'):
                try:
                    model_path = os.path.join(models_dir, file)
                    model_package = joblib.load(model_path)
                    
                    # Get first result for performance metrics
                    all_results = model_package.get('all_results', [])
                    performance = all_results[0] if all_results else {}
                    
                    models.append({
                        'name': model_package.get('model_name', file.replace('.joblib', '')),
                        'created_at': model_package.get('created_at', 'unknown'),
                        'algorithm': model_package.get('best_model_name', 'unknown'),
                        'performance': performance,
                        'target_column': model_package.get('target_column', 'unknown'),
                        'training_time': model_package.get('training_time', 0),
                        'feature_columns': model_package.get('feature_columns', []),
                        'problem_type': 'Classification' if model_package.get('is_classification') else 'Regression',
                        'dataset_info': model_package.get('dataset_info', {})
                    })
                except Exception as e:
                    print(f"Error loading model {file}: {e}")
                    continue
        
        models.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify({'models': models})
        
    except Exception as e:
        return jsonify({'error': f'Failed to list models: {str(e)}'}), 500

@train_simple_bp.route('/api/models/<model_name>', methods=['DELETE'])
def delete_model(model_name):
    """Delete a trained model"""
    try:
        model_path = os.path.join('models', f"{model_name}.joblib")
        
        if not os.path.exists(model_path):
            return jsonify({'error': 'Model not found'}), 404
        
        os.remove(model_path)
        return jsonify({'success': True, 'message': f'Model {model_name} deleted'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete model: {str(e)}'}), 500
