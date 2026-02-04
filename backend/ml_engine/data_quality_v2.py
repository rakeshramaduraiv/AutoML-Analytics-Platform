"""
Data Quality Assessment Engine
Provides measurable quality scores with transparent calculation
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np

@dataclass
class QualityMetrics:
    completeness_score: float  # 0-100
    consistency_score: float   # 0-100
    validity_score: float      # 0-100
    uniqueness_score: float    # 0-100
    overall_score: float       # 0-100
    ml_ready: bool
    blocking_issues: List[str]
    recommendations: List[str]

class DataQualityEngine:
    """
    Calculates transparent, measurable data quality scores
    """
    
    ML_READINESS_THRESHOLD = 70  # Minimum score for ML training
    
    def calculate_quality_score(self, df: pd.DataFrame) -> QualityMetrics:
        """
        Calculate comprehensive data quality score
        Returns measurable metrics with transparent calculation
        """
        completeness = self._calculate_completeness(df)
        consistency = self._calculate_consistency(df)
        validity = self._calculate_validity(df)
        uniqueness = self._calculate_uniqueness(df)
        
        # Weighted average (can be tuned based on use case)
        overall = (completeness * 0.3 + 
                  consistency * 0.25 + 
                  validity * 0.25 + 
                  uniqueness * 0.2)
        
        ml_ready = overall >= self.ML_READINESS_THRESHOLD
        blocking_issues = self._identify_blocking_issues(df, overall)
        recommendations = self._generate_recommendations(df, completeness, consistency, validity, uniqueness)
        
        return QualityMetrics(
            completeness_score=completeness,
            consistency_score=consistency,
            validity_score=validity,
            uniqueness_score=uniqueness,
            overall_score=overall,
            ml_ready=ml_ready,
            blocking_issues=blocking_issues,
            recommendations=recommendations
        )
    
    def _calculate_completeness(self, df: pd.DataFrame) -> float:
        """
        Completeness: Percentage of non-null values
        Formula: (total_values - null_values) / total_values * 100
        """
        total_values = df.size
        null_values = df.isnull().sum().sum()
        return ((total_values - null_values) / total_values) * 100
    
    def _calculate_consistency(self, df: pd.DataFrame) -> float:
        """
        Consistency: Data type consistency and format uniformity
        """
        consistency_scores = []
        
        for column in df.columns:
            col_data = df[column].dropna()
            if len(col_data) == 0:
                consistency_scores.append(0)
                continue
            
            # Check data type consistency
            if df[column].dtype == 'object':
                # For string columns, check format consistency
                if col_data.str.len().std() == 0:  # All same length
                    consistency_scores.append(100)
                else:
                    # Penalize high variance in string lengths
                    length_cv = col_data.str.len().std() / col_data.str.len().mean()
                    score = max(0, 100 - (length_cv * 50))
                    consistency_scores.append(score)
            else:
                # For numeric columns, check for outliers
                Q1 = col_data.quantile(0.25)
                Q3 = col_data.quantile(0.75)
                IQR = Q3 - Q1
                outliers = ((col_data < (Q1 - 1.5 * IQR)) | (col_data > (Q3 + 1.5 * IQR))).sum()
                outlier_ratio = outliers / len(col_data)
                score = max(0, 100 - (outlier_ratio * 100))
                consistency_scores.append(score)
        
        return np.mean(consistency_scores) if consistency_scores else 0
    
    def _calculate_validity(self, df: pd.DataFrame) -> float:
        """
        Validity: Percentage of values that meet expected constraints
        """
        validity_scores = []
        
        for column in df.columns:
            col_data = df[column].dropna()
            if len(col_data) == 0:
                validity_scores.append(0)
                continue
            
            if df[column].dtype == 'object':
                # Check for obviously invalid string values
                invalid_count = 0
                for value in col_data:
                    if isinstance(value, str):
                        # Check for common invalid patterns
                        if value.strip() == '' or value.lower() in ['null', 'none', 'n/a', 'na']:
                            invalid_count += 1
                validity_scores.append(max(0, 100 - (invalid_count / len(col_data) * 100)))
            else:
                # For numeric columns, check for infinite or extremely large values
                invalid_count = np.isinf(col_data).sum() + (np.abs(col_data) > 1e10).sum()
                validity_scores.append(max(0, 100 - (invalid_count / len(col_data) * 100)))
        
        return np.mean(validity_scores) if validity_scores else 0
    
    def _calculate_uniqueness(self, df: pd.DataFrame) -> float:
        """
        Uniqueness: Appropriate level of uniqueness per column type
        """
        uniqueness_scores = []
        
        for column in df.columns:
            col_data = df[column].dropna()
            if len(col_data) == 0:
                uniqueness_scores.append(0)
                continue
            
            unique_ratio = len(col_data.unique()) / len(col_data)
            
            # Different expectations for different column types
            if df[column].dtype == 'object':
                # String columns: moderate uniqueness is good
                if 0.1 <= unique_ratio <= 0.9:
                    uniqueness_scores.append(100)
                else:
                    # Penalize too unique (might be IDs) or too repetitive
                    score = 100 - abs(unique_ratio - 0.5) * 100
                    uniqueness_scores.append(max(0, score))
            else:
                # Numeric columns: higher uniqueness is generally better
                uniqueness_scores.append(unique_ratio * 100)
        
        return np.mean(uniqueness_scores) if uniqueness_scores else 0
    
    def _identify_blocking_issues(self, df: pd.DataFrame, overall_score: float) -> List[str]:
        """Identify issues that block ML training"""
        issues = []
        
        if len(df) < 10:
            issues.append("Dataset too small for ML training (minimum 10 rows)")
        
        if len(df.columns) < 2:
            issues.append("Need at least 2 columns (features + target)")
        
        missing_ratio = df.isnull().sum().sum() / df.size
        if missing_ratio > 0.8:
            issues.append("Excessive missing values (>80%)")
        
        if overall_score < self.ML_READINESS_THRESHOLD:
            issues.append(f"Overall quality score {overall_score:.1f} below threshold {self.ML_READINESS_THRESHOLD}")
        
        return issues
    
    def _generate_recommendations(self, df: pd.DataFrame, completeness: float, 
                                consistency: float, validity: float, uniqueness: float) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if completeness < 90:
            recommendations.append("Consider imputation strategies for missing values")
        
        if consistency < 80:
            recommendations.append("Review data formats and handle outliers")
        
        if validity < 85:
            recommendations.append("Validate and clean invalid data entries")
        
        if uniqueness < 70:
            recommendations.append("Check for duplicate records or low-variance features")
        
        # Column-specific recommendations
        for column in df.columns:
            if df[column].isnull().sum() / len(df) > 0.5:
                recommendations.append(f"Column '{column}' has >50% missing values - consider removal")
        
        return recommendations