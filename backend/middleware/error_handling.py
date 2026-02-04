import uuid
from flask import jsonify, request, g
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class APIError(Exception):
    def __init__(self, message, status_code=400, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or 'GENERIC_ERROR'

class ValidationError(APIError):
    def __init__(self, message, field=None):
        super().__init__(message, 400, 'VALIDATION_ERROR')
        self.field = field

class ResourceNotFoundError(APIError):
    def __init__(self, resource_type, resource_id):
        super().__init__(f"{resource_type} not found: {resource_id}", 404, 'RESOURCE_NOT_FOUND')

class ProcessingError(APIError):
    def __init__(self, message):
        super().__init__(message, 422, 'PROCESSING_ERROR')

def add_correlation_id():
    """Add correlation ID to request context"""
    g.correlation_id = str(uuid.uuid4())

def handle_api_error(error):
    """Global error handler for API errors"""
    correlation_id = getattr(g, 'correlation_id', 'unknown')
    
    logger.error(f"API Error [{correlation_id}]: {error.message}", 
                extra={'correlation_id': correlation_id, 'error_code': error.error_code})
    
    response = {
        'error': {
            'message': error.message,
            'code': error.error_code,
            'correlation_id': correlation_id
        }
    }
    
    if hasattr(error, 'field') and error.field:
        response['error']['field'] = error.field
    
    return jsonify(response), error.status_code

def handle_generic_error(error):
    """Handle unexpected errors"""
    correlation_id = getattr(g, 'correlation_id', 'unknown')
    
    logger.exception(f"Unexpected error [{correlation_id}]: {str(error)}")
    
    return jsonify({
        'error': {
            'message': 'Internal server error',
            'code': 'INTERNAL_ERROR',
            'correlation_id': correlation_id
        }
    }), 500

def with_error_handling(f):
    """Decorator to wrap endpoints with error handling"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Unexpected error: {str(e)}", 500, 'INTERNAL_ERROR')
    return wrapper