import os
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from ml_engine.file_ingestion import FileIngestionEngine, FileType
from ml_engine.document_processor import EnterpriseDocumentProcessor

upload_bp = Blueprint('upload', __name__)

# Configure upload settings
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
MAX_FILE_SIZE = int(os.environ.get('MAX_FILE_SIZE', 16 * 1024 * 1024))  # 16MB default
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json', 'txt', 'pdf', 'docx', 'png', 'jpg', 'jpeg'}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize engines
ingestion_engine = FileIngestionEngine()
document_processor = EnterpriseDocumentProcessor()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/api/upload', methods=['POST'])
def upload_file():
    """Enterprise file upload supporting all business document formats"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        # Save file securely
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400
            
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        logger.info(f'File uploaded: {filename}, size: {file_size} bytes')
        
        # Determine processing approach based on file type
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Document formats (PDF, DOCX, PPTX, etc.)
        document_formats = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.rtf', '.html', '.htm']
        image_formats = ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
        
        if file_ext in document_formats or file_ext in image_formats:
            # Use document processor for business documents
            result = document_processor.process_document(filepath)
            
            if not result.is_valid:
                # Clean up failed file
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({
                    'error': result.error_message,
                    'document_type': result.metadata.document_type.value
                }), 400
            
            # Build response for document processing
            response_data = {
                'success': True,
                'filename': result.metadata.filename,
                'document_type': result.metadata.document_type.value,
                'file_size_bytes': result.metadata.file_size_bytes,
                'processing_method': 'document_processing',
                
                # Document-specific metadata
                'document_metadata': {
                    'page_count': result.metadata.page_count,
                    'word_count': result.metadata.word_count,
                    'character_count': result.metadata.character_count,
                    'language': result.metadata.language,
                    'has_tables': result.metadata.has_tables,
                    'table_count': result.metadata.table_count,
                    'has_images': result.metadata.has_images,
                    'extraction_method': result.metadata.extraction_method.value,
                    'confidence_score': round(result.metadata.confidence_score, 3),
                    'processing_time': round(result.metadata.processing_time, 3)
                },
                
                # Content preview
                'content_preview': {
                    'text_sample': result.text_content[:500] + '...' if result.text_content and len(result.text_content) > 500 else result.text_content,
                    'extraction_quality': result.extraction_quality,
                    'data_completeness': round(result.data_completeness, 2)
                },
                
                # Analytics (if available)
                'text_analytics': {
                    'sentiment_score': result.sentiment_score,
                    'key_phrases': result.key_phrases[:5] if result.key_phrases else None,
                    'summary': result.summary
                },
                
                # Structured data info
                'structured_data': {
                    'has_structured_data': result.structured_data is not None,
                    'rows': len(result.structured_data) if result.structured_data is not None else 0,
                    'columns': len(result.structured_data.columns) if result.structured_data is not None else 0,
                    'column_names': list(result.structured_data.columns) if result.structured_data is not None else []
                },
                
                'warnings': result.metadata.warnings or []
            }
            
            # Add data preview if structured data exists
            if result.structured_data is not None and len(result.structured_data) > 0:
                response_data['data_preview'] = result.structured_data.head(5).to_dict('records')
                response_data['data_types'] = result.structured_data.dtypes.astype(str).to_dict()
            
            return jsonify(response_data)
        
        else:
            # Use traditional data ingestion for CSV, JSON, etc.
            dataframe, file_metadata = ingestion_engine.ingest_file(filepath)
            
            if not file_metadata.is_valid:
                # Clean up failed file
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({
                    'error': file_metadata.error_message,
                    'file_type': file_metadata.file_type.value if file_metadata.file_type else 'unknown'
                }), 400
            
            # Traditional data response
            response_data = {
                'success': True,
                'filename': file_metadata.filename,
                'file_type': file_metadata.file_type.value,
                'size_bytes': file_metadata.size_bytes,
                'encoding': file_metadata.encoding,
                'processing_method': 'data_ingestion',
                'rows': file_metadata.row_count,
                'columns': file_metadata.column_count,
                'column_names': file_metadata.columns,
                'processing_notes': file_metadata.processing_notes or []
            }
            
            # Add data preview if available
            if dataframe is not None and len(dataframe) > 0:
                response_data['preview'] = dataframe.head(5).to_dict('records')
                response_data['data_types'] = dataframe.dtypes.astype(str).to_dict()
            
            return jsonify(response_data)
    
    except Exception as e:
        logger.error(f'Upload processing failed: {str(e)}')
        # Clean up file on error
        if 'filepath' in locals() and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        return jsonify({'error': 'Upload processing failed'}), 500

@upload_bp.route('/api/supported-formats', methods=['GET'])
def get_supported_formats():
    """Return comprehensive list of supported formats"""
    
    # Data formats
    data_formats = {
        'structured': ['csv', 'xlsx', 'xls', 'tsv'],
        'semi_structured': ['json', 'xml', 'parquet'],
        'unstructured': ['txt', 'log']
    }
    
    # Document formats
    document_formats = document_processor.get_supported_formats()
    
    # Combined response
    supported_formats = {
        'data_formats': data_formats,
        'document_formats': document_formats,
        'total_formats': len(data_formats['structured']) + len(data_formats['semi_structured']) + 
                        len(data_formats['unstructured']) + len(document_formats['documents']) + 
                        len(document_formats['images']) + len(document_formats['web']),
        'max_file_size_mb': max(ingestion_engine.MAX_FILE_SIZE, document_processor.max_file_size) // (1024 * 1024),
        'processing_capabilities': {
            'text_extraction': True,
            'table_extraction': True,
            'metadata_extraction': True,
            'sentiment_analysis': True,
            'ocr_support': document_formats['ocr_enabled'],
            'multi_language': True
        }
    }
    
    return jsonify(supported_formats)

@upload_bp.route('/api/document-info/<filename>', methods=['GET'])
def get_document_info(filename):
    """Get detailed information about an uploaded document"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Process document to get detailed info
        result = document_processor.process_document(filepath)
        
        if not result.is_valid:
            return jsonify({'error': result.error_message}), 400
        
        # Return comprehensive document information
        return jsonify({
            'success': True,
            'filename': filename,
            'document_info': {
                'type': result.metadata.document_type.value,
                'size_bytes': result.metadata.file_size_bytes,
                'pages': result.metadata.page_count,
                'words': result.metadata.word_count,
                'characters': result.metadata.character_count,
                'language': result.metadata.language,
                'title': result.metadata.title,
                'author': result.metadata.author,
                'creation_date': result.metadata.creation_date,
                'has_tables': result.metadata.has_tables,
                'table_count': result.metadata.table_count,
                'extraction_quality': result.extraction_quality,
                'confidence_score': result.metadata.confidence_score
            },
            'content_analysis': {
                'sentiment_score': result.sentiment_score,
                'key_phrases': result.key_phrases,
                'summary': result.summary
            }
        })
    
    except Exception as e:
        return jsonify({'error': f'Document info retrieval failed: {str(e)}'}), 500

# Legacy endpoint for backward compatibility
@upload_bp.route('/upload', methods=['POST'])
def upload_dataset():
    """Legacy upload endpoint - redirects to new enterprise endpoint"""
    return upload_file()