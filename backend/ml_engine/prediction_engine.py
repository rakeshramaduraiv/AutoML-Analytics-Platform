"""
Enterprise Real-time Prediction & Production Engine
Handles batch and real-time predictions with production safeguards
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from enum import Enum
import joblib
import os
import json
from datetime import datetime
import logging
import warnings
warnings.filterwarnings('ignore')

from ml_engine.dataset_intelligence import ProblemType

class PredictionMode(Enum):
    SINGLE = "single"
    BATCH = "batch"
    STREAMING = "streaming"

class PredictionStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"

@dataclass
class PredictionRequest:
    """Structured prediction request"""
    input_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]
    model_name: str
    mode: PredictionMode
    include_confidence: bool = True
    include_explanation: bool = False
    request_id: Optional[str] = None

@dataclass
class PredictionResult:
    """Structured prediction result"""
    predictions: Union[Any, List[Any]]
    confidence_scores: Optional[Union[float, List[float]]]
    feature_contributions: Optional[Dict[str, float]]
    
    # Metadata
    model_used: str
    prediction_time: float
    status: PredictionStatus
    warnings: List[str]
    request_id: Optional[str]
    
    # Quality indicators
    data_quality_score: Optional[float]
    prediction_reliability: str

class ProductionPredictionEngine:
    """
    Enterprise prediction engine for production deployment
    Handles real-time inference with comprehensive safeguards
    """
    
    def __init__(self, models_dir: str = "models", logs_dir: str = "logs"):
        self.models_dir = models_dir
        self.logs_dir = logs_dir
        
        # Setup logging
        os.makedirs(logs_dir, exist_ok=True)
        logging.basicConfig(
            filename=os.path.join(logs_dir, 'predictions.log'),
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Model cache for performance
        self.model_cache = {}
        
        # Production safeguards
        self.max_batch_size = 10000
        self.prediction_timeout = 30  # seconds
        self.confidence_threshold = 0.5
    
    def predict(self, request: PredictionRequest) -> PredictionResult:
        """
        Main prediction method with comprehensive error handling
        """
        start_time = datetime.now()
        warnings_list = []
        
        try:
            # Load model
            model_package = self._load_model(request.model_name)
            if not model_package:
                return self._create_error_result(f"Model {request.model_name} not found", request.request_id)
            
            # Validate and prepare input data
            processed_data, data_warnings = self._prepare_input_data(request.input_data, model_package, request.mode)
            warnings_list.extend(data_warnings)
            
            if processed_data is None:
                return self._create_error_result("Invalid input data format", request.request_id)
            
            # Make predictions
            predictions = self._make_predictions(processed_data, model_package)
            
            # Calculate confidence scores
            confidence_scores = None
            if request.include_confidence:
                confidence_scores = self._calculate_confidence(processed_data, model_package, predictions)
            
            # Generate explanations
            feature_contributions = None
            if request.include_explanation:
                feature_contributions = self._generate_explanations(processed_data, model_package)
            
            # Assess prediction quality
            data_quality_score = self._assess_data_quality(processed_data, model_package)
            reliability = self._assess_prediction_reliability(confidence_scores, data_quality_score)
            
            # Log prediction
            processing_time = (datetime.now() - start_time).total_seconds()
            self._log_prediction(request, predictions, processing_time, PredictionStatus.SUCCESS)
            
            return PredictionResult(
                predictions=predictions,
                confidence_scores=confidence_scores,
                feature_contributions=feature_contributions,
                model_used=request.model_name,
                prediction_time=processing_time,
                status=PredictionStatus.SUCCESS,
                warnings=warnings_list,
                request_id=request.request_id,
                data_quality_score=data_quality_score,
                prediction_reliability=reliability
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            self._log_prediction(request, None, processing_time, PredictionStatus.ERROR, str(e))
            return self._create_error_result(str(e), request.request_id)
    
    def _load_model(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Load model with caching for performance"""
        
        # Check cache first
        if model_name in self.model_cache:
            return self.model_cache[model_name]
        
        # Load from disk
        model_path = os.path.join(self.models_dir, f"{model_name}.joblib")
        if not os.path.exists(model_path):
            return None
        
        try:
            model_package = joblib.load(model_path)
            
            # Validate model package structure
            required_keys = ['model', 'pipeline', 'model_type']
            if not all(key in model_package for key in required_keys):
                self.logger.error(f"Invalid model package structure for {model_name}")
                return None
            
            # Cache for future use
            self.model_cache[model_name] = model_package
            return model_package
            
        except Exception as e:
            self.logger.error(f"Failed to load model {model_name}: {str(e)}")
            return None
    
    def _prepare_input_data(self, input_data: Union[Dict, List, pd.DataFrame], model_package: Dict, mode: PredictionMode) -> tuple:
        """Prepare and validate input data"""
        warnings_list = []
        
        try:
            # Convert to DataFrame
            if isinstance(input_data, dict):
                df = pd.DataFrame([input_data])
            elif isinstance(input_data, list):
                if len(input_data) > self.max_batch_size:
                    warnings_list.append(f"Batch size {len(input_data)} exceeds maximum {self.max_batch_size}")
                    input_data = input_data[:self.max_batch_size]
                df = pd.DataFrame(input_data)
            elif isinstance(input_data, pd.DataFrame):
                df = input_data.copy()
            else:
                return None, ["Unsupported input data format"]
            
            # Validate required features
            pipeline = model_package['pipeline']
            expected_features = self._get_expected_features(pipeline)
            
            missing_features = set(expected_features) - set(df.columns)
            if missing_features:
                warnings_list.append(f"Missing features: {list(missing_features)}")
                # Add missing features with default values
                for feature in missing_features:
                    df[feature] = 0  # or appropriate default
            
            # Remove extra features
            extra_features = set(df.columns) - set(expected_features)
            if extra_features:
                warnings_list.append(f"Extra features ignored: {list(extra_features)}")
                df = df[expected_features]
            
            # Apply preprocessing pipeline
            processed_data = pipeline.transform(df)
            
            return processed_data, warnings_list
            
        except Exception as e:
            return None, [f"Data preparation failed: {str(e)}"]
    
    def _get_expected_features(self, pipeline) -> List[str]:
        """Extract expected feature names from pipeline"""
        try:
            # This is a simplified approach - in practice, you'd need to handle
            # different pipeline structures more robustly
            if hasattr(pipeline, 'transformers'):
                features = []
                for name, transformer, columns in pipeline.transformers:
                    if columns != 'drop':
                        features.extend(columns)
                return features
            else:
                # Fallback - return empty list
                return []
        except:
            return []
    
    def _make_predictions(self, processed_data: np.ndarray, model_package: Dict) -> Union[Any, List[Any]]:
        """Make predictions using the loaded model"""
        model = model_package['model']
        predictions = model.predict(processed_data)
        
        # Convert numpy types to Python types for JSON serialization
        if isinstance(predictions, np.ndarray):
            if len(predictions) == 1:
                return predictions[0].item() if hasattr(predictions[0], 'item') else predictions[0]
            else:
                return [pred.item() if hasattr(pred, 'item') else pred for pred in predictions]
        else:
            return predictions
    
    def _calculate_confidence(self, processed_data: np.ndarray, model_package: Dict, predictions) -> Union[float, List[float]]:
        """Calculate prediction confidence scores"""
        try:
            model = model_package['model']
            
            # For classifiers with predict_proba
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba(processed_data)
                if len(probabilities.shape) == 2:
                    # Multi-class: use max probability
                    confidences = np.max(probabilities, axis=1)
                else:
                    # Binary: use probability of positive class
                    confidences = probabilities[:, 1] if probabilities.shape[1] > 1 else probabilities[:, 0]
                
                if len(confidences) == 1:
                    return float(confidences[0])
                else:
                    return [float(conf) for conf in confidences]
            
            # For regressors, use a simple confidence measure based on prediction variance
            elif hasattr(model, 'predict') and 'Regressor' in model_package.get('model_type', ''):
                # Simple confidence based on model's historical performance
                # In practice, you might use prediction intervals or ensemble variance
                base_confidence = model_package.get('performance', {}).get('test_score', 0.5)
                if isinstance(predictions, list):
                    return [base_confidence] * len(predictions)
                else:
                    return base_confidence
            
            # Default confidence
            return 0.5
            
        except Exception as e:
            self.logger.warning(f"Confidence calculation failed: {str(e)}")
            return 0.5
    
    def _generate_explanations(self, processed_data: np.ndarray, model_package: Dict) -> Optional[Dict[str, float]]:
        """Generate feature contribution explanations"""
        try:
            model = model_package['model']
            
            # For tree-based models, use feature importance
            if hasattr(model, 'feature_importances_'):
                feature_importance = model_package.get('feature_importance', {})
                if feature_importance:
                    return feature_importance
            
            # For linear models, use coefficients
            elif hasattr(model, 'coef_'):
                # This is simplified - in practice you'd need feature names
                coef = model.coef_.flatten() if len(model.coef_.shape) > 1 else model.coef_
                return {f'feature_{i}': float(abs(coef[i])) for i in range(len(coef))}
            
            return None
            
        except Exception as e:
            self.logger.warning(f"Explanation generation failed: {str(e)}")
            return None
    
    def _assess_data_quality(self, processed_data: np.ndarray, model_package: Dict) -> float:
        """Assess quality of input data"""
        try:
            # Check for missing values (NaN)
            nan_count = np.isnan(processed_data).sum()
            total_values = processed_data.size
            
            # Check for infinite values
            inf_count = np.isinf(processed_data).sum()
            
            # Calculate quality score
            quality_score = 1.0 - (nan_count + inf_count) / total_values
            return max(0.0, min(1.0, quality_score))
            
        except Exception as e:
            self.logger.warning(f"Data quality assessment failed: {str(e)}")
            return 0.5
    
    def _assess_prediction_reliability(self, confidence_scores: Union[float, List[float]], data_quality_score: float) -> str:
        """Assess overall prediction reliability"""
        
        # Calculate average confidence
        if isinstance(confidence_scores, list):
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
        else:
            avg_confidence = confidence_scores if confidence_scores is not None else 0.5
        
        # Combine confidence and data quality
        reliability_score = (avg_confidence + data_quality_score) / 2
        
        if reliability_score > 0.8:
            return "High"
        elif reliability_score > 0.6:
            return "Medium"
        else:
            return "Low"
    
    def _log_prediction(self, request: PredictionRequest, predictions, processing_time: float, status: PredictionStatus, error_msg: str = None):
        """Log prediction for monitoring and debugging"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'request_id': request.request_id,
            'model_name': request.model_name,
            'mode': request.mode.value,
            'processing_time': processing_time,
            'status': status.value,
            'input_size': len(request.input_data) if isinstance(request.input_data, list) else 1,
            'error_message': error_msg
        }
        
        self.logger.info(json.dumps(log_entry))
    
    def _create_error_result(self, error_message: str, request_id: Optional[str]) -> PredictionResult:
        """Create error result"""
        return PredictionResult(
            predictions=None,
            confidence_scores=None,
            feature_contributions=None,
            model_used="unknown",
            prediction_time=0.0,
            status=PredictionStatus.ERROR,
            warnings=[error_message],
            request_id=request_id,
            data_quality_score=0.0,
            prediction_reliability="Low"
        )
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a loaded model"""
        model_package = self._load_model(model_name)
        if not model_package:
            return None
        
        return {
            'model_type': model_package.get('model_type'),
            'performance': model_package.get('performance', {}),
            'timestamp': model_package.get('timestamp'),
            'feature_importance': model_package.get('feature_importance', {})
        }
    
    def list_available_models(self) -> List[str]:
        """List all available models"""
        if not os.path.exists(self.models_dir):
            return []
        
        models = []
        for file in os.listdir(self.models_dir):
            if file.endswith('.joblib'):
                models.append(file.replace('.joblib', ''))
        
        return models
    
    def health_check(self) -> Dict[str, Any]:
        """Perform system health check"""
        return {
            'status': 'healthy',
            'models_available': len(self.list_available_models()),
            'cache_size': len(self.model_cache),
            'timestamp': datetime.now().isoformat()
        }

# Usage example
if __name__ == "__main__":
    # Initialize prediction engine
    prediction_engine = ProductionPredictionEngine()
    
    # Example single prediction
    request = PredictionRequest(
        input_data={'age': 30, 'income': 50000, 'category': 'A'},
        model_name='sample_model',
        mode=PredictionMode.SINGLE,
        include_confidence=True,
        include_explanation=True,
        request_id='test_001'
    )
    
    # Make prediction (would work if model exists)
    # result = prediction_engine.predict(request)
    # print(f"Prediction: {result.predictions}")
    # print(f"Confidence: {result.confidence_scores}")
    # print(f"Reliability: {result.prediction_reliability}")
    
    print("Production Prediction Engine initialized")
    print(f"Available models: {prediction_engine.list_available_models()}")
    print(f"Health check: {prediction_engine.health_check()}")