from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression

class ModelSelector:
    """Automatically selects optimal ML algorithm based on problem type"""
    
    def __init__(self):
        # Define model mappings for each problem type
        self.model_mappings = {
            'Binary Classification': {
                'baseline': {
                    'name': 'Logistic Regression',
                    'class': LogisticRegression,
                    'params': {'random_state': 42, 'max_iter': 1000}
                },
                'default': {
                    'name': 'Random Forest',
                    'class': RandomForestClassifier,
                    'params': {'n_estimators': 100, 'random_state': 42}
                }
            },
            'Multiclass Classification': {
                'baseline': {
                    'name': 'Random Forest',
                    'class': RandomForestClassifier,
                    'params': {'n_estimators': 100, 'random_state': 42}
                },
                'default': {
                    'name': 'Random Forest',
                    'class': RandomForestClassifier,
                    'params': {'n_estimators': 100, 'random_state': 42}
                }
            },
            'Regression': {
                'baseline': {
                    'name': 'Linear Regression',
                    'class': LinearRegression,
                    'params': {}
                },
                'default': {
                    'name': 'Random Forest Regressor',
                    'class': RandomForestRegressor,
                    'params': {'n_estimators': 100, 'random_state': 42}
                }
            },
            'Time Series': {
                'baseline': {
                    'name': 'ARIMA',
                    'class': None,  # Placeholder - not implemented yet
                    'params': {}
                },
                'default': {
                    'name': 'ARIMA',
                    'class': None,  # Placeholder - not implemented yet
                    'params': {}
                }
            }
        }
    
    def select_model(self, problem_type, dataset_size=None):
        """
        Select the best model based on problem type and dataset characteristics
        
        Args:
            problem_type (str): The detected problem type
            dataset_size (int, optional): Number of samples in dataset
            
        Returns:
            dict: Model selection results with reasoning
        """
        if problem_type not in self.model_mappings:
            raise ValueError(f"Unsupported problem type: {problem_type}")
        
        models = self.model_mappings[problem_type]
        baseline_model = models['baseline']
        selected_model = models['default']
        
        # Generate selection reasoning
        reasoning = self._generate_reasoning(problem_type, selected_model['name'], 
                                           baseline_model['name'], dataset_size)
        
        return {
            'problem_type': problem_type,
            'selected_model': selected_model['name'],
            'selected_model_class': selected_model['class'],
            'selected_model_params': selected_model['params'],
            'baseline_model': baseline_model['name'],
            'baseline_model_class': baseline_model['class'],
            'baseline_model_params': baseline_model['params'],
            'selection_reasoning': reasoning
        }
    
    def _generate_reasoning(self, problem_type, selected_model, baseline_model, dataset_size):
        """Generate human-readable reasoning for model selection"""
        
        reasoning_templates = {
            'Binary Classification': f"Selected {selected_model} for binary classification. "
                                   f"Random Forest handles feature interactions well and provides good baseline performance. "
                                   f"Baseline alternative: {baseline_model}.",
            
            'Multiclass Classification': f"Selected {selected_model} for multiclass classification. "
                                       f"Random Forest naturally handles multiple classes and provides feature importance. "
                                       f"Excellent for interpretability and robust performance.",
            
            'Regression': f"Selected {selected_model} for regression task. "
                         f"Random Forest Regressor captures non-linear relationships and handles mixed data types well. "
                         f"Baseline alternative: {baseline_model} for linear relationships.",
            
            'Time Series': f"Selected {selected_model} for time series forecasting. "
                          f"ARIMA models are designed specifically for temporal data patterns. "
                          f"Note: Implementation pending for time series models."
        }
        
        base_reasoning = reasoning_templates.get(problem_type, f"Selected {selected_model} as default choice.")
        
        # Add dataset size considerations if provided
        if dataset_size:
            if dataset_size < 1000:
                base_reasoning += f" Dataset size ({dataset_size}) is small - model should train quickly."
            elif dataset_size > 10000:
                base_reasoning += f" Dataset size ({dataset_size}) is large - model can capture complex patterns."
        
        return base_reasoning
    
    def get_available_models(self, problem_type):
        """Get all available models for a specific problem type"""
        if problem_type not in self.model_mappings:
            return []
        
        models = self.model_mappings[problem_type]
        return {
            'baseline': models['baseline']['name'],
            'default': models['default']['name']
        }