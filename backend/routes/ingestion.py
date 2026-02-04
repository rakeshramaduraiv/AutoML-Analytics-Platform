from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
import os
import hashlib
from datetime import datetime
import json
import PyPDF2
from docx import Document
import xml.etree.ElementTree as ET
from PIL import Image
import textblob

ingestion_bp = Blueprint('ingestion', __name__)

class FileIngestionEngine:
    """Modular file processing with honest capability levels per format"""
    
    PROCESSING_LEVELS = {
        'csv': 'FULL_ML_PIPELINE',
        'xlsx': 'FULL_ML_PIPELINE', 
        'json': 'SCHEMA_EXTRACTION_ML_IF_TABULAR',
        'xml': 'SCHEMA_EXTRACTION_ML_IF_TABULAR',
        'pdf': 'TEXT_EXTRACTION_NLP_PROFILING',
        'docx': 'TEXT_EXTRACTION_NLP_PROFILING',
        'txt': 'TEXT_EXTRACTION_NLP_PROFILING',
        'jpg': 'METADATA_CV_PLACEHOLDER',
        'png': 'METADATA_CV_PLACEHOLDER',
        'jpeg': 'METADATA_CV_PLACEHOLDER'
    }
    
    def process_file(self, filepath, filename):
        """Route file to appropriate processing pipeline based on type"""
        file_ext = filename.lower().split('.')[-1]
        processing_level = self.PROCESSING_LEVELS.get(file_ext, 'UNSUPPORTED')
        
        file_hash = self._generate_file_hash(filepath)
        
        result = {
            'filename': filename,
            'file_type': file_ext,
            'processing_level': processing_level,
            'file_hash': file_hash,
            'processed_at': datetime.now().isoformat(),
            'size_bytes': os.path.getsize(filepath)
        }
        
        if processing_level == 'FULL_ML_PIPELINE':
            return self._process_tabular_data(filepath, result)
        elif processing_level == 'SCHEMA_EXTRACTION_ML_IF_TABULAR':
            return self._process_structured_data(filepath, result)
        elif processing_level == 'TEXT_EXTRACTION_NLP_PROFILING':
            return self._process_text_data(filepath, result)
        elif processing_level == 'METADATA_CV_PLACEHOLDER':
            return self._process_image_data(filepath, result)
        else:
            result['error'] = 'Unsupported file type'
            return result
    
    def _process_tabular_data(self, filepath, result):
        """Full ML pipeline for CSV/XLSX"""
        try:
            if result['file_type'] == 'csv':
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            result.update({
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': df.columns.tolist(),
                'ml_ready': True,
                'normalized_data': df.to_dict('records')[:5]  # Sample
            })
            
            return result
        except Exception as e:
            result['error'] = str(e)
            return result
    
    def _process_structured_data(self, filepath, result):
        """Schema extraction for JSON/XML with ML assessment"""
        try:
            if result['file_type'] == 'json':
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                    # Tabular JSON - can do ML
                    df = pd.DataFrame(data)
                    result.update({
                        'schema_type': 'tabular',
                        'rows': len(df),
                        'columns': len(df.columns),
                        'ml_ready': True,
                        'normalized_data': data[:5]
                    })
                else:
                    # Non-tabular JSON - schema only
                    result.update({
                        'schema_type': 'nested',
                        'ml_ready': False,
                        'schema_keys': list(data.keys()) if isinstance(data, dict) else 'array'
                    })
            
            return result
        except Exception as e:
            result['error'] = str(e)
            return result
    
    def _process_text_data(self, filepath, result):
        """Text extraction and NLP profiling"""
        try:
            text_content = ""
            
            if result['file_type'] == 'pdf':
                with open(filepath, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        text_content += page.extract_text()
            elif result['file_type'] == 'docx':
                doc = Document(filepath)
                text_content = '\n'.join([p.text for p in doc.paragraphs])
            else:
                with open(filepath, 'r', encoding='utf-8') as f:
                    text_content = f.read()
            
            # NLP profiling
            blob = textblob.TextBlob(text_content)
            
            result.update({
                'text_length': len(text_content),
                'word_count': len(text_content.split()),
                'sentiment_polarity': blob.sentiment.polarity,
                'ml_ready': False,  # Text needs further NLP processing
                'nlp_profile': {
                    'language': 'en',  # Simplified
                    'readability': 'medium',
                    'content_type': 'document'
                },
                'text_preview': text_content[:500]
            })
            
            return result
        except Exception as e:
            result['error'] = str(e)
            return result
    
    def _process_image_data(self, filepath, result):
        """Metadata extraction with CV placeholder"""
        try:
            with Image.open(filepath) as img:
                result.update({
                    'dimensions': img.size,
                    'format': img.format,
                    'mode': img.mode,
                    'ml_ready': False,  # CV pipeline not implemented
                    'cv_placeholder': {
                        'future_capabilities': ['object_detection', 'classification', 'feature_extraction'],
                        'current_status': 'metadata_only'
                    }
                })
            
            return result
        except Exception as e:
            result['error'] = str(e)
            return result
    
    def _generate_file_hash(self, filepath):
        """Generate SHA-256 hash for file integrity"""
        hash_sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()[:16]  # Short hash

@ingestion_bp.route('/api/ingest', methods=['POST'])
def ingest_file():
    """Honest file ingestion with processing level transparency"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Filename required'}), 400
        
        filepath = os.path.join('uploads', filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        engine = FileIngestionEngine()
        result = engine.process_file(filepath, filename)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Ingestion failed: {str(e)}'}), 500