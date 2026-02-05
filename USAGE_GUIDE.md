# AutoML Analytics Platform - Usage Guide

## Quick Start (3 Steps)

### 1️⃣ Start Platform
```bash
docker-compose up --build
```
Open: http://localhost:3000

### 2️⃣ Upload Dataset
- Drag CSV/Excel file
- View automatic analysis
- Max 50K rows

### 3️⃣ Train & Predict
- Select training mode (Quick/Standard/Thorough)
- Click "Start Training"
- Make predictions from trained models

---

## Detailed Workflow

### Step 1: Upload Dataset

**Requirements:**
- CSV or Excel format
- Tabular data with headers
- Up to 50,000 rows

**Process:**
1. Navigate to Upload page
2. Drag-and-drop or select file
3. View data summary (rows, columns, types)

### Step 2: Configure Training

**Training Modes:**

| Mode | Time | Accuracy | Best For |
|------|------|----------|----------|
| Quick | 1-2 min | 88-92% | Fast iteration |
| Standard | 2-3 min | 91-94% | Production |
| Thorough | 4-6 min | 93-96% | Maximum quality |

**Advanced Options:**
- Problem Type: Auto-detect, Classification, Regression
- Model Quality: Balanced, Accuracy, Speed
- Feature Engineering: ON/OFF
- Cross Validation: ON/OFF
- Ensemble Methods: ON/OFF (Thorough mode)

### Step 3: Train Model

**Real-time Metrics Displayed:**
- Current model being trained
- Models completed (X/3)
- Current accuracy score
- Best accuracy achieved
- CV fold progress
- Estimators processed

**What Happens:**
1. Data preprocessing (scaling, encoding, imputation)
2. Feature selection (mutual information)
3. Train 3 models in parallel (Random Forest, Gradient Boosting, Extra Trees)
4. Cross-validation (2-5 folds)
5. Select best model
6. Optional: Create ensemble (Thorough mode)

### Step 4: View Results

**Classification Metrics:**
- Accuracy, Precision, Recall, F1-score
- Cross-validation mean & std
- Algorithm comparison

**Regression Metrics:**
- R² score, MSE, MAE, RMSE
- Cross-validation mean & std
- Algorithm comparison

### Step 5: Make Predictions

**Process:**
1. Go to Predictions page
2. Select trained model from registry
3. Enter feature values
4. Click "Make Prediction"

**Output:**
- Predicted value
- Confidence score (0-100%)
- Feature importance visualization
- Download results (JSON/CSV)

### Step 6: Create Dashboards

**PowerBI-style Reports:**
1. Navigate to Reports page
2. Drag fields to axes (X, Y, Legend)
3. Apply filters (equals, contains, greater than, etc.)
4. Format numbers (currency, percent, compact)
5. Export as PDF

### Step 7: API Integration

**Python Example:**
```python
import requests

response = requests.post('http://localhost:5000/api/predict', json={
    'model_name': 'model_target_20240101_abc123',
    'input_data': [{'feature1': 10, 'feature2': 20}]
})

result = response.json()
print(f"Prediction: {result['predictions'][0]}")
print(f"Confidence: {result['confidence_scores'][0]}")
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"model_name": "model_target_20240101_abc123", "input_data": [{"feature1": 10}]}'
```

---

## API Reference

### Upload Dataset
```
POST /api/upload
Content-Type: multipart/form-data
Body: file=<dataset.csv>
```

### Train Model
```
POST /api/train
Content-Type: application/json
Body: {
  "filename": "data.csv",
  "config": {
    "trainingTime": "standard"
  }
}
```

### Make Prediction
```
POST /api/predict
Content-Type: application/json
Body: {
  "model_name": "model_xyz",
  "input_data": [{"feature1": 10}]
}
```

### List Models
```
GET /api/models
```

### Delete Model
```
DELETE /api/models/<model_name>
```

---

## Troubleshooting

**Training fails:**
- Check dataset has at least 20 rows
- Ensure at least 2 columns
- Verify CSV/Excel format

**Low accuracy:**
- Try "Thorough" mode
- Check data quality
- Ensure sufficient training data

**Prediction error:**
- Verify feature names match training data
- Check for missing values
- Ensure correct data types

---

## Performance Tips

1. **For speed**: Use "Quick" mode
2. **For accuracy**: Use "Thorough" mode with ensemble
3. **Large datasets**: Platform auto-samples >50K rows
4. **Many features**: Platform auto-selects top 15-25 features
5. **Imbalanced data**: Platform uses class_weight='balanced'

---

## Stop Platform

```bash
docker-compose down
```

Models and data persist in Docker volumes.
