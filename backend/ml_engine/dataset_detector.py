import pandas as pd
import numpy as np
from datetime import datetime

class DatasetDetector:
    """Automatically detects dataset type and target column"""
    
    def __init__(self):
        self.target_keywords = ['target', 'label', 'class', 'y', 'output', 'prediction', 
                               'churn', 'fraud', 'default', 'outcome', 'result']
        self.time_keywords = ['date', 'time', 'timestamp', 'datetime', 'created_at', 
                             'updated_at', 'year', 'month', 'day']
    
    def analyze_dataset(self, filepath):
        """Main analysis function that detects all dataset characteristics"""
        df = pd.read_csv(filepath)
        
        # Detect time column
        time_column = self._detect_time_column(df)
        
        # Detect target column
        target_column = self._detect_target_column(df)
        
        # Get feature columns (all except target and time)
        feature_columns = self._get_feature_columns(df, target_column, time_column)
        
        # Detect problem type
        problem_type, reasoning = self._detect_problem_type(df, target_column, time_column)
        
        return {
            'dataset_name': filepath.split('/')[-1].replace('.csv', ''),
            'problem_type': problem_type,
            'target_column': target_column,
            'feature_columns': feature_columns,
            'time_column': time_column,
            'detection_reasoning': reasoning
        }
    
    def _detect_time_column(self, df):
        """Detect time-based columns"""
        for col in df.columns:
            # Check column name for time keywords
            if any(keyword in col.lower() for keyword in self.time_keywords):
                return col
            
            # Check if column contains datetime-like data
            try:
                pd.to_datetime(df[col].dropna().head(10))
                return col
            except:
                continue
        
        return None
    
    def _detect_target_column(self, df):
        """Detect the target/label column"""
        # First, check for explicit target keywords in column names
        for col in df.columns:
            if any(keyword in col.lower() for keyword in self.target_keywords):
                return col
        
        # If no explicit target found, use last column as default
        return df.columns[-1]
    
    def _get_feature_columns(self, df, target_column, time_column):
        """Get feature columns (exclude target and time columns)"""
        feature_cols = df.columns.tolist()
        
        if target_column in feature_cols:
            feature_cols.remove(target_column)
        
        if time_column and time_column in feature_cols:
            feature_cols.remove(time_column)
        
        return feature_cols
    
    def _detect_problem_type(self, df, target_column, time_column):
        """Detect the ML problem type based on target and time columns"""
        target_data = df[target_column]
        unique_values = target_data.nunique()
        
        # Time Series Detection
        if time_column is not None:
            if pd.api.types.is_numeric_dtype(target_data):
                return 'Time Series', f'Time column "{time_column}" detected with numeric target "{target_column}"'
            else:
                return 'Time Series', f'Time column "{time_column}" detected with categorical target "{target_column}"'
        
        # Classification vs Regression Detection
        if pd.api.types.is_numeric_dtype(target_data):
            # Check if it's actually categorical (few unique values)
            if unique_values <= 2:
                return 'Binary Classification', f'Target "{target_column}" has {unique_values} unique numeric values'
            elif unique_values <= 20:
                return 'Multiclass Classification', f'Target "{target_column}" has {unique_values} unique numeric values'
            else:
                return 'Regression', f'Target "{target_column}" is numeric with {unique_values} unique values (continuous)'
        else:
            # Categorical target
            if unique_values <= 2:
                return 'Binary Classification', f'Target "{target_column}" has {unique_values} unique categories: {list(target_data.unique())}'
            else:
                return 'Multiclass Classification', f'Target "{target_column}" has {unique_values} unique categories'