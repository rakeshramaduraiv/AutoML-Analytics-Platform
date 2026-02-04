# Step 1: Update existing training route
from services.governance_tracker import GovernanceTracker

@train_bp.route('/api/train', methods=['POST'])
def train_model():
    data = request.get_json()
    filename = data['filename']
    
    # Initialize governance tracker
    tracker = GovernanceTracker(db_session)
    
    # Step 2: Register dataset (if not already registered)
    with open(f'uploads/{filename}', 'rb') as f:
        file_content = f.read()
    
    dataset_id = tracker.register_dataset(
        filename=filename,
        file_content=file_content,
        metadata={'quality_score': 85, 'classification': 'internal'},
        user_id='current_user'
    )
    
    # Step 3: Start tracked training run
    run_config = {
        'run_id': str(uuid.uuid4()),
        'target_column': data.get('target_column'),
        'algorithm': 'RandomForestClassifier',
        'hyperparameters': {'n_estimators': 100},
        'random_seed': 42
    }
    
    training_run_id = tracker.start_training_run(
        dataset_id=dataset_id,
        config=run_config,
        user_id='current_user',
        experiment_name='AutoML Training'
    )
    
    # Step 4: Log decisions during training
    tracker.log_decision(
        training_run_id=training_run_id,
        decision_type='algorithm_selection',
        chosen_option='RandomForestClassifier',
        reasoning='Best performance on similar datasets',
        options_considered=['LogisticRegression', 'SVM', 'RandomForest'],
        confidence=0.85
    )
    
    # Step 5: Register model after training
    model_path = f'models/model_{training_run_id}.joblib'
    # ... actual training code ...
    
    model_id = tracker.register_model(
        training_run_id=training_run_id,
        model_path=model_path,
        metrics={'accuracy': 0.87, 'precision': 0.85, 'recall': 0.89}
    )
    
    return jsonify({
        'model_id': model_id,
        'training_run_id': training_run_id,
        'dataset_id': dataset_id
    })

# Step 6: Update prediction route
@predict_bp.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    model_id = data['model_id']
    input_features = data['features']
    
    # ... prediction logic ...
    prediction = 'positive'
    confidence = 0.92
    
    # Log prediction for audit
    tracker = GovernanceTracker(db_session)
    prediction_id = tracker.log_prediction(
        model_id=model_id,
        input_features=input_features,
        prediction=prediction,
        confidence=confidence,
        user_id='current_user',
        request_id=str(uuid.uuid4())
    )
    
    return jsonify({
        'prediction': prediction,
        'confidence': confidence,
        'prediction_id': prediction_id
    })

# Step 7: Add governance endpoints
@app.route('/api/governance/model/<int:model_id>/lineage', methods=['GET'])
def get_model_lineage(model_id):
    """Get complete audit trail for a model"""
    tracker = GovernanceTracker(db_session)
    lineage = tracker.get_model_lineage(model_id)
    
    if not lineage:
        return jsonify({'error': 'Model not found'}), 404
    
    return jsonify(lineage)

@app.route('/api/governance/dataset/<int:dataset_id>/usage', methods=['GET'])
def get_dataset_usage(dataset_id):
    """Get dataset usage analytics"""
    tracker = GovernanceTracker(db_session)
    usage = tracker.get_dataset_usage(dataset_id)
    
    return jsonify(usage)