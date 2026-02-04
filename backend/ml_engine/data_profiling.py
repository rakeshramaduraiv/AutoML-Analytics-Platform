"""
Enterprise Data Profiling & Quality Analysis Engine
Automatically profiles datasets and generates quality scores
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class DataType(Enum):
    NUMERICAL = "numerical"
    CATEGORICAL = "categorical"
    ORDINAL = "ordinal"
    BOOLEAN = "boolean"
    DATETIME = "datetime"
    TEXT = "text"
    MIXED = "mixed"
    UNKNOWN = "unknown"

class QualityIssue(Enum):
    HIGH_MISSING = "high_missing_values"
    CONSTANT_COLUMN = "constant_column"
    HIGH_CARDINALITY = "high_cardinality"
    OUTLIERS_DETECTED = "outliers_detected"
    INCONSISTENT_FORMAT = "inconsistent_format"
    DUPLICATE_ROWS = "duplicate_rows"
    SKEWED_DISTRIBUTION = "skewed_distribution"

@dataclass
class ColumnProfile:
    """Comprehensive column profiling data"""
    name: str
    data_type: DataType
    pandas_dtype: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    unique_percentage: float
    
    # Type-specific metrics
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    
    # Distribution info
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    outlier_count: Optional[int] = None
    
    # Categorical info
    top_values: Optional[Dict[str, int]] = None
    cardinality_ratio: Optional[float] = None
    
    # Quality flags
    quality_issues: List[QualityIssue] = field(default_factory=list)
    quality_score: float = 0.0
    recommendations: List[str] = field(default_factory=list)

@dataclass
class DatasetProfile:
    """Complete dataset profiling results"""
    total_rows: int
    total_columns: int
    memory_usage_mb: float
    duplicate_rows: int
    duplicate_percentage: float
    
    column_profiles: Dict[str, ColumnProfile]
    overall_quality_score: float
    quality_issues: List[QualityIssue]
    recommendations: List[str]
    
    # Data type summary
    data_type_distribution: Dict[str, int]
    processing_time_seconds: float

class DataProfilingEngine:
    """
    Enterprise data profiling engine
    Analyzes data quality, types, and generates actionable insights
    """
    
    # Quality thresholds (configurable)
    HIGH_MISSING_THRESHOLD = 0.5  # 50%
    HIGH_CARDINALITY_THRESHOLD = 0.8  # 80% unique values
    OUTLIER_Z_THRESHOLD = 3.0
    SKEWNESS_THRESHOLD = 2.0
    
    def __init__(self):
        self.datetime_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'\d{2}-\d{2}-\d{4}',  # MM-DD-YYYY
        ]
    
    def profile_dataset(self, df: pd.DataFrame) -> DatasetProfile:
        """
        Main profiling method - comprehensive dataset analysis
        """
        start_time = datetime.now()
        
        # Basic dataset metrics
        total_rows, total_columns = df.shape
        memory_usage_mb = df.memory_usage(deep=True).sum() / (1024 * 1024)
        duplicate_rows = df.duplicated().sum()
        duplicate_percentage = (duplicate_rows / total_rows) * 100 if total_rows > 0 else 0
        
        # Profile each column
        column_profiles = {}
        data_type_counts = {}
        
        for column in df.columns:
            profile = self._profile_column(df[column], column, total_rows)
            column_profiles[column] = profile
            
            # Count data types
            dtype_str = profile.data_type.value
            data_type_counts[dtype_str] = data_type_counts.get(dtype_str, 0) + 1
        
        # Calculate overall quality score
        overall_quality_score = self._calculate_overall_quality(column_profiles, duplicate_percentage)
        
        # Identify dataset-level issues
        dataset_issues = self._identify_dataset_issues(df, column_profiles, duplicate_percentage)
        
        # Generate dataset-level recommendations
        recommendations = self._generate_dataset_recommendations(column_profiles, dataset_issues)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return DatasetProfile(
            total_rows=total_rows,
            total_columns=total_columns,
            memory_usage_mb=memory_usage_mb,
            duplicate_rows=duplicate_rows,
            duplicate_percentage=duplicate_percentage,
            column_profiles=column_profiles,
            overall_quality_score=overall_quality_score,
            quality_issues=dataset_issues,
            recommendations=recommendations,
            data_type_distribution=data_type_counts,
            processing_time_seconds=processing_time
        )
    
    def _profile_column(self, series: pd.Series, column_name: str, total_rows: int) -> ColumnProfile:
        """Profile individual column comprehensively"""
        
        # Basic metrics
        missing_count = series.isnull().sum()
        missing_percentage = (missing_count / total_rows) * 100 if total_rows > 0 else 0
        unique_count = series.nunique()
        unique_percentage = (unique_count / total_rows) * 100 if total_rows > 0 else 0
        
        # Detect data type
        data_type = self._detect_data_type(series)
        
        # Initialize profile
        profile = ColumnProfile(
            name=column_name,
            data_type=data_type,
            pandas_dtype=str(series.dtype),
            missing_count=missing_count,
            missing_percentage=missing_percentage,
            unique_count=unique_count,
            unique_percentage=unique_percentage
        )
        
        # Type-specific analysis
        if data_type == DataType.NUMERICAL:
            self._analyze_numerical_column(series, profile)
        elif data_type == DataType.CATEGORICAL:
            self._analyze_categorical_column(series, profile)
        elif data_type == DataType.DATETIME:
            self._analyze_datetime_column(series, profile)
        elif data_type == DataType.TEXT:
            self._analyze_text_column(series, profile)
        
        # Quality assessment
        self._assess_column_quality(profile, total_rows)
        
        return profile
    
    def _detect_data_type(self, series: pd.Series) -> DataType:
        """Intelligent data type detection"""
        
        # Remove null values for analysis
        non_null_series = series.dropna()
        if len(non_null_series) == 0:
            return DataType.UNKNOWN
        
        # Check for boolean
        if series.dtype == 'bool' or set(non_null_series.unique()).issubset({0, 1, True, False, 'True', 'False', 'true', 'false'}):
            return DataType.BOOLEAN
        
        # Check for numerical
        if pd.api.types.is_numeric_dtype(series):
            return DataType.NUMERICAL
        
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return DataType.DATETIME
        
        # Try to parse as datetime
        if self._is_datetime_column(non_null_series):
            return DataType.DATETIME
        
        # Check if categorical (low cardinality)
        cardinality_ratio = len(non_null_series.unique()) / len(non_null_series)
        if cardinality_ratio < 0.1 and len(non_null_series.unique()) < 50:
            return DataType.CATEGORICAL
        
        # Check for text patterns
        if self._is_text_column(non_null_series):
            return DataType.TEXT
        
        # Default to categorical for string data
        if series.dtype == 'object':
            return DataType.CATEGORICAL
        
        return DataType.UNKNOWN
    
    def _is_datetime_column(self, series: pd.Series) -> bool:
        """Check if column contains datetime values"""
        sample_size = min(100, len(series))
        sample = series.head(sample_size).astype(str)
        
        datetime_matches = 0
        for value in sample:
            for pattern in self.datetime_patterns:
                if re.search(pattern, str(value)):
                    datetime_matches += 1
                    break
        
        return datetime_matches / sample_size > 0.7
    
    def _is_text_column(self, series: pd.Series) -> bool:
        """Check if column contains text data"""
        sample_size = min(100, len(series))
        sample = series.head(sample_size).astype(str)
        
        # Check average length and word count
        avg_length = sample.str.len().mean()
        avg_words = sample.str.split().str.len().mean()
        
        return avg_length > 20 or avg_words > 3
    
    def _analyze_numerical_column(self, series: pd.Series, profile: ColumnProfile):
        """Analyze numerical column"""
        non_null = series.dropna()
        if len(non_null) == 0:
            return
        
        profile.mean = float(non_null.mean())
        profile.median = float(non_null.median())
        profile.std = float(non_null.std())
        profile.min_value = float(non_null.min())
        profile.max_value = float(non_null.max())
        
        # Distribution analysis
        profile.skewness = float(non_null.skew())
        profile.kurtosis = float(non_null.kurtosis())
        
        # Outlier detection using Z-score
        z_scores = np.abs((non_null - profile.mean) / profile.std) if profile.std > 0 else np.zeros(len(non_null))
        profile.outlier_count = int((z_scores > self.OUTLIER_Z_THRESHOLD).sum())
    
    def _analyze_categorical_column(self, series: pd.Series, profile: ColumnProfile):
        """Analyze categorical column"""
        non_null = series.dropna()
        if len(non_null) == 0:
            return
        
        # Top values
        value_counts = non_null.value_counts().head(10)
        profile.top_values = value_counts.to_dict()
        
        # Cardinality analysis
        profile.cardinality_ratio = len(non_null.unique()) / len(non_null)
        
        profile.min_value = str(non_null.iloc[0]) if len(non_null) > 0 else None
        profile.max_value = str(non_null.iloc[-1]) if len(non_null) > 0 else None
    
    def _analyze_datetime_column(self, series: pd.Series, profile: ColumnProfile):
        """Analyze datetime column"""
        try:
            dt_series = pd.to_datetime(series, errors='coerce').dropna()
            if len(dt_series) == 0:
                return
            
            profile.min_value = str(dt_series.min())
            profile.max_value = str(dt_series.max())
        except:
            pass
    
    def _analyze_text_column(self, series: pd.Series, profile: ColumnProfile):
        """Analyze text column"""
        non_null = series.dropna().astype(str)
        if len(non_null) == 0:
            return
        
        # Text statistics
        lengths = non_null.str.len()
        profile.mean = float(lengths.mean())
        profile.median = float(lengths.median())
        profile.min_value = int(lengths.min())
        profile.max_value = int(lengths.max())
    
    def _assess_column_quality(self, profile: ColumnProfile, total_rows: int):
        """Assess column quality and generate recommendations"""
        
        # Check for high missing values
        if profile.missing_percentage > self.HIGH_MISSING_THRESHOLD * 100:
            profile.quality_issues.append(QualityIssue.HIGH_MISSING)
            profile.recommendations.append(f"High missing values ({profile.missing_percentage:.1f}%) - consider imputation or removal")
        
        # Check for constant columns
        if profile.unique_count <= 1:
            profile.quality_issues.append(QualityIssue.CONSTANT_COLUMN)
            profile.recommendations.append("Constant column - consider removal as it provides no information")
        
        # Check for high cardinality categorical
        if profile.data_type == DataType.CATEGORICAL and profile.unique_percentage > self.HIGH_CARDINALITY_THRESHOLD * 100:
            profile.quality_issues.append(QualityIssue.HIGH_CARDINALITY)
            profile.recommendations.append("High cardinality categorical - consider grouping rare categories")
        
        # Check for outliers in numerical data
        if profile.data_type == DataType.NUMERICAL and profile.outlier_count and profile.outlier_count > 0:
            outlier_percentage = (profile.outlier_count / total_rows) * 100
            if outlier_percentage > 5:  # More than 5% outliers
                profile.quality_issues.append(QualityIssue.OUTLIERS_DETECTED)
                profile.recommendations.append(f"Outliers detected ({profile.outlier_count} values) - review for data quality")
        
        # Check for skewed distribution
        if profile.data_type == DataType.NUMERICAL and profile.skewness and abs(profile.skewness) > self.SKEWNESS_THRESHOLD:
            profile.quality_issues.append(QualityIssue.SKEWED_DISTRIBUTION)
            profile.recommendations.append("Highly skewed distribution - consider transformation")
        
        # Calculate quality score (0-100)
        score = 100.0
        score -= min(profile.missing_percentage, 50)  # Penalize missing values
        score -= len(profile.quality_issues) * 10  # Penalize each quality issue
        if profile.unique_count <= 1:
            score = 0  # Constant columns get 0 score
        
        profile.quality_score = max(0, score)
    
    def _calculate_overall_quality(self, column_profiles: Dict[str, ColumnProfile], duplicate_percentage: float) -> float:
        """Calculate overall dataset quality score"""
        if not column_profiles:
            return 0.0
        
        # Average column quality scores
        column_scores = [profile.quality_score for profile in column_profiles.values()]
        avg_column_score = sum(column_scores) / len(column_scores)
        
        # Penalize duplicates
        duplicate_penalty = min(duplicate_percentage, 20)  # Max 20 point penalty
        
        overall_score = avg_column_score - duplicate_penalty
        return max(0, min(100, overall_score))
    
    def _identify_dataset_issues(self, df: pd.DataFrame, column_profiles: Dict[str, ColumnProfile], duplicate_percentage: float) -> List[QualityIssue]:
        """Identify dataset-level quality issues"""
        issues = []
        
        if duplicate_percentage > 10:
            issues.append(QualityIssue.DUPLICATE_ROWS)
        
        # Check if too many columns have quality issues
        columns_with_issues = sum(1 for profile in column_profiles.values() if profile.quality_issues)
        if columns_with_issues > len(column_profiles) * 0.5:
            issues.append(QualityIssue.INCONSISTENT_FORMAT)
        
        return issues
    
    def _generate_dataset_recommendations(self, column_profiles: Dict[str, ColumnProfile], issues: List[QualityIssue]) -> List[str]:
        """Generate dataset-level recommendations"""
        recommendations = []
        
        if QualityIssue.DUPLICATE_ROWS in issues:
            recommendations.append("Remove duplicate rows to improve data quality")
        
        # Count columns by type for recommendations
        numerical_cols = sum(1 for p in column_profiles.values() if p.data_type == DataType.NUMERICAL)
        categorical_cols = sum(1 for p in column_profiles.values() if p.data_type == DataType.CATEGORICAL)
        
        if numerical_cols > 0:
            recommendations.append("Consider feature scaling for numerical columns before ML training")
        
        if categorical_cols > 0:
            recommendations.append("Consider encoding categorical variables for ML algorithms")
        
        # Missing value strategy
        high_missing_cols = sum(1 for p in column_profiles.values() if QualityIssue.HIGH_MISSING in p.quality_issues)
        if high_missing_cols > 0:
            recommendations.append(f"Develop missing value strategy for {high_missing_cols} columns with high missing rates")
        
        return recommendations

# Usage example
if __name__ == "__main__":
    # Test with sample data
    import pandas as pd
    
    # Create sample dataset
    df = pd.DataFrame({
        'numeric_col': [1, 2, 3, 4, 5, None, 100],  # Has outlier and missing
        'categorical_col': ['A', 'B', 'A', 'C', 'A', 'B', 'A'],
        'text_col': ['This is a long text', 'Another long text', 'Short', None, 'Very long text here', 'Text', 'More text'],
        'constant_col': [1, 1, 1, 1, 1, 1, 1],  # Constant column
        'high_missing': [1, None, None, None, None, None, 2]  # High missing
    })
    
    profiler = DataProfilingEngine()
    profile = profiler.profile_dataset(df)
    
    print(f"Dataset Quality Score: {profile.overall_quality_score:.1f}/100")
    print(f"Total Rows: {profile.total_rows}")
    print(f"Total Columns: {profile.total_columns}")
    print(f"Duplicate Rows: {profile.duplicate_rows} ({profile.duplicate_percentage:.1f}%)")
    print(f"Processing Time: {profile.processing_time_seconds:.2f}s")
    
    print("\nColumn Profiles:")
    for name, col_profile in profile.column_profiles.items():
        print(f"  {name}: {col_profile.data_type.value} (Quality: {col_profile.quality_score:.1f}/100)")
        if col_profile.quality_issues:
            print(f"    Issues: {[issue.value for issue in col_profile.quality_issues]}")
    
    print(f"\nRecommendations:")
    for rec in profile.recommendations:
        print(f"  - {rec}")