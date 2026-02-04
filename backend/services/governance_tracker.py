from sqlalchemy.orm import sessionmaker
from models.governance_schema import Dataset, TrainingRun, Model, Decision, Prediction
import hashlib
import json
from datetime import datetime

class GovernanceTracker:
    def __init__(self, db_session):
        self.db_session = db_session
    
    def register_dataset(self, filename, file_content, metadata, user_id):
        """Register dataset with governance tracking"""
        content_hash = hashlib.sha256(file_content).hexdigest()
        
        # Check if dataset already exists
        existing = self.db_session.query(Dataset).filter_by(content_hash=content_hash).first()
        if existing:
            return existing.id
        
        dataset = Dataset(
            filename=filename,
            content_hash=content_hash,
            rows=metadata.get('rows'),
            columns=metadata.get('columns'),
            size_bytes=len(file_content),
            quality_score=metadata.get('quality_score'),
            uploaded_by=user_id,
            data_classification=metadata.get('classification', 'internal')
        )
        
        self.db_session.add(dataset)
        self.db_session.commit()
        return dataset.id
    
    def start_training_run(self, dataset_id, config, user_id, experiment_name=None):
        """Start tracked training run"""
        training_run = TrainingRun(
            id=config['run_id'],
            dataset_id=dataset_id,
            target_column=config.get('target_column'),
            feature_columns=config.get('feature_columns'),
            algorithm=config.get('algorithm'),
            hyperparameters=config.get('hyperparameters'),
            random_seed=config.get('random_seed', 42),
            created_by=user_id,
            experiment_name=experiment_name,
            tags=config.get('tags', [])
        )
        
        self.db_session.add(training_run)
        self.db_session.commit()
        return training_run.id
    
    def log_decision(self, training_run_id, decision_type, chosen_option, reasoning, 
                    options_considered=None, confidence=None, automated=True):
        """Log ML decision for audit trail"""
        decision = Decision(
            training_run_id=training_run_id,
            decision_type=decision_type,
            decision_point=f"{decision_type} selection",
            options_considered=options_considered or [],
            chosen_option=chosen_option,
            reasoning=reasoning,
            confidence_score=confidence,
            automated=automated,
            decided_by='system' if automated else 'human'
        )
        
        self.db_session.add(decision)
        self.db_session.commit()
        return decision.id
    
    def register_model(self, training_run_id, model_path, metrics, version=None):
        """Register trained model with versioning"""
        # Generate version if not provided
        if not version:
            existing_count = self.db_session.query(Model).filter_by(
                training_run_id=training_run_id
            ).count()
            version = f"v1.{existing_count}"
        
        # Calculate file hash
        with open(model_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        model = Model(
            training_run_id=training_run_id,
            name=f"model_{training_run_id}",
            version=version,
            file_path=model_path,
            file_hash=file_hash,
            accuracy=metrics.get('accuracy'),
            precision=metrics.get('precision'),
            recall=metrics.get('recall'),
            f1_score=metrics.get('f1_score')
        )
        
        self.db_session.add(model)
        self.db_session.commit()
        return model.id
    
    def log_prediction(self, model_id, input_features, prediction, confidence, 
                      user_id=None, request_id=None):
        """Log prediction for audit and feedback"""
        input_hash = hashlib.sha256(
            json.dumps(input_features, sort_keys=True).encode()
        ).hexdigest()
        
        prediction_record = Prediction(
            model_id=model_id,
            input_hash=input_hash,
            input_features=input_features,
            prediction=str(prediction),
            confidence=confidence,
            user_id=user_id,
            request_id=request_id
        )
        
        self.db_session.add(prediction_record)
        self.db_session.commit()
        return prediction_record.id
    
    def get_model_lineage(self, model_id):
        """Get complete lineage for a model"""
        model = self.db_session.query(Model).filter_by(id=model_id).first()
        if not model:
            return None
        
        training_run = model.training_run
        dataset = training_run.dataset
        decisions = training_run.decisions
        
        return {
            'model': {
                'id': model.id,
                'version': model.version,
                'created_at': model.created_at.isoformat(),
                'performance': {
                    'accuracy': model.accuracy,
                    'precision': model.precision,
                    'recall': model.recall
                }
            },
            'training_run': {
                'id': training_run.id,
                'algorithm': training_run.algorithm,
                'hyperparameters': training_run.hyperparameters,
                'random_seed': training_run.random_seed,
                'created_by': training_run.created_by
            },
            'dataset': {
                'filename': dataset.filename,
                'content_hash': dataset.content_hash,
                'quality_score': dataset.quality_score,
                'uploaded_at': dataset.uploaded_at.isoformat()
            },
            'decisions': [{
                'type': d.decision_type,
                'chosen': d.chosen_option,
                'reasoning': d.reasoning,
                'automated': d.automated
            } for d in decisions]
        }
    
    def get_dataset_usage(self, dataset_id):
        """Track how dataset has been used"""
        dataset = self.db_session.query(Dataset).filter_by(id=dataset_id).first()
        training_runs = dataset.training_runs
        
        return {
            'dataset_id': dataset_id,
            'filename': dataset.filename,
            'total_training_runs': len(training_runs),
            'algorithms_used': list(set(tr.algorithm for tr in training_runs if tr.algorithm)),
            'best_accuracy': max((tr.models[0].accuracy for tr in training_runs 
                                if tr.models and tr.models[0].accuracy), default=0),
            'usage_timeline': [(tr.started_at.isoformat(), tr.algorithm) 
                             for tr in training_runs if tr.started_at]
        }