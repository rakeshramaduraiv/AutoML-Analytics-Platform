"""
Enterprise Auto Pipeline Selection Engine
Automatically selects optimal preprocessing and ML pipelines
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from ml_engine.dataset_intelligence import ProblemType, DataType

class PreprocessingStrategy(Enum):
    MINIMAL = "minimal"
    STANDARD = "standard"
    ROBUST = "robust"
    ADVANCED = "advanced"

class ScalingMethod(Enum):
    STANDARD = "standard"
    MINMAX = "minmax"
    ROBUST = "robust"
    NONE = "none"

class EncodingMethod(Enum):
    ONEHOT = "onehot"
    LABEL = "label"
    TARGET = "target"
    NONE = "none"

class ImputationMethod(Enum):
    MEAN = "mean"
    MEDIAN = "median"
    MODE = "mode"
    KNN = "knn"
    DROP = "drop"
    NONE = "none"

@dataclass
class PipelineConfiguration:
    """Complete pipeline configuration"""
    strategy: PreprocessingStrategy
    
    # Preprocessing methods
    numerical_imputation: ImputationMethod
    categorical_imputation: ImputationMethod
    scaling_method: ScalingMethod
    encoding_method: EncodingMethod
    
    # Feature engineering
    feature_selection: bool
    feature_selection_k: Optional[int]
    outlier_handling: bool
    
    # Pipeline components
    numerical_pipeline: Pipeline
    categorical_pipeline: Pipeline
    full_pipeline: ColumnTransformer
    
    # Metadata
    reasoning: List[str]
    estimated_processing_time: float
    memory_requirements: str

class AutoPipelineSelector:
    """
    Enterprise pipeline selection engine
    Automatically chooses optimal preprocessing strategies
    """
    
    def __init__(self):
        self.strategy_configs = {
            PreprocessingStrategy.MINIMAL: {
                'numerical_imputation': ImputationMethod.MEDIAN,
                'categorical_imputation': ImputationMethod.MODE,
                'scaling': ScalingMethod.NONE,
                'encoding': EncodingMethod.LABEL,
                'feature_selection': False,
                'outlier_handling': False
            },
            PreprocessingStrategy.STANDARD: {
                'numerical_imputation': ImputationMethod.MEAN,
                'categorical_imputation': ImputationMethod.MODE,
                'scaling': ScalingMethod.STANDARD,
                'encoding': EncodingMethod.ONEHOT,
                'feature_selection': False,
                'outlier_handling': False
            },
            PreprocessingStrategy.ROBUST: {
                'numerical_imputation': ImputationMethod.MEDIAN,
                'categorical_imputation': ImputationMethod.MODE,
                'scaling': ScalingMethod.ROBUST,
                'encoding': EncodingMethod.ONEHOT,
                'feature_selection': True,
                'outlier_handling': True
            },
            PreprocessingStrategy.ADVANCED: {
                'numerical_imputation': ImputationMethod.KNN,
                'categorical_imputation': ImputationMethod.MODE,
                'scaling': ScalingMethod.ROBUST,
                'encoding': EncodingMethod.TARGET,
                'feature_selection': True,
                'outlier_handling': True
            }
        }
    
    def select_pipeline(self, 
                       problem_type: ProblemType,
                       column_roles: Dict[str, Any],
                       column_profiles: Dict[str, Any],
                       dataset_profile: Any) -> PipelineConfiguration:
        """
        Main pipeline selection method
        Automatically chooses optimal preprocessing strategy
        """
        
        # Determine preprocessing strategy
        strategy = self._determine_strategy(problem_type, column_profiles, dataset_profile)
        
        # Get base configuration
        config = self.strategy_configs[strategy].copy()
        
        # Customize based on data characteristics
        config = self._customize_configuration(config, problem_type, column_profiles, dataset_profile)
        
        # Build actual pipeline components
        numerical_pipeline = self._build_numerical_pipeline(config, column_profiles)
        categorical_pipeline = self._build_categorical_pipeline(config, column_profiles)
        
        # Identify column types for pipeline
        numerical_cols = [col for col, profile in column_profiles.items() 
                         if profile.data_type == DataType.NUMERICAL and col in column_roles.get('features', [])]
        categorical_cols = [col for col, profile in column_profiles.items() 
                           if profile.data_type == DataType.CATEGORICAL and col in column_roles.get('features', [])]
        
        # Build full pipeline
        transformers = []
        if numerical_cols:
            transformers.append(('num', numerical_pipeline, numerical_cols))
        if categorical_cols:
            transformers.append(('cat', categorical_pipeline, categorical_cols))
        
        full_pipeline = ColumnTransformer(transformers, remainder='drop')
        
        # Generate reasoning
        reasoning = self._generate_pipeline_reasoning(strategy, config, problem_type, dataset_profile)
        
        # Estimate processing requirements
        processing_time = self._estimate_processing_time(strategy, dataset_profile)
        memory_req = self._estimate_memory_requirements(strategy, dataset_profile)
        
        return PipelineConfiguration(
            strategy=strategy,
            numerical_imputation=config['numerical_imputation'],
            categorical_imputation=config['categorical_imputation'],
            scaling_method=config['scaling'],
            encoding_method=config['encoding'],
            feature_selection=config['feature_selection'],
            feature_selection_k=config.get('feature_selection_k'),
            outlier_handling=config['outlier_handling'],
            numerical_pipeline=numerical_pipeline,
            categorical_pipeline=categorical_pipeline,
            full_pipeline=full_pipeline,
            reasoning=reasoning,
            estimated_processing_time=processing_time,
            memory_requirements=memory_req
        )
    
    def _determine_strategy(self, problem_type: ProblemType, column_profiles: Dict, dataset_profile: Any) -> PreprocessingStrategy:
        """Determine preprocessing strategy based on data characteristics"""
        
        # Count data quality issues
        total_issues = sum(len(profile.quality_issues) for profile in column_profiles.values())
        quality_score = dataset_profile.overall_quality_score
        
        # Count missing values
        high_missing_cols = sum(1 for profile in column_profiles.values() if profile.missing_percentage > 20)
        
        # Dataset size considerations
        is_large_dataset = dataset_profile.total_rows > 10000
        is_wide_dataset = dataset_profile.total_columns > 50
        
        # Strategy selection logic
        if quality_score >= 90 and total_issues == 0:
            return PreprocessingStrategy.MINIMAL
        elif quality_score >= 70 and high_missing_cols == 0 and not is_wide_dataset:
            return PreprocessingStrategy.STANDARD
        elif quality_score >= 50 or high_missing_cols > 0 or is_wide_dataset:
            return PreprocessingStrategy.ROBUST
        else:
            return PreprocessingStrategy.ADVANCED
    
    def _customize_configuration(self, config: Dict, problem_type: ProblemType, column_profiles: Dict, dataset_profile: Any) -> Dict:
        """Customize configuration based on specific data characteristics"""
        
        # Adjust imputation based on missing patterns
        high_missing_numerical = [col for col, profile in column_profiles.items() 
                                 if profile.data_type == DataType.NUMERICAL and profile.missing_percentage > 30]
        if high_missing_numerical and dataset_profile.total_rows > 1000:
            config['numerical_imputation'] = ImputationMethod.KNN
        
        # Adjust scaling based on problem type
        if problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            # Classification often benefits from scaling
            if config['scaling'] == ScalingMethod.NONE:
                config['scaling'] = ScalingMethod.STANDARD
        
        # Adjust encoding based on cardinality
        high_cardinality_cats = [col for col, profile in column_profiles.items() 
                                if profile.data_type == DataType.CATEGORICAL and profile.unique_count > 10]
        if high_cardinality_cats and config['encoding'] == EncodingMethod.ONEHOT:
            config['encoding'] = EncodingMethod.TARGET
        
        # Feature selection for high-dimensional data
        if dataset_profile.total_columns > 20:
            config['feature_selection'] = True
            config['feature_selection_k'] = min(15, dataset_profile.total_columns - 1)
        
        return config
    
    def _build_numerical_pipeline(self, config: Dict, column_profiles: Dict) -> Pipeline:
        """Build numerical preprocessing pipeline"""
        steps = []
        
        # Imputation
        if config['numerical_imputation'] == ImputationMethod.MEAN:
            steps.append(('imputer', SimpleImputer(strategy='mean')))
        elif config['numerical_imputation'] == ImputationMethod.MEDIAN:
            steps.append(('imputer', SimpleImputer(strategy='median')))
        elif config['numerical_imputation'] == ImputationMethod.KNN:
            steps.append(('imputer', KNNImputer(n_neighbors=5)))
        
        # Scaling
        if config['scaling'] == ScalingMethod.STANDARD:
            steps.append(('scaler', StandardScaler()))
        elif config['scaling'] == ScalingMethod.MINMAX:
            steps.append(('scaler', MinMaxScaler()))
        elif config['scaling'] == ScalingMethod.ROBUST:
            steps.append(('scaler', RobustScaler()))
        
        return Pipeline(steps) if steps else Pipeline([('passthrough', 'passthrough')])
    
    def _build_categorical_pipeline(self, config: Dict, column_profiles: Dict) -> Pipeline:
        """Build categorical preprocessing pipeline"""
        steps = []
        
        # Imputation
        if config['categorical_imputation'] == ImputationMethod.MODE:
            steps.append(('imputer', SimpleImputer(strategy='most_frequent')))
        
        # Encoding
        if config['encoding'] == EncodingMethod.ONEHOT:
            steps.append(('encoder', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')))
        elif config['encoding'] == EncodingMethod.LABEL:
            steps.append(('encoder', LabelEncoder()))
        
        return Pipeline(steps) if steps else Pipeline([('passthrough', 'passthrough')])
    
    def _generate_pipeline_reasoning(self, strategy: PreprocessingStrategy, config: Dict, problem_type: ProblemType, dataset_profile: Any) -> List[str]:
        """Generate reasoning for pipeline selection"""
        reasoning = []
        
        reasoning.append(f"Selected {strategy.value} preprocessing strategy")
        
        # Strategy reasoning
        if strategy == PreprocessingStrategy.MINIMAL:
            reasoning.append("High data quality detected - minimal preprocessing sufficient")
        elif strategy == PreprocessingStrategy.STANDARD:
            reasoning.append("Good data quality - standard preprocessing recommended")
        elif strategy == PreprocessingStrategy.ROBUST:
            reasoning.append("Data quality issues detected - robust preprocessing required")
        else:
            reasoning.append("Complex data characteristics - advanced preprocessing needed")
        
        # Specific method reasoning
        if config['numerical_imputation'] == ImputationMethod.KNN:
            reasoning.append("KNN imputation chosen for better handling of missing patterns")
        
        if config['scaling'] != ScalingMethod.NONE:
            reasoning.append(f"{config['scaling'].value} scaling applied for algorithm compatibility")
        
        if config['encoding'] == EncodingMethod.TARGET:
            reasoning.append("Target encoding chosen for high-cardinality categorical variables")
        
        if config['feature_selection']:
            reasoning.append("Feature selection enabled for dimensionality reduction")
        
        return reasoning
    
    def _estimate_processing_time(self, strategy: PreprocessingStrategy, dataset_profile: Any) -> float:
        """Estimate processing time in seconds"""
        base_time = dataset_profile.total_rows * dataset_profile.total_columns / 100000  # Base complexity
        
        multipliers = {
            PreprocessingStrategy.MINIMAL: 1.0,
            PreprocessingStrategy.STANDARD: 1.5,
            PreprocessingStrategy.ROBUST: 2.0,
            PreprocessingStrategy.ADVANCED: 3.0
        }
        
        return base_time * multipliers[strategy]
    
    def _estimate_memory_requirements(self, strategy: PreprocessingStrategy, dataset_profile: Any) -> str:
        """Estimate memory requirements"""
        base_memory = dataset_profile.memory_usage_mb
        
        if strategy in [PreprocessingStrategy.ROBUST, PreprocessingStrategy.ADVANCED]:
            estimated_memory = base_memory * 2.5  # Pipeline overhead
        else:
            estimated_memory = base_memory * 1.5
        
        if estimated_memory < 100:
            return "Low (< 100MB)"
        elif estimated_memory < 500:
            return "Medium (100-500MB)"
        else:
            return "High (> 500MB)"

# Usage example
if __name__ == "__main__":
    from ml_engine.data_profiling import DataProfilingEngine, DataType
    from ml_engine.dataset_intelligence import DatasetIntelligenceEngine
    
    # Create sample data
    df = pd.DataFrame({
        'age': [25, 30, None, 45, 35],
        'income': [50000, 60000, 55000, None, 70000],
        'category': ['A', 'B', 'A', 'C', None],
        'target': [0, 1, 0, 1, 1]
    })
    
    # Profile data
    profiling_engine = DataProfilingEngine()
    dataset_profile = profiling_engine.profile_dataset(df)
    
    # Get intelligence
    intelligence_engine = DatasetIntelligenceEngine()
    intelligence_result = intelligence_engine.analyze_dataset_intelligence(df)
    
    # Select pipeline
    pipeline_selector = AutoPipelineSelector()
    pipeline_config = pipeline_selector.select_pipeline(
        intelligence_result.problem_type,
        {'features': ['age', 'income', 'category']},
        dataset_profile.column_profiles,
        dataset_profile
    )
    
    print(f"Strategy: {pipeline_config.strategy.value}")
    print(f"Scaling: {pipeline_config.scaling_method.value}")
    print(f"Encoding: {pipeline_config.encoding_method.value}")
    print(f"Feature Selection: {pipeline_config.feature_selection}")
    print(f"Estimated Time: {pipeline_config.estimated_processing_time:.2f}s")
    print(f"Memory Requirements: {pipeline_config.memory_requirements}")
    print("\nReasoning:")
    for reason in pipeline_config.reasoning:
        print(f"  - {reason}")