# AutoML Analytics Platform

Containerized machine learning platform with automated model training, API-based predictions, and interactive business intelligence dashboards. Built with React frontend, Flask backend, and scikit-learn ML pipeline.

## Architecture

```
React Frontend (Nginx) ←→ Flask Backend (Gunicorn) ←→ PostgreSQL Database
       ↓                        ↓                         ↓
• Chart.js dashboards    • REST API endpoints      • Model metadata
• PowerBI-style reports  • ML training pipeline     • Training runs
• File upload UI         • Prediction engine        • Prediction logs
```

## Technology Stack

**Frontend**: React 18, Chart.js, CSS Grid
**Backend**: Flask, Gunicorn, SQLAlchemy
**Database**: PostgreSQL
**ML**: scikit-learn, pandas, numpy
**Deployment**: Docker, docker-compose

## Quick Start

### Prerequisites
- Docker and docker-compose
- 4GB+ available RAM

### Run Application
```bash
# Clone repository
git clone <repository-url>
cd AutoML-Analytics-Platform

# Start full stack
docker-compose up --build

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Health check: http://localhost:5000/health
```

### Development Mode
```bash
# Backend (development server)
cd backend
pip install -r requirements.txt
python app.py

# Frontend (development server)
cd frontend
npm install
npm start
```

## Core Features

### Data Processing
- **File Upload**: CSV, Excel, JSON with validation
- **Data Analysis**: Automatic schema detection and quality assessment
- **Problem Detection**: Classification vs regression identification

### Machine Learning
- **Automated Pipeline**: Random Forest, Logistic Regression, SVM with scikit-learn
- **Hyperparameter Tuning**: Grid search with cross-validation
- **Model Persistence**: Joblib serialization with metadata
- **Performance Metrics**: Accuracy, precision, recall, F1-score

### Visualization & BI
- **Interactive Charts**: Bar, line, pie, area charts with Chart.js
- **Real-time Dashboard**: WebSocket-powered live updates and statistics
- **Dashboard Interface**: Drag-and-drop field mapping with PowerBI-inspired design
- **Chart Formatting**: Color schemes, transparency, legend controls
- **Widget Management**: Multiple charts with drag-to-reposition functionality

### API Endpoints
```
POST /api/upload     - Upload dataset
POST /api/analyze    - Analyze data structure
POST /api/train      - Train ML model
POST /api/predict    - Make predictions
GET  /api/models     - List available models
GET  /health         - Service health check
WebSocket /socket.io - Real-time updates
```

## Implementation Status

### ✅ Implemented
- **Containerized Deployment**: Docker + docker-compose with PostgreSQL
- **Production WSGI**: Gunicorn server with eventlet workers for WebSocket support
- **Real-time Updates**: Flask-SocketIO with live dashboard statistics
- **Database Persistence**: SQLAlchemy models for datasets, training runs, predictions
- **Complete ML Pipeline**: Data upload → training → prediction → visualization
- **Interactive Dashboards**: Chart.js visualizations with PowerBI-style interface
- **REST API**: Full CRUD operations with error handling

### 🔧 Designed For (Architecture Patterns)
- **Horizontal Scaling**: Stateless application design
- **External Caching**: Redis integration patterns
- **Authentication**: Decorator-based authorization hooks
- **Monitoring**: Structured logging and health check endpoints
- **Cloud Deployment**: 12-factor app compliance

## Project Structure

```
AutoML-Analytics-Platform/
├── backend/
│   ├── Dockerfile              # Production container
│   ├── gunicorn.conf.py        # WSGI server config
│   ├── app.py                  # Flask application
│   ├── models.py               # SQLAlchemy models
│   ├── routes/                 # API endpoints
│   └── ml_engine/              # ML processing
├── frontend/
│   ├── Dockerfile              # Multi-stage build
│   ├── nginx.conf              # Reverse proxy
│   └── src/                    # React application
├── docker-compose.yml          # Full stack deployment
└── README.md
```

## Development Workflow

### Adding New Features
1. **Backend**: Add routes in `routes/` directory
2. **Frontend**: Add components in `src/components/`
3. **Database**: Update models in `models.py`
4. **Testing**: Use development mode for rapid iteration

### Database Operations
```bash
# Access PostgreSQL container
docker-compose exec db psql -U automl -d automl

# View application logs
docker-compose logs backend
docker-compose logs frontend
```

## Performance Characteristics

