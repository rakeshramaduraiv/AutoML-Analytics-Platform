"""
Enterprise Dataset Intelligence Engine (Core Brain)
Automatically identifies problem types, target columns, and ML strategies
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from ml_engine.data_profiling import DataProfilingEngine, DataType
import re

class ProblemType(Enum):
    BINARY_CLASSIFICATION = "binary_classification"
    MULTICLASS_CLASSIFICATION = "multiclass_classification"
    REGRESSION = "regression"
    TIME_SERIES = "time_series"
    TEXT_ANALYTICS = "text_analytics"
    EXPLORATORY = "exploratory"
    UNSUPERVISED = "unsupervised"

class ColumnRole(Enum):
    TARGET = "target"
    FEATURE = "feature"
    IDENTIFIER = "identifier"
    TIMESTAMP = "timestamp"
    TEXT = "text"
    IGNORE = "ignore"

@dataclass
class IntelligenceResult:
    """Dataset intelligence analysis results"""
    problem_type: ProblemType
    confidence_score: float
    target_column: Optional[str]
    feature_columns: List[str]
    timestamp_columns: List[str]
    identifier_columns: List[str]
    text_columns: List[str]
    ignore_columns: List[str]
    
    reasoning: List[str]
    recommendations: List[str]
    ml_strategy: Dict[str, Any]
    preprocessing_requirements: List[str]

class DatasetIntelligenceEngine:
    """
    Core intelligence engine that understands dataset intent
    Makes autonomous decisions about ML problem setup
    """
    
    def __init__(self):
        self.profiling_engine = DataProfilingEngine()
        
        # Intelligence thresholds
        self.BINARY_THRESHOLD = 2  # Max unique values for binary
        self.MULTICLASS_THRESHOLD = 20  # Max unique values for multiclass
        self.ID_PATTERNS = [r'id$', r'^id', r'_id$', r'key$', r'index$']
        self.TARGET_PATTERNS = [r'target', r'label', r'class', r'outcome', r'result', r'prediction']
        self.TIME_PATTERNS = [r'time', r'date', r'timestamp', r'created', r'updated']
    
    def analyze_dataset_intelligence(self, df: pd.DataFrame) -> IntelligenceResult:
        """
        Main intelligence analysis - determines problem type and column roles
        """
        # First get data profiling
        dataset_profile = self.profiling_engine.profile_dataset(df)
        
        # Analyze column roles
        column_roles = self._analyze_column_roles(df, dataset_profile.column_profiles)
        
        # Determine problem type
        problem_type, confidence, reasoning = self._determine_problem_type(df, column_roles, dataset_profile.column_profiles)
        
        # Generate ML strategy
        ml_strategy = self._generate_ml_strategy(problem_type, column_roles, dataset_profile)
        
        # Generate preprocessing requirements
        preprocessing_reqs = self._generate_preprocessing_requirements(column_roles, dataset_profile.column_profiles)
        
        # Generate recommendations
        recommendations = self._generate_intelligence_recommendations(problem_type, column_roles, dataset_profile)
        
        return IntelligenceResult(
            problem_type=problem_type,
            confidence_score=confidence,
            target_column=column_roles.get('target'),
            feature_columns=column_roles.get('features', []),
            timestamp_columns=column_roles.get('timestamps', []),
            identifier_columns=column_roles.get('identifiers', []),
            text_columns=column_roles.get('text', []),
            ignore_columns=column_roles.get('ignore', []),
            reasoning=reasoning,
            recommendations=recommendations,
            ml_strategy=ml_strategy,
            preprocessing_requirements=preprocessing_reqs
        )
    
    def _analyze_column_roles(self, df: pd.DataFrame, column_profiles: Dict) -> Dict[str, Any]:
        """Intelligently assign roles to each column"""
        roles = {
            'target': None,
            'features': [],
            'identifiers': [],
            'timestamps': [],
            'text': [],
            'ignore': []
        }
        
        for col_name, profile in column_profiles.items():
            role = self._classify_column_role(col_name, profile, df[col_name])
            
            if role == ColumnRole.TARGET:
                if roles['target'] is None:  # Only one target
                    roles['target'] = col_name
                else:
                    roles['features'].append(col_name)  # Multiple targets become features
            elif role == ColumnRole.FEATURE:
                roles['features'].append(col_name)
            elif role == ColumnRole.IDENTIFIER:
                roles['identifiers'].append(col_name)
            elif role == ColumnRole.TIMESTAMP:
                roles['timestamps'].append(col_name)
            elif role == ColumnRole.TEXT:
                roles['text'].append(col_name)
            elif role == ColumnRole.IGNORE:
                roles['ignore'].append(col_name)
        
        # If no target found, try to infer from last column or best candidate
        if roles['target'] is None:
            roles['target'] = self._infer_target_column(df, column_profiles, roles)
        
        return roles
    
    def _classify_column_role(self, col_name: str, profile, series: pd.Series) -> ColumnRole:
        """Classify individual column role based on patterns and characteristics"""
        col_lower = col_name.lower()
        
        # Check for identifier patterns
        for pattern in self.ID_PATTERNS:
            if re.search(pattern, col_lower):
                return ColumnRole.IDENTIFIER
        
        # Check for timestamp patterns
        for pattern in self.TIME_PATTERNS:
            if re.search(pattern, col_lower):
                return ColumnRole.TIMESTAMP
        
        # Check if it's a datetime column
        if profile.data_type == DataType.DATETIME:
            return ColumnRole.TIMESTAMP
        
        # Check for target patterns
        for pattern in self.TARGET_PATTERNS:
            if re.search(pattern, col_lower):
                return ColumnRole.TARGET
        
        # Check for text columns
        if profile.data_type == DataType.TEXT:
            return ColumnRole.TEXT
        
        # Check for constant or high missing columns (ignore)
        if profile.unique_count <= 1 or profile.missing_percentage > 90:
            return ColumnRole.IGNORE
        
        # Check for high cardinality identifiers
        if profile.unique_percentage > 95 and profile.unique_count > 100:
            return ColumnRole.IDENTIFIER
        
        # Default to feature
        return ColumnRole.FEATURE
    
    def _infer_target_column(self, df: pd.DataFrame, column_profiles: Dict, roles: Dict) -> Optional[str]:
        """Infer target column when not explicitly identified"""
        feature_candidates = roles['features'].copy()
        
        if not feature_candidates:
            return None
        
        # Scoring system for target likelihood
        target_scores = {}
        
        for col_name in feature_candidates:
            profile = column_profiles[col_name]
            score = 0
            
            # Prefer columns with moderate cardinality
            if 2 <= profile.unique_count <= 50:
                score += 30
            
            # Prefer categorical or boolean for classification
            if profile.data_type in [DataType.CATEGORICAL, DataType.BOOLEAN]:
                score += 20
            
            # Prefer columns at the end (common convention)
            col_position = list(df.columns).index(col_name)
            if col_position >= len(df.columns) - 3:  # Last 3 columns
                score += 15
            
            # Penalize high missing values
            score -= profile.missing_percentage * 0.5
            
            # Penalize very high cardinality
            if profile.unique_count > 100:
                score -= 20
            
            target_scores[col_name] = score
        
        # Return highest scoring column
        if target_scores:
            best_target = max(target_scores, key=target_scores.get)
            if target_scores[best_target] > 20:  # Minimum confidence threshold
                roles['features'].remove(best_target)
                return best_target
        
        return None
    
    def _determine_problem_type(self, df: pd.DataFrame, column_roles: Dict, column_profiles: Dict) -> Tuple[ProblemType, float, List[str]]:
        """Determine the ML problem type with confidence scoring"""
        reasoning = []
        
        # Check if we have a target column
        target_col = column_roles.get('target')
        if not target_col:
            reasoning.append("No clear target column identified - defaulting to exploratory analysis")
            return ProblemType.EXPLORATORY, 0.6, reasoning
        
        target_profile = column_profiles[target_col]
        
        # Check for time series
        if column_roles.get('timestamps'):
            reasoning.append(f"Timestamp columns detected: {column_roles['timestamps']}")
            return ProblemType.TIME_SERIES, 0.8, reasoning
        
        # Check for text analytics
        if target_profile.data_type == DataType.TEXT or column_roles.get('text'):
            reasoning.append("Text data detected - suitable for text analytics")
            return ProblemType.TEXT_ANALYTICS, 0.7, reasoning
        
        # Classification vs Regression based on target
        if target_profile.data_type == DataType.NUMERICAL:
            # Check if it's actually categorical (low unique count)
            if target_profile.unique_count <= self.BINARY_THRESHOLD:
                reasoning.append(f"Target '{target_col}' has {target_profile.unique_count} unique values - binary classification")
                return ProblemType.BINARY_CLASSIFICATION, 0.9, reasoning
            elif target_profile.unique_count <= self.MULTICLASS_THRESHOLD:
                reasoning.append(f"Target '{target_col}' has {target_profile.unique_count} unique values - multiclass classification")
                return ProblemType.MULTICLASS_CLASSIFICATION, 0.8, reasoning
            else:
                reasoning.append(f"Target '{target_col}' is numerical with {target_profile.unique_count} unique values - regression")
                return ProblemType.REGRESSION, 0.9, reasoning
        
        elif target_profile.data_type in [DataType.CATEGORICAL, DataType.BOOLEAN]:
            if target_profile.unique_count <= self.BINARY_THRESHOLD:
                reasoning.append(f"Target '{target_col}' is categorical with {target_profile.unique_count} classes - binary classification")
                return ProblemType.BINARY_CLASSIFICATION, 0.95, reasoning
            else:
                reasoning.append(f"Target '{target_col}' is categorical with {target_profile.unique_count} classes - multiclass classification")
                return ProblemType.MULTICLASS_CLASSIFICATION, 0.9, reasoning
        
        # Default fallback
        reasoning.append("Unable to determine clear problem type - defaulting to exploratory")
        return ProblemType.EXPLORATORY, 0.4, reasoning
    
    def _generate_ml_strategy(self, problem_type: ProblemType, column_roles: Dict, dataset_profile) -> Dict[str, Any]:
        """Generate ML strategy based on problem type"""
        strategy = {
            'problem_type': problem_type.value,
            'algorithms': [],
            'evaluation_metrics': [],
            'cross_validation': 'stratified_kfold' if 'classification' in problem_type.value else 'kfold',
            'test_size': 0.2
        }
        
        if problem_type == ProblemType.BINARY_CLASSIFICATION:
            strategy['algorithms'] = ['LogisticRegression', 'RandomForestClassifier', 'GradientBoostingClassifier']
            strategy['evaluation_metrics'] = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']
        
        elif problem_type == ProblemType.MULTICLASS_CLASSIFICATION:
            strategy['algorithms'] = ['RandomForestClassifier', 'GradientBoostingClassifier', 'SVC']
            strategy['evaluation_metrics'] = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']
        
        elif problem_type == ProblemType.REGRESSION:
            strategy['algorithms'] = ['LinearRegression', 'RandomForestRegressor', 'GradientBoostingRegressor']
            strategy['evaluation_metrics'] = ['mse', 'rmse', 'mae', 'r2_score']
            strategy['cross_validation'] = 'kfold'
        
        elif problem_type == ProblemType.TIME_SERIES:
            strategy['algorithms'] = ['ARIMA', 'LinearRegression', 'RandomForestRegressor']
            strategy['evaluation_metrics'] = ['mse', 'mae', 'mape']
            strategy['cross_validation'] = 'time_series_split'
        
        elif problem_type == ProblemType.TEXT_ANALYTICS:
            strategy['algorithms'] = ['TfidfVectorizer + LogisticRegression', 'TfidfVectorizer + SVC']
            strategy['evaluation_metrics'] = ['accuracy', 'precision', 'recall', 'f1_score']
        
        else:  # EXPLORATORY
            strategy['algorithms'] = ['PCA', 'KMeans', 'DBSCAN']
            strategy['evaluation_metrics'] = ['silhouette_score', 'calinski_harabasz_score']
            strategy['cross_validation'] = None
        
        return strategy
    
    def _generate_preprocessing_requirements(self, column_roles: Dict, column_profiles: Dict) -> List[str]:
        """Generate preprocessing requirements based on data characteristics"""
        requirements = []
        
        # Handle missing values
        missing_cols = [col for col, profile in column_profiles.items() 
                       if profile.missing_count > 0 and col in column_roles.get('features', [])]
        if missing_cols:
            requirements.append(f"Handle missing values in {len(missing_cols)} columns")
        
        # Handle categorical encoding
        categorical_cols = [col for col, profile in column_profiles.items() 
                          if profile.data_type == DataType.CATEGORICAL and col in column_roles.get('features', [])]
        if categorical_cols:
            requirements.append(f"Encode {len(categorical_cols)} categorical columns")
        
        # Handle numerical scaling
        numerical_cols = [col for col, profile in column_profiles.items() 
                         if profile.data_type == DataType.NUMERICAL and col in column_roles.get('features', [])]
        if numerical_cols:
            requirements.append(f"Scale {len(numerical_cols)} numerical columns")
        
        # Handle text processing
        if column_roles.get('text'):
            requirements.append(f"Process {len(column_roles['text'])} text columns with TF-IDF or embeddings")
        
        # Handle datetime features
        if column_roles.get('timestamps'):
            requirements.append(f"Extract features from {len(column_roles['timestamps'])} datetime columns")
        
        # Handle outliers
        outlier_cols = [col for col, profile in column_profiles.items() 
                       if hasattr(profile, 'outlier_count') and profile.outlier_count and profile.outlier_count > 0]
        if outlier_cols:
            requirements.append(f"Address outliers in {len(outlier_cols)} columns")
        
        return requirements
    
    def _generate_intelligence_recommendations(self, problem_type: ProblemType, column_roles: Dict, dataset_profile) -> List[str]:
        """Generate high-level recommendations based on intelligence analysis"""
        recommendations = []
        
        # Problem type specific recommendations
        if problem_type == ProblemType.BINARY_CLASSIFICATION:
            recommendations.append("Binary classification detected - ensure balanced classes for optimal performance")
        elif problem_type == ProblemType.MULTICLASS_CLASSIFICATION:
            recommendations.append("Multiclass classification - consider class imbalance and feature importance analysis")
        elif problem_type == ProblemType.REGRESSION:
            recommendations.append("Regression problem - focus on feature scaling and outlier handling")
        elif problem_type == ProblemType.TIME_SERIES:
            recommendations.append("Time series data - ensure proper temporal ordering and consider seasonality")
        elif problem_type == ProblemType.EXPLORATORY:
            recommendations.append("Exploratory analysis recommended - consider clustering or dimensionality reduction")
        
        # Data quality recommendations
        if dataset_profile.overall_quality_score < 70:
            recommendations.append("Data quality score is below 70% - address quality issues before ML training")
        
        # Feature engineering recommendations
        if len(column_roles.get('features', [])) < 3:
            recommendations.append("Limited features detected - consider feature engineering or external data sources")
        
        if len(column_roles.get('features', [])) > 50:
            recommendations.append("High dimensionality detected - consider feature selection or dimensionality reduction")
        
        # Identifier columns
        if column_roles.get('identifiers'):
            recommendations.append(f"Remove identifier columns {column_roles['identifiers']} before training")
        
        return recommendations

# Usage example
if __name__ == "__main__":
    # Test with sample data
    df = pd.DataFrame({
        'customer_id': range(1000),  # Identifier
        'age': np.random.randint(18, 80, 1000),  # Feature
        'income': np.random.normal(50000, 15000, 1000),  # Feature
        'category': np.random.choice(['A', 'B', 'C'], 1000),  # Feature
        'signup_date': pd.date_range('2020-01-01', periods=1000),  # Timestamp
        'churn': np.random.choice([0, 1], 1000)  # Target
    })
    
    intelligence_engine = DatasetIntelligenceEngine()
    result = intelligence_engine.analyze_dataset_intelligence(df)
    
    print(f"Problem Type: {result.problem_type.value}")
    print(f"Confidence: {result.confidence_score:.2f}")
    print(f"Target Column: {result.target_column}")
    print(f"Feature Columns: {result.feature_columns}")
    print(f"Identifier Columns: {result.identifier_columns}")
    print(f"Timestamp Columns: {result.timestamp_columns}")
    print(f"\nReasoning:")
    for reason in result.reasoning:
        print(f"  - {reason}")
    print(f"\nRecommendations:")
    for rec in result.recommendations:
        print(f"  - {rec}")