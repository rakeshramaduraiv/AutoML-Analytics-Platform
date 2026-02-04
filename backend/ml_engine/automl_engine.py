"""
Enterprise AutoML Model Selection & Training Engine
Automatically selects and trains optimal ML models
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import joblib
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor

from ml_engine.dataset_intelligence import ProblemType
from ml_engine.pipeline_selector import PipelineConfiguration

class ModelType(Enum):
    LOGISTIC_REGRESSION = "LogisticRegression"
    RANDOM_FOREST_CLASSIFIER = "RandomForestClassifier"
    GRADIENT_BOOSTING_CLASSIFIER = "GradientBoostingClassifier"
    SVM_CLASSIFIER = "SVC"
    NAIVE_BAYES = "GaussianNB"
    KNN_CLASSIFIER = "KNeighborsClassifier"
    
    LINEAR_REGRESSION = "LinearRegression"
    RANDOM_FOREST_REGRESSOR = "RandomForestRegressor"
    GRADIENT_BOOSTING_REGRESSOR = "GradientBoostingRegressor"
    SVM_REGRESSOR = "SVR"
    KNN_REGRESSOR = "KNeighborsRegressor"

@dataclass
class ModelResult:
    """Individual model training result"""
    model_type: ModelType
    model_instance: Any
    cv_scores: List[float]
    mean_cv_score: float
    std_cv_score: float
    test_score: float
    training_time: float
    hyperparameters: Dict[str, Any]
    feature_importance: Optional[Dict[str, float]] = None

@dataclass
class AutoMLResult:
    """Complete AutoML training result"""
    problem_type: ProblemType
    best_model: ModelResult
    all_models: List[ModelResult]
    
    # Dataset info
    train_size: int
    test_size: int
    feature_names: List[str]
    target_name: str
    
    # Performance summary
    performance_summary: Dict[str, Any]
    model_comparison: pd.DataFrame
    
    # Metadata
    total_training_time: float
    pipeline_used: PipelineConfiguration
    model_save_path: str
    
    # Recommendations
    recommendations: List[str]
    confidence_level: str

class AutoMLEngine:
    """
    Enterprise AutoML engine for model selection and training
    """
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
        # Model configurations
        self.classification_models = {
            ModelType.LOGISTIC_REGRESSION: {
                'class': LogisticRegression,
                'params': {'random_state': 42, 'max_iter': 1000}
            },
            ModelType.RANDOM_FOREST_CLASSIFIER: {
                'class': RandomForestClassifier,
                'params': {'n_estimators': 100, 'random_state': 42}
            },
            ModelType.GRADIENT_BOOSTING_CLASSIFIER: {
                'class': GradientBoostingClassifier,
                'params': {'n_estimators': 100, 'random_state': 42}
            },
            ModelType.SVM_CLASSIFIER: {
                'class': SVC,
                'params': {'random_state': 42, 'probability': True}
            },
            ModelType.NAIVE_BAYES: {
                'class': GaussianNB,
                'params': {}
            }
        }
        
        self.regression_models = {
            ModelType.LINEAR_REGRESSION: {
                'class': LinearRegression,
                'params': {}
            },
            ModelType.RANDOM_FOREST_REGRESSOR: {
                'class': RandomForestRegressor,
                'params': {'n_estimators': 100, 'random_state': 42}
            },
            ModelType.GRADIENT_BOOSTING_REGRESSOR: {
                'class': GradientBoostingRegressor,
                'params': {'n_estimators': 100, 'random_state': 42}
            },
            ModelType.SVM_REGRESSOR: {
                'class': SVR,
                'params': {}
            }
        }
    
    def train_automl(self, 
                     df: pd.DataFrame,
                     problem_type: ProblemType,
                     target_column: str,
                     feature_columns: List[str],
                     pipeline_config: PipelineConfiguration,
                     model_name: str = None) -> AutoMLResult:
        """
        Main AutoML training method
        """
        start_time = datetime.now()
        
        # Prepare data
        X = df[feature_columns].copy()
        y = df[target_column].copy()
        
        # Apply preprocessing pipeline
        X_processed = pipeline_config.full_pipeline.fit_transform(X)
        
        # Convert to DataFrame for consistency
        if hasattr(X_processed, 'toarray'):  # Handle sparse matrices
            X_processed = X_processed.toarray()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y, test_size=0.2, random_state=42,
            stratify=y if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION] else None
        )
        
        # Select models based on problem type
        models_to_try = self._select_models_for_problem(problem_type)
        
        # Train all models
        model_results = []
        for model_type in models_to_try:
            try:
                result = self._train_single_model(
                    model_type, X_train, X_test, y_train, y_test, problem_type, feature_columns
                )
                model_results.append(result)
            except Exception as e:
                print(f"Failed to train {model_type.value}: {str(e)}")
                continue
        
        if not model_results:
            raise Exception("No models could be trained successfully")
        
        # Select best model
        best_model = self._select_best_model(model_results, problem_type)
        
        # Create model comparison
        model_comparison = self._create_model_comparison(model_results, problem_type)
        
        # Generate performance summary
        performance_summary = self._generate_performance_summary(best_model, problem_type)
        
        # Save best model
        model_save_path = self._save_model(best_model, pipeline_config, model_name or f"automl_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        # Generate recommendations
        recommendations = self._generate_recommendations(best_model, model_results, problem_type)
        
        # Determine confidence level
        confidence_level = self._determine_confidence_level(best_model, model_results)
        
        total_time = (datetime.now() - start_time).total_seconds()
        
        return AutoMLResult(
            problem_type=problem_type,
            best_model=best_model,
            all_models=model_results,
            train_size=len(X_train),
            test_size=len(X_test),
            feature_names=feature_columns,
            target_name=target_column,
            performance_summary=performance_summary,
            model_comparison=model_comparison,
            total_training_time=total_time,
            pipeline_used=pipeline_config,
            model_save_path=model_save_path,
            recommendations=recommendations,
            confidence_level=confidence_level
        )
    
    def _select_models_for_problem(self, problem_type: ProblemType) -> List[ModelType]:
        """Select appropriate models based on problem type"""
        if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            return [
                ModelType.LOGISTIC_REGRESSION,
                ModelType.RANDOM_FOREST_CLASSIFIER,
                ModelType.GRADIENT_BOOSTING_CLASSIFIER,
                ModelType.SVM_CLASSIFIER
            ]
        elif problem_type == ProblemType.REGRESSION:
            return [
                ModelType.LINEAR_REGRESSION,
                ModelType.RANDOM_FOREST_REGRESSOR,
                ModelType.GRADIENT_BOOSTING_REGRESSOR,
                ModelType.SVM_REGRESSOR
            ]
        else:
            return [ModelType.RANDOM_FOREST_CLASSIFIER]  # Default fallback
    
    def _train_single_model(self, 
                           model_type: ModelType,
                           X_train: np.ndarray,
                           X_test: np.ndarray,
                           y_train: np.ndarray,
                           y_test: np.ndarray,
                           problem_type: ProblemType,
                           feature_names: List[str]) -> ModelResult:
        """Train a single model and evaluate performance"""
        
        start_time = datetime.now()
        
        # Get model configuration
        if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            model_config = self.classification_models[model_type]
        else:
            model_config = self.regression_models[model_type]
        
        # Initialize model
        model = model_config['class'](**model_config['params'])
        
        # Cross-validation
        cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42) if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION] else KFold(n_splits=5, shuffle=True, random_state=42)
        
        scoring = self._get_scoring_metric(problem_type)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv_strategy, scoring=scoring)
        
        # Train on full training set
        model.fit(X_train, y_train)
        
        # Test set evaluation
        y_pred = model.predict(X_test)
        test_score = self._calculate_test_score(y_test, y_pred, problem_type)
        
        # Feature importance (if available)
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(feature_names, model.feature_importances_))
        elif hasattr(model, 'coef_'):
            feature_importance = dict(zip(feature_names, np.abs(model.coef_.flatten())))
        
        training_time = (datetime.now() - start_time).total_seconds()
        
        return ModelResult(
            model_type=model_type,
            model_instance=model,
            cv_scores=cv_scores.tolist(),
            mean_cv_score=cv_scores.mean(),
            std_cv_score=cv_scores.std(),
            test_score=test_score,
            training_time=training_time,
            hyperparameters=model_config['params'],
            feature_importance=feature_importance
        )
    
    def _get_scoring_metric(self, problem_type: ProblemType) -> str:
        """Get appropriate scoring metric for problem type"""
        if problem_type == ProblemType.BINARY_CLASSIFICATION:
            return 'roc_auc'
        elif problem_type == ProblemType.MULTICLASS_CLASSIFICATION:
            return 'accuracy'
        elif problem_type == ProblemType.REGRESSION:
            return 'neg_mean_squared_error'
        else:
            return 'accuracy'
    
    def _calculate_test_score(self, y_true: np.ndarray, y_pred: np.ndarray, problem_type: ProblemType) -> float:
        """Calculate test score based on problem type"""
        if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            return accuracy_score(y_true, y_pred)
        elif problem_type == ProblemType.REGRESSION:
            return r2_score(y_true, y_pred)
        else:
            return accuracy_score(y_true, y_pred)
    
    def _select_best_model(self, model_results: List[ModelResult], problem_type: ProblemType) -> ModelResult:
        """Select best model based on cross-validation performance"""
        if problem_type == ProblemType.REGRESSION:
            # For regression, higher is better (we use R² score)
            return max(model_results, key=lambda x: x.mean_cv_score if x.mean_cv_score > 0 else -abs(x.mean_cv_score))
        else:
            # For classification, higher is better
            return max(model_results, key=lambda x: x.mean_cv_score)
    
    def _create_model_comparison(self, model_results: List[ModelResult], problem_type: ProblemType) -> pd.DataFrame:
        """Create model comparison DataFrame"""
        comparison_data = []
        
        for result in model_results:
            comparison_data.append({
                'Model': result.model_type.value,
                'CV_Score_Mean': round(result.mean_cv_score, 4),
                'CV_Score_Std': round(result.std_cv_score, 4),
                'Test_Score': round(result.test_score, 4),
                'Training_Time': round(result.training_time, 2)
            })
        
        df = pd.DataFrame(comparison_data)
        return df.sort_values('CV_Score_Mean', ascending=False)
    
    def _generate_performance_summary(self, best_model: ModelResult, problem_type: ProblemType) -> Dict[str, Any]:
        """Generate performance summary for best model"""
        summary = {
            'best_model': best_model.model_type.value,
            'cv_score': round(best_model.mean_cv_score, 4),
            'cv_std': round(best_model.std_cv_score, 4),
            'test_score': round(best_model.test_score, 4),
            'training_time': round(best_model.training_time, 2)
        }
        
        if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            summary['metric_type'] = 'Accuracy'
        elif problem_type == ProblemType.REGRESSION:
            summary['metric_type'] = 'R² Score'
        
        return summary
    
    def _save_model(self, best_model: ModelResult, pipeline_config: PipelineConfiguration, model_name: str) -> str:
        """Save trained model and pipeline"""
        model_path = os.path.join(self.models_dir, f"{model_name}.joblib")
        
        # Save both model and pipeline together
        model_package = {
            'model': best_model.model_instance,
            'pipeline': pipeline_config.full_pipeline,
            'model_type': best_model.model_type.value,
            'feature_importance': best_model.feature_importance,
            'performance': {
                'cv_score': best_model.mean_cv_score,
                'test_score': best_model.test_score
            },
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_package, model_path)
        return model_path
    
    def _generate_recommendations(self, best_model: ModelResult, all_models: List[ModelResult], problem_type: ProblemType) -> List[str]:
        """Generate recommendations based on training results"""
        recommendations = []
        
        # Performance-based recommendations
        if best_model.test_score < 0.7:
            recommendations.append("Model performance is below 70% - consider feature engineering or more data")
        elif best_model.test_score > 0.9:
            recommendations.append("Excellent model performance - ready for production deployment")
        
        # Variance recommendations
        if best_model.std_cv_score > 0.1:
            recommendations.append("High variance in cross-validation - consider regularization or more data")
        
        # Model-specific recommendations
        if best_model.model_type in [ModelType.RANDOM_FOREST_CLASSIFIER, ModelType.RANDOM_FOREST_REGRESSOR]:
            recommendations.append("Random Forest selected - good balance of performance and interpretability")
        elif best_model.model_type in [ModelType.LOGISTIC_REGRESSION, ModelType.LINEAR_REGRESSION]:
            recommendations.append("Linear model selected - highly interpretable but may need feature engineering")
        
        # Feature importance recommendations
        if best_model.feature_importance:
            top_features = sorted(best_model.feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]
            recommendations.append(f"Top important features: {', '.join([f[0] for f in top_features])}")
        
        return recommendations
    
    def _determine_confidence_level(self, best_model: ModelResult, all_models: List[ModelResult]) -> str:
        """Determine confidence level in the results"""
        
        # Check performance consistency
        performance_gap = best_model.mean_cv_score - min(m.mean_cv_score for m in all_models)
        
        if best_model.test_score > 0.85 and best_model.std_cv_score < 0.05:
            return "High"
        elif best_model.test_score > 0.7 and performance_gap > 0.05:
            return "Medium"
        else:
            return "Low"

# Usage example
if __name__ == "__main__":
    from ml_engine.data_profiling import DataProfilingEngine
    from ml_engine.dataset_intelligence import DatasetIntelligenceEngine
    from ml_engine.pipeline_selector import AutoPipelineSelector
    
    # Create sample data
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(18, 80, 1000),
        'income': np.random.normal(50000, 15000, 1000),
        'category': np.random.choice(['A', 'B', 'C'], 1000),
        'target': np.random.choice([0, 1], 1000)
    })
    
    # Run full pipeline
    profiling_engine = DataProfilingEngine()
    dataset_profile = profiling_engine.profile_dataset(df)
    
    intelligence_engine = DatasetIntelligenceEngine()
    intelligence_result = intelligence_engine.analyze_dataset_intelligence(df)
    
    pipeline_selector = AutoPipelineSelector()
    pipeline_config = pipeline_selector.select_pipeline(
        intelligence_result.problem_type,
        {'features': ['age', 'income', 'category']},
        dataset_profile.column_profiles,
        dataset_profile
    )
    
    # Train AutoML
    automl_engine = AutoMLEngine()
    automl_result = automl_engine.train_automl(
        df=df,
        problem_type=intelligence_result.problem_type,
        target_column=intelligence_result.target_column,
        feature_columns=intelligence_result.feature_columns,
        pipeline_config=pipeline_config,
        model_name="sample_model"
    )
    
    print(f"Best Model: {automl_result.best_model.model_type.value}")
    print(f"Test Score: {automl_result.best_model.test_score:.4f}")
    print(f"Training Time: {automl_result.total_training_time:.2f}s")
    print(f"Confidence: {automl_result.confidence_level}")
    print("\nRecommendations:")
    for rec in automl_result.recommendations:
        print(f"  - {rec}")