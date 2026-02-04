# AutoML Analytics Platform v2.0

**Enterprise-grade machine learning platform with governance compliance, auditable decision logs, and modular file processing architecture.**

## 🚀 Enterprise Features (v2.0)

### **Modular File Processing Architecture**
Honest processing capabilities with transparent depth per file type:

| File Type | Processing Level | ML Ready | Capabilities |
|-----------|------------------|----------|--------------|
| CSV / XLSX | `FULL_ML_PIPELINE` | ✅ Yes | Data quality scoring, AutoML, model versioning, decision logs |
| JSON / XML | `SCHEMA_EXTRACTION_ML_IF_TABULAR` | 🔄 Conditional | Schema analysis, conditional ML if tabular structure |
| PDF / DOCX | `TEXT_EXTRACTION_NLP_PROFILING` | ❌ No | Text extraction, sentiment analysis, NLP profiling |
| Images | `METADATA_CV_PLACEHOLDER` | ❌ No | Metadata extraction, future CV pipeline placeholder |

### **Data Quality Index (Industry Standard)**
Automated 0-100 scoring based on:
- **Completeness (40%)** - Missing values assessment
- **Uniqueness (25%)** - Duplicate detection  
- **Validity (20%)** - Data type consistency + outlier detection
- **Consistency (15%)** - Cardinality issues analysis

### **ML Decision Logs (Auditable AI)**
Complete decision traceability for enterprise compliance:
```json
{
  "why_this_model": "RandomForest selected for classification due to robust performance on tabular data...",
  "why_this_target": "Target column 'sales' selected as last column (ML convention)...",
  "assumptions": ["Target variable suitable for classification modeling", "Features are independent..."],
  "known_limitations": ["Model trained on 1000 samples - performance may vary with scale..."],
  "model_version": "v20241201_1430_abc12345",
  "dataset_hash": "sha256:abc123...",
  "governance": {"auditable": true, "explainable": true, "reproducible": true}
}
```

### **Near Real-Time Training**
Async-ready architecture with progress tracking:
- Background task simulation with status endpoints
- Progress stages: `INITIALIZING` → `LOADING_DATA` → `ASSESSING_QUALITY` → `TRAINING_MODEL` → `COMPLETED`
- Status API: `GET /api/training-status/<job_id>`

### **Tiered Model Strategy**
Intelligent model selection based on dataset characteristics:
- **Small datasets (<1000 rows)**: LogisticRegression/LinearRegression for interpretability
- **Large datasets (≥1000 rows)**: RandomForest ensemble for performance
- **Bounded hyperparameters**: Production defaults to balance performance and training cost

### **Model Governance & Versioning**
Enterprise compliance features:
- **Model Versioning**: `model_v20241201_1430_abc12345` (timestamp + dataset hash)
- **Dataset Integrity**: SHA-256 hashing for reproducibility
- **Training Metadata**: Complete audit trail with timestamps
- **Governance Flags**: Auditable, Explainable, Reproducible markers

## 🏗️ System Architecture

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│   React Frontend │ ◄──────────────► │   Flask Backend   │
│                 │                 │                  │
│ • Upload UI     │                 │ • Modular Routes │
│ • Dashboard     │                 │ • CORS Support   │
│ • Visualizations│                 │ • Progress APIs  │
│ • Predictions   │                 │                  │
└─────────────────┘                 └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ Ingestion Layer  │
                                    │                  │
                                    │ • File Router    │
                                    │ • Format Handler │
                                    │ • Quality Scorer │
                                    └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │Intelligence Layer│
                                    │                  │
                                    │ • ML Engine      │
                                    │ • Decision Logger│
                                    │ • Model Versioner│
                                    └──────────────────┘
```

## 📊 Tech Stack

### Backend (Enterprise-Grade)
- **Flask 2.3** - Modular blueprint architecture
- **scikit-learn** - Production ML algorithms
- **pandas/numpy** - Data processing pipeline
- **joblib** - Model persistence with versioning
- **hashlib** - Dataset integrity verification

### Frontend (Modern React)
- **React 18** - Component-based UI
- **Chart.js** - Interactive visualizations
- **React Router** - SPA navigation

### ML Pipeline
- **Data Quality Engine** - 0-100 scoring system
- **Decision Log Engine** - Auditable AI decisions
- **Async Trainer** - Near real-time processing
- **Model Governance** - Version control & compliance

## 🔧 API Endpoints

### Core ML Pipeline
```http
POST /api/ingest          # Modular file ingestion
POST /api/train           # Near real-time ML training
GET  /api/training-status/<job_id>  # Progress tracking
POST /api/predict         # Model inference
GET  /api/models          # Governance-compliant model listing
```

### Enterprise Features
```http
GET  /api/capabilities    # Honest processing levels per format
GET  /health             # Service health with feature flags
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📈 Business Value

### **Time Savings**
- Reduces ML development from weeks to hours
- Automated algorithm selection eliminates manual testing
- One-click training with progress visibility

### **Enterprise Compliance**
- Auditable decision logs for regulatory requirements
- Data quality assessment before model training
- Model versioning for reproducibility

### **Governance & Risk Management**
- Transparent processing capabilities (no inflated claims)
- Assumption documentation and limitation awareness
- Complete audit trail for model decisions

## 🎯 Resume-Ready Accomplishments

- **"Implemented automated data quality scoring to assess dataset readiness before ML training"**
- **"Designed auditable ML decision logs for enterprise compliance and explainable AI"**
- **"Built near real-time ML training pipeline with progress tracking and model versioning"**
- **"Created modular file ingestion system with transparent processing capabilities per format"**
- **"Developed governance-compliant ML platform with reproducible training and decision traceability"**

## 🔍 Key Differentiators

### **Honest Architecture**
- Transparent processing levels per file type
- No inflated capabilities or misleading claims
- Clear separation between ingestion and intelligence layers

### **Enterprise Mindset**
- Data quality assessment before ML training
- Auditable decision logs with reasoning
- Model versioning with dataset integrity checks
- Bounded hyperparameter strategy for production balance

### **Production Readiness**
- Async-ready architecture for scalability
- Progress tracking for long-running operations
- Comprehensive error handling and validation
- Governance compliance features

## 📋 Project Structure

```
AutoML-Analytics-Platform/
├── backend/
│   ├── routes/
│   │   ├── ingestion.py      # Modular file processing
│   │   ├── train.py          # Near real-time ML training
│   │   └── predict.py        # Model inference
│   ├── ml_engine/
│   │   ├── data_quality.py   # 0-100 quality scoring
│   │   └── decision_log.py   # Auditable ML decisions
│   └── app.py               # Enterprise Flask app
├── frontend/
│   ├── src/
│   │   ├── pages/           # React components
│   │   └── services/        # API integration
│   └── package.json
└── README.md
```

## 🏆 Enterprise Compliance

- ✅ **Auditable**: Complete decision trace for every model
- ✅ **Explainable**: Reasoning for all ML choices documented
- ✅ **Reproducible**: Dataset hashing and model versioning
- ✅ **Transparent**: Honest processing capabilities per format
- ✅ **Scalable**: Async-ready architecture for production

## 📞 Contact

Built with enterprise-grade practices and governance compliance in mind. Demonstrates senior-level ML engineering with honest capabilities and auditable decision-making.

---

*AutoML Analytics Platform v2.0 - Where Enterprise ML meets Governance Compliance*