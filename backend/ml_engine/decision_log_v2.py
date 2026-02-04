"""
ML Decision Logging Engine
Creates transparent, machine-readable logs of ML decisions
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import hashlib

@dataclass
class MLDecisionLog:
    """Machine-readable log of ML training decisions"""
    
    # Identifiers
    model_id: str
    model_version: str
    dataset_hash: str
    timestamp: str
    
    # Problem Definition
    problem_type: str  # "classification" | "regression"
    target_column: str
    feature_columns: List[str]
    
    # Algorithm Selection
    selected_algorithm: str
    algorithm_rationale: str
    alternatives_considered: List[str]
    selection_criteria: Dict[str, Any]
    
    # Data Decisions
    data_quality_score: float
    preprocessing_steps: List[str]
    feature_engineering: List[str]
    
    # Model Configuration
    hyperparameters: Dict[str, Any]
    training_config: Dict[str, Any]
    
    # Assumptions & Limitations
    assumptions: List[str]
    limitations: List[str]
    known_biases: List[str]
    
    # Performance
    validation_metrics: Dict[str, float]
    training_time_seconds: float
    
    # Reproducibility
    random_seed: int
    environment_info: Dict[str, str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2)

class MLDecisionEngine:
    """
    Creates transparent ML decision logs for audit and reproducibility
    """
    
    def create_decision_log(self, df, model_type: str, target_col: str, 
                          feature_cols: List[str], quality_score: float,
                          dataset_hash: str) -> MLDecisionLog:
        """
        Create comprehensive decision log for ML training
        """
        timestamp = datetime.now().isoformat()
        model_id = self._generate_model_id(dataset_hash, model_type, timestamp)
        model_version = self._generate_version(timestamp)
        
        # Determine problem type
        problem_type = self._determine_problem_type(df, target_col)
        
        # Algorithm selection logic
        algorithm_info = self._select_algorithm(df, problem_type, quality_score)
        
        # Preprocessing decisions
        preprocessing = self._determine_preprocessing(df)
        
        # Generate assumptions and limitations
        assumptions = self._generate_assumptions(df, problem_type, model_type)
        limitations = self._generate_limitations(df, model_type, quality_score)
        
        return MLDecisionLog(
            model_id=model_id,
            model_version=model_version,
            dataset_hash=dataset_hash,
            timestamp=timestamp,
            
            problem_type=problem_type,
            target_column=target_col,
            feature_columns=feature_cols,
            
            selected_algorithm=algorithm_info["selected"],
            algorithm_rationale=algorithm_info["rationale"],
            alternatives_considered=algorithm_info["alternatives"],
            selection_criteria=algorithm_info["criteria"],
            
            data_quality_score=quality_score,
            preprocessing_steps=preprocessing["steps"],
            feature_engineering=preprocessing["feature_engineering"],
            
            hyperparameters=self._get_default_hyperparameters(model_type),
            training_config={
                "test_size": 0.2,
                "cross_validation": "5-fold",
                "stratify": problem_type == "classification"
            },
            
            assumptions=assumptions,
            limitations=limitations,
            known_biases=self._identify_potential_biases(df),
            
            validation_metrics={},  # Will be filled after training
            training_time_seconds=0.0,  # Will be filled after training
            
            random_seed=42,
            environment_info=self._get_environment_info()
        )
    
    def _generate_model_id(self, dataset_hash: str, model_type: str, timestamp: str) -> str:
        """Generate unique model identifier"""
        combined = f"{dataset_hash}_{model_type}_{timestamp}"
        return hashlib.md5(combined.encode()).hexdigest()[:12]
    
    def _generate_version(self, timestamp: str) -> str:
        """Generate semantic version from timestamp"""
        dt = datetime.fromisoformat(timestamp)
        return f"v{dt.strftime('%Y%m%d_%H%M')}"
    
    def _determine_problem_type(self, df, target_col: str) -> str:
        """Determine if classification or regression"""
        target_data = df[target_col].dropna()
        
        if target_data.dtype == 'object':
            return "classification"
        
        unique_values = len(target_data.unique())
        total_values = len(target_data)
        
        # If less than 10 unique values or less than 5% unique, likely classification
        if unique_values < 10 or (unique_values / total_values) < 0.05:
            return "classification"
        else:
            return "regression"
    
    def _select_algorithm(self, df, problem_type: str, quality_score: float) -> Dict[str, Any]:
        """Algorithm selection with transparent rationale"""
        
        n_samples = len(df)
        n_features = len(df.columns) - 1  # Excluding target
        
        if problem_type == "classification":
            if n_samples < 1000:
                selected = "LogisticRegression"
                rationale = "Small dataset (<1000 samples) - linear model for interpretability"
                alternatives = ["RandomForestClassifier", "SVC"]
            else:
                selected = "RandomForestClassifier"
                rationale = "Medium/large dataset - ensemble method for robustness"
                alternatives = ["LogisticRegression", "GradientBoostingClassifier"]
        else:  # regression
            if n_samples < 1000:
                selected = "LinearRegression"
                rationale = "Small dataset (<1000 samples) - linear model for interpretability"
                alternatives = ["RandomForestRegressor", "SVR"]
            else:
                selected = "RandomForestRegressor"
                rationale = "Medium/large dataset - ensemble method for robustness"
                alternatives = ["LinearRegression", "GradientBoostingRegressor"]
        
        criteria = {
            "dataset_size": n_samples,
            "feature_count": n_features,
            "data_quality": quality_score,
            "interpretability_priority": n_samples < 1000,
            "performance_priority": n_samples >= 1000
        }
        
        return {
            "selected": selected,
            "rationale": rationale,
            "alternatives": alternatives,
            "criteria": criteria
        }
    
    def _determine_preprocessing(self, df) -> Dict[str, List[str]]:
        """Determine preprocessing steps based on data characteristics"""
        steps = []
        feature_engineering = []
        
        # Missing value handling
        if df.isnull().sum().sum() > 0:
            steps.append("Handle missing values (median for numeric, mode for categorical)")
        
        # Categorical encoding
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            steps.append("Label encode categorical variables")
            feature_engineering.append("Categorical variable encoding")
        
        # Feature scaling
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 1:
            steps.append("StandardScaler for feature normalization")
            feature_engineering.append("Feature scaling/normalization")
        
        return {
            "steps": steps,
            "feature_engineering": feature_engineering
        }
    
    def _generate_assumptions(self, df, problem_type: str, model_type: str) -> List[str]:
        """Generate explicit assumptions made during training"""
        assumptions = [
            "Target variable is correctly labeled",
            "Training data is representative of production data",
            "Features are available at prediction time"
        ]
        
        if problem_type == "classification":
            assumptions.append("Class distribution in training reflects production")
        
        if "Forest" in model_type:
            assumptions.append("Feature interactions are important for prediction")
        else:
            assumptions.append("Linear relationships exist between features and target")
        
        return assumptions
    
    def _generate_limitations(self, df, model_type: str, quality_score: float) -> List[str]:
        """Generate explicit limitations of the model"""
        limitations = []
        
        if len(df) < 1000:
            limitations.append("Small dataset may limit model generalization")
        
        if quality_score < 80:
            limitations.append("Data quality issues may impact model performance")
        
        if len(df.columns) < 5:
            limitations.append("Limited feature set may constrain predictive power")
        
        limitations.append("Model performance may degrade over time (concept drift)")
        limitations.append("Predictions are probabilistic, not deterministic")
        
        return limitations
    
    def _identify_potential_biases(self, df) -> List[str]:
        """Identify potential sources of bias in the data"""
        biases = []
        
        # Check for class imbalance
        for col in df.select_dtypes(include=['object']).columns:
            value_counts = df[col].value_counts()
            if len(value_counts) > 1:
                max_ratio = value_counts.iloc[0] / value_counts.iloc[1]
                if max_ratio > 10:
                    biases.append(f"Severe class imbalance in column '{col}'")
        
        # Check for missing data patterns
        missing_cols = df.columns[df.isnull().sum() > 0]
        if len(missing_cols) > 0:
            biases.append("Missing data may introduce selection bias")
        
        return biases
    
    def _get_default_hyperparameters(self, model_type: str) -> Dict[str, Any]:
        """Get default hyperparameters for the model"""
        defaults = {
            "RandomForestClassifier": {"n_estimators": 100, "random_state": 42},
            "RandomForestRegressor": {"n_estimators": 100, "random_state": 42},
            "LogisticRegression": {"random_state": 42, "max_iter": 1000},
            "LinearRegression": {},
        }
        return defaults.get(model_type, {})
    
    def _get_environment_info(self) -> Dict[str, str]:
        """Get environment information for reproducibility"""
        import sys
        import sklearn
        
        return {
            "python_version": sys.version,
            "sklearn_version": sklearn.__version__,
            "platform": sys.platform
        }