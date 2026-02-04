import pandas as pd
import numpy as np
from datetime import datetime

class DataQualityEngine:
    """Industry-standard data quality assessment (0-100 score)"""
    
    def calculate_quality_score(self, df):
        """Calculate comprehensive data quality index"""
        if df is None or df.empty:
            return {'overall_score': 0, 'details': 'Empty dataset'}
        
        scores = {}
        
        # 1. Completeness Score (40% weight)
        scores['completeness'] = self._calculate_completeness(df)
        
        # 2. Uniqueness Score (25% weight) 
        scores['uniqueness'] = self._calculate_uniqueness(df)
        
        # 3. Validity Score (20% weight)
        scores['validity'] = self._calculate_validity(df)
        
        # 4. Consistency Score (15% weight)
        scores['consistency'] = self._calculate_consistency(df)
        
        # Weighted overall score
        overall_score = (
            scores['completeness'] * 0.40 +
            scores['uniqueness'] * 0.25 +
            scores['validity'] * 0.20 +
            scores['consistency'] * 0.15
        )
        
        return {
            'overall_score': round(overall_score, 1),
            'component_scores': scores,
            'assessment_details': self._generate_assessment_details(df, scores),
            'ml_readiness': self._assess_ml_readiness(overall_score, scores),
            'assessed_at': datetime.now().isoformat()
        }
    
    def _calculate_completeness(self, df):
        """Missing values assessment"""
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()
        completeness_ratio = (total_cells - missing_cells) / total_cells
        return round(completeness_ratio * 100, 1)
    
    def _calculate_uniqueness(self, df):
        """Duplicate rows assessment"""
        total_rows = len(df)
        unique_rows = len(df.drop_duplicates())
        uniqueness_ratio = unique_rows / total_rows
        return round(uniqueness_ratio * 100, 1)
    
    def _calculate_validity(self, df):
        """Data type consistency and outlier detection"""
        validity_scores = []
        
        for column in df.columns:
            col_score = 100  # Start with perfect score
            
            # Check for mixed data types in supposedly numeric columns
            if df[column].dtype in ['object']:
                # Try to convert to numeric and see failure rate
                try:
                    pd.to_numeric(df[column], errors='coerce')
                    numeric_conversion_success = df[column].notna().sum() / len(df[column])
                    if numeric_conversion_success < 0.8:  # Less than 80% convertible
                        col_score -= 20
                except:
                    pass
            
            # Outlier detection for numeric columns
            if df[column].dtype in ['int64', 'float64']:
                Q1 = df[column].quantile(0.25)
                Q3 = df[column].quantile(0.75)
                IQR = Q3 - Q1
                outliers = df[(df[column] < (Q1 - 1.5 * IQR)) | (df[column] > (Q3 + 1.5 * IQR))]
                outlier_ratio = len(outliers) / len(df)
                if outlier_ratio > 0.1:  # More than 10% outliers
                    col_score -= (outlier_ratio * 100)
            
            validity_scores.append(max(0, col_score))
        
        return round(np.mean(validity_scores), 1)
    
    def _calculate_consistency(self, df):
        """Pattern consistency and cardinality issues"""
        consistency_scores = []
        
        for column in df.columns:
            col_score = 100
            
            # High cardinality check for categorical columns
            if df[column].dtype == 'object':
                unique_ratio = df[column].nunique() / len(df)
                if unique_ratio > 0.8:  # Too many unique values for categorical
                    col_score -= 30
            
            # Low cardinality check for numeric columns
            if df[column].dtype in ['int64', 'float64']:
                unique_ratio = df[column].nunique() / len(df)
                if unique_ratio < 0.1:  # Too few unique values for numeric
                    col_score -= 20
            
            consistency_scores.append(max(0, col_score))
        
        return round(np.mean(consistency_scores), 1)
    
    def _generate_assessment_details(self, df, scores):
        """Generate detailed quality assessment"""
        details = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_values_count': df.isnull().sum().sum(),
            'duplicate_rows_count': len(df) - len(df.drop_duplicates()),
            'numeric_columns': len(df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': len(df.select_dtypes(include=['object']).columns),
            'quality_issues': []
        }
        
        # Identify specific issues
        if scores['completeness'] < 80:
            details['quality_issues'].append('High missing value rate detected')
        
        if scores['uniqueness'] < 90:
            details['quality_issues'].append('Significant duplicate rows found')
        
        if scores['validity'] < 70:
            details['quality_issues'].append('Data type inconsistencies or outliers detected')
        
        if scores['consistency'] < 75:
            details['quality_issues'].append('Cardinality issues in column distributions')
        
        return details
    
    def _assess_ml_readiness(self, overall_score, scores):
        """Assess if dataset is ready for ML training"""
        if overall_score >= 80:
            return {
                'status': 'READY',
                'confidence': 'HIGH',
                'recommendation': 'Dataset meets quality standards for ML training'
            }
        elif overall_score >= 60:
            return {
                'status': 'NEEDS_CLEANING',
                'confidence': 'MEDIUM', 
                'recommendation': 'Address quality issues before ML training'
            }
        else:
            return {
                'status': 'NOT_READY',
                'confidence': 'LOW',
                'recommendation': 'Significant data quality improvements required'
            }