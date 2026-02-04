import logging
from flask import Blueprint, request, jsonify
import pandas as pd
import os
from ml_engine.file_ingestion import FileIngestionEngine
from ml_engine.data_profiling import DataProfilingEngine

analyze_bp = Blueprint('analyze', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize engines
ingestion_engine = FileIngestionEngine()
profiling_engine = DataProfilingEngine()

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@analyze_bp.route('/api/analyze', methods=['POST'])
def analyze_dataset():
    """Dataset analysis with comprehensive profiling"""
    try:
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400
        
        filename = data['filename']
        if not allowed_file(filename):
            return jsonify({'error': 'File type not supported'}), 400
            
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        logger.info(f'Analyzing dataset: {filename}')
        
        # Load data safely
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, nrows=10000)  # Limit rows for performance
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(filepath, nrows=10000)
            else:
                return jsonify({'error': 'Unsupported file format'}), 400
        except Exception:
            return jsonify({'error': 'Failed to read file'}), 400
        
        if df.empty:
            return jsonify({'error': 'File is empty'}), 400
        
        # Generate analysis
        analysis = {
            'success': True,
            'filename': filename,
            'dataset_info': {
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': df.columns.tolist()[:50],  # Limit columns shown
                'data_types': {k: str(v) for k, v in df.dtypes.to_dict().items()},
                'memory_usage': round(df.memory_usage(deep=True).sum() / 1024**2, 2),
                'missing_values': {k: int(v) for k, v in df.isnull().sum().to_dict().items()}
            },
            'data_quality': {
                'completeness': round((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100, 2),
                'duplicates': int(df.duplicated().sum()),
                'unique_rows': len(df.drop_duplicates()),
                'quality_score': min(95, 70 + (len(df) / 1000) * 2)
            },
            'ml_readiness': {
                'status': 'READY' if len(df) > 100 else 'INSUFFICIENT_DATA',
                'confidence': 0.85 if len(df) > 100 else 0.3
            }
        }
        
        # Add statistical summary for numeric columns only
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            analysis['statistical_summary'] = df[numeric_cols].describe().to_dict()
        
        return jsonify(analysis)
    
    except Exception as e:
        logger.error(f'Analysis failed for {filename}: {str(e)}')
        return jsonify({'error': 'Analysis failed'}), 500

@analyze_bp.route('/api/data-quality-report', methods=['POST'])
def generate_quality_report():
    """Generate data quality report"""
    try:
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400
        
        filename = data['filename']
        if not allowed_file(filename):
            return jsonify({'error': 'File type not supported'}), 400
            
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        logger.info(f'Generating quality report for: {filename}')
        
        # Load and profile data
        try:
            dataframe, _ = ingestion_engine.ingest_file(filepath)
            if dataframe is None or dataframe.empty:
                return jsonify({'error': 'Unable to process file'}), 400
                
            dataset_profile = profiling_engine.profile_dataset(dataframe)
        except Exception:
            return jsonify({'error': 'Failed to generate quality report'}), 400
        
        # Generate summary
        quality_summary = {
            'overall_score': round(min(100, max(0, dataset_profile.overall_quality_score)), 1),
            'grade': 'Excellent' if dataset_profile.overall_quality_score >= 90 else
                    'Good' if dataset_profile.overall_quality_score >= 70 else
                    'Fair' if dataset_profile.overall_quality_score >= 50 else 'Poor',
            'readiness_for_ml': dataset_profile.overall_quality_score >= 70
        }
        
        return jsonify({
            'success': True,
            'quality_summary': quality_summary,
            'processing_time': round(min(300, dataset_profile.processing_time_seconds), 3)
        })
    
    except Exception as e:
        logger.error(f'Quality report failed for {filename}: {str(e)}')
        return jsonify({'error': 'Quality report generation failed'}), 500

# Legacy endpoint for backward compatibility
@analyze_bp.route('/analyze', methods=['POST'])
def analyze_dataset_legacy():
    """Legacy analyze endpoint - redirects to new enterprise endpoint"""
    return analyze_dataset()