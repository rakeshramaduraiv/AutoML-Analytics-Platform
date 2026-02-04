import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

@dataclass
class MLDecisionLog:
    """Auditable decision trace for ML model training"""
    
    # Core decisions
    model_choice: str
    target_column: str
    feature_columns: List[str]
    problem_type: str
    
    # Decision reasoning
    why_this_model: str
    why_this_target: str
    feature_selection_rationale: str
    
    # Assumptions made
    assumptions: List[str]
    
    # Known limitations
    known_limitations: List[str]
    
    # Data decisions
    preprocessing_steps: List[str]
    data_quality_score: float
    
    # Model configuration
    hyperparameters: Dict[str, Any]
    validation_strategy: str
    
    # Metadata
    decision_timestamp: str
    dataset_hash: str
    model_version: str
    
    def to_dict(self):
        return asdict(self)
    
    def to_json(self):
        return json.dumps(self.to_dict(), indent=2)

class MLDecisionEngine:
    """Generate explainable ML decision logs"""
    
    def create_decision_log(self, df, model_type, target_col, features, quality_score, dataset_hash):
        """Create comprehensive decision log"""
        
        # Determine problem type
        problem_type = self._determine_problem_type(df, target_col)
        
        # Generate model choice reasoning
        model_reasoning = self._explain_model_choice(model_type, problem_type, len(df))
        
        # Generate target selection reasoning
        target_reasoning = self._explain_target_selection(df, target_col)
        
        # Generate assumptions
        assumptions = self._identify_assumptions(df, problem_type, model_type)
        
        # Generate limitations
        limitations = self._identify_limitations(df, model_type, quality_score)
        
        # Generate preprocessing rationale
        preprocessing_steps = self._explain_preprocessing(df)
        
        return MLDecisionLog(
            model_choice=model_type,
            target_column=target_col,
            feature_columns=features,
            problem_type=problem_type,
            why_this_model=model_reasoning,
            why_this_target=target_reasoning,
            feature_selection_rationale=self._explain_feature_selection(df, features),
            assumptions=assumptions,
            known_limitations=limitations,
            preprocessing_steps=preprocessing_steps,
            data_quality_score=quality_score,
            hyperparameters=self._get_default_hyperparameters(model_type),
            validation_strategy="80/20 train-test split with cross-validation",
            decision_timestamp=datetime.now().isoformat(),
            dataset_hash=dataset_hash,
            model_version=self._generate_model_version(dataset_hash)
        )
    
    def _determine_problem_type(self, df, target_col):
        """Determine if classification or regression"""
        if target_col not in df.columns:
            return "unknown"
        
        unique_values = df[target_col].nunique()
        if unique_values <= 10 and df[target_col].dtype in ['object', 'int64']:
            return "classification"
        else:
            return "regression"
    
    def _explain_model_choice(self, model_type, problem_type, dataset_size):
        """Explain why this model was chosen"""
        explanations = {
            "RandomForest": f"RandomForest selected for {problem_type} due to: (1) Robust performance on tabular data, (2) Built-in feature importance, (3) Handles mixed data types well, (4) Good performance with {dataset_size} samples without extensive tuning",
            "LogisticRegression": f"LogisticRegression selected for {problem_type} due to: (1) Interpretable linear model, (2) Fast training on {dataset_size} samples, (3) Probabilistic outputs, (4) Good baseline for binary classification",
            "LinearRegression": f"LinearRegression selected for {problem_type} due to: (1) Simple interpretable model, (2) Fast training, (3) Good baseline for continuous targets, (4) Assumes linear relationships"
        }
        return explanations.get(model_type, f"{model_type} selected based on problem type {problem_type}")
    
    def _explain_target_selection(self, df, target_col):
        """Explain target column selection"""
        if target_col == df.columns[-1]:
            return f"Target column '{target_col}' selected as last column in dataset (common ML convention). Contains {df[target_col].nunique()} unique values."
        else:
            return f"Target column '{target_col}' manually specified. Contains {df[target_col].nunique()} unique values with data type {df[target_col].dtype}."
    
    def _explain_feature_selection(self, df, features):
        """Explain feature selection rationale"""
        numeric_features = len([f for f in features if df[f].dtype in ['int64', 'float64']])
        categorical_features = len(features) - numeric_features
        
        return f"Selected {len(features)} features: {numeric_features} numeric and {categorical_features} categorical. All non-target columns included for comprehensive model training."
    
    def _identify_assumptions(self, df, problem_type, model_type):
        """Identify key assumptions made"""
        assumptions = [
            f"Target variable is suitable for {problem_type} modeling",
            "Features are independent and informative for prediction",
            "Training data is representative of future data distribution",
            "Missing values can be imputed without significant bias"
        ]
        
        if model_type == "RandomForest":
            assumptions.append("Tree-based ensemble approach is appropriate for this data structure")
        elif model_type in ["LogisticRegression", "LinearRegression"]:
            assumptions.append("Linear relationships exist between features and target")
        
        return assumptions
    
    def _identify_limitations(self, df, model_type, quality_score):
        """Identify known limitations"""
        limitations = [
            f"Model trained on {len(df)} samples - performance may vary with different data volumes",
            "Feature engineering is minimal - domain expertise could improve results",
            "Hyperparameters use default values - tuning could improve performance"
        ]
        
        if quality_score < 80:
            limitations.append(f"Data quality score of {quality_score}% indicates potential data issues")
        
        if model_type == "RandomForest":
            limitations.append("Model may overfit on small datasets or with many irrelevant features")
        elif model_type in ["LogisticRegression", "LinearRegression"]:
            limitations.append("Linear model may miss non-linear relationships in data")
        
        return limitations
    
    def _explain_preprocessing(self, df):
        """Explain preprocessing decisions"""
        steps = [
            "Missing values filled with mean (numeric) or mode (categorical)",
            "Categorical variables encoded using LabelEncoder",
            "Features scaled using StandardScaler for consistent ranges"
        ]
        
        if df.duplicated().any():
            steps.append("Duplicate rows detected but retained for training")
        
        return steps
    
    def _get_default_hyperparameters(self, model_type):
        """Get default hyperparameters used"""
        defaults = {
            "RandomForest": {"n_estimators": 100, "random_state": 42, "max_depth": None},
            "LogisticRegression": {"random_state": 42, "max_iter": 1000},
            "LinearRegression": {"fit_intercept": True}
        }
        return defaults.get(model_type, {})
    
    def _generate_model_version(self, dataset_hash):
        """Generate model version based on dataset and timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        return f"v{timestamp}_{dataset_hash[:8]}"