import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

class ModelTrainer:
    """Trains and optimizes ML models with automated preprocessing"""
    
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.imputers = {}
        self.feature_columns = []
        self.target_column = None
        
    def train_model(self, filepath, target_column, feature_columns, model_class, model_params, problem_type):
        """
        Complete training pipeline: preprocess -> train -> save
        
        Args:
            filepath (str): Path to dataset CSV
            target_column (str): Name of target column
            feature_columns (list): List of feature column names
            model_class: sklearn model class
            model_params (dict): Model parameters
            problem_type (str): Type of ML problem
            
        Returns:
            dict: Training results and metadata
        """
        # Load dataset
        df = pd.read_csv(filepath)
        
        # Store column info
        self.target_column = target_column
        self.feature_columns = feature_columns
        
        # Preprocess data
        X, y = self._preprocess_data(df, target_column, feature_columns)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if problem_type != 'Regression' else None
        )
        
        # Initialize and train model
        model = model_class(**model_params)
        model.fit(X_train, y_train)
        
        # Generate model name and save
        dataset_name = os.path.basename(filepath).replace('.csv', '')
        model_name = f"{dataset_name}_{problem_type.replace(' ', '_').lower()}_model"
        model_path = self._save_model(model, model_name)
        
        # Return training results
        return {
            'trained_model': model,
            'model_name': model_name,
            'model_path': model_path,
            'X_test': X_test,
            'y_test': y_test,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(feature_columns)
        }
    
    def _preprocess_data(self, df, target_column, feature_columns):
        """Preprocess features and target with missing value handling and encoding"""
        
        # Separate features and target
        X = df[feature_columns].copy()
        y = df[target_column].copy()
        
        # Handle missing values in features
        numeric_features = X.select_dtypes(include=[np.number]).columns
        categorical_features = X.select_dtypes(include=['object']).columns
        
        # Impute numeric features with median
        if len(numeric_features) > 0:
            numeric_imputer = SimpleImputer(strategy='median')
            X[numeric_features] = numeric_imputer.fit_transform(X[numeric_features])
            self.imputers['numeric'] = numeric_imputer
        
        # Impute categorical features with most frequent
        if len(categorical_features) > 0:
            categorical_imputer = SimpleImputer(strategy='most_frequent')
            X[categorical_features] = categorical_imputer.fit_transform(X[categorical_features])
            self.imputers['categorical'] = categorical_imputer
        
        # Encode categorical features
        for col in categorical_features:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.label_encoders[col] = le
        
        # Handle missing values in target
        if y.isnull().any():
            if pd.api.types.is_numeric_dtype(y):
                y = y.fillna(y.median())
            else:
                y = y.fillna(y.mode()[0])
        
        # Encode target if categorical
        if y.dtype == 'object':
            target_le = LabelEncoder()
            y = target_le.fit_transform(y)
            self.label_encoders['target'] = target_le
        
        # Scale numeric features
        if len(numeric_features) > 0:
            X[numeric_features] = self.scaler.fit_transform(X[numeric_features])
        
        return X.values, y
    
    def _save_model(self, model, model_name):
        """Save trained model with preprocessing components"""
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Package model with preprocessing components
        model_package = {
            'model': model,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'imputers': self.imputers,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column
        }
        
        # Save model
        model_path = os.path.join('models', f'{model_name}.pkl')
        joblib.dump(model_package, model_path)
        
        return model_path