**Development Environment Testing**:
- API response times: 200-800ms observed
- Model training: 2-10 minutes (dataset dependent)
- File processing: Tested up to 50,000 rows
- Development server: 1-3 concurrent users

## Technical Implementation

- **Containerized ML Platform**: Complete workflow from data upload to model deployment
- **Automated Algorithm Selection**: Scikit-learn pipeline with hyperparameter optimization
- **Interactive Data Visualization**: Chart.js dashboards with configurable formatting
- **Production Deployment Architecture**: Containerized services with database persistence
- **RESTful API Design**: Flask blueprints with comprehensive error handling

## License

MIT License - see LICENSE file for details.


-----------------------------------------------------------------------

Here’s a **clear, simple, A → Z guide** on **how to use your AutoML Analytics Platform**, written the way a **user, reviewer, or interviewer** would expect.
No hype. No assumptions. Just practical usage.

---

# How to Use the AutoML Analytics Platform (End-to-End)

This guide explains **exactly how a user interacts with the platform**, from startup to prediction.

---

## 1️⃣ Start the Platform

### Option A: Docker (Recommended)

```bash
git clone <your-repo-url>
cd AutoML-Analytics-Platform
docker-compose up --build
```

Wait until all services start.

### Verify:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend health: [http://localhost:5000/health](http://localhost:5000/health)

---

## 2️⃣ Open the Web Interface

1. Open browser → `http://localhost:3000`
2. You will see the **Upload Page** (entry point of the platform)

This is where **every workflow starts**.

---

## 3️⃣ Upload a Dataset

### What You Can Upload

* CSV or Excel files only
* Structured tabular data
* Header row required
* File size ≤ 16MB

### Steps

1. Click **“Choose File”** or drag-and-drop a file
2. Upload starts automatically
3. Backend:

   * Validates file
   * Reads data using pandas
   * Stores file in `backend/uploads/`
   * Creates a Dataset record in PostgreSQL

### What You See

* File name
* Number of rows & columns
* Column names
* Basic data quality indicators (missing values, types)

---

## 4️⃣ Analyze the Dataset (Dashboard)

Navigate to the **Dashboard** page.

### The platform automatically:

* Detects column data types
* Identifies potential target column
* Determines problem type:

  * Classification (binary / multiclass)
  * Regression

### You can review:

* Dataset size
* Column breakdown
* Data completeness
* Detected ML task type

⚠️ No manual feature selection is required.

---

## 5️⃣ Train a Machine Learning Model

### Steps

1. Click **“Train ML Model”**
2. Training starts immediately

### What Happens Internally

* Data is split (80% train / 20% test)
* Preprocessing pipeline is built:

  * Missing value imputation
  * Label encoding
  * Feature scaling
* Multiple scikit-learn models are trained:

  * Classification: Random Forest, Logistic Regression, SVM
  * Regression: Random Forest, Linear Regression, SVR
* 5-fold cross-validation is applied
* Best model is selected based on score

### What You See

* Live progress updates (via WebSocket)
* Training status: RUNNING → COMPLETED
* No page refresh required

Training usually takes **2–10 minutes** depending on dataset size.

---

## 6️⃣ View Model Performance

After training completes, go to **Model Results**.

### For Classification Models

* Accuracy
* Precision
* Recall
* F1-score
* Confusion matrix (if enabled)

### For Regression Models

* R² score
* Mean Squared Error (MSE)
* Root Mean Squared Error (RMSE)

### Additional Insights

* Algorithm comparison results
* Feature importance (if model supports it)
* Rule-based insights derived from metrics

All results are **read-only and reproducible**.

---

## 7️⃣ Make Predictions

Navigate to the **Predictions** page.

### Steps

1. Select a trained model from dropdown
2. Enter values for each feature
3. Click **“Make Prediction”**

### Backend Processing

* Loads saved model from `backend/models/`
* Applies the same preprocessing pipeline
* Generates prediction

### Output

* Predicted class or numeric value
* Probability score (if supported by model)
* Feature importance (if available)

Each prediction is logged in the database.

---

## 8️⃣ Interpret Results Correctly

### Classification

* Output = predicted label
* Confidence = probability estimate
* Use confidence as **relative certainty**, not absolute truth

### Regression

* Output = numeric prediction
* No guaranteed error bounds
* Use metrics from training phase to judge reliability

⚠️ This platform **does not auto-deploy models** or retrain continuously.

---

## 9️⃣ Stop the Platform

### Docker

```bash
docker-compose down
```

All containers stop cleanly.
Models and uploads remain stored in volumes.