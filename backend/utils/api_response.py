from flask import jsonify, g
from datetime import datetime
from typing import Any, Dict, Optional

class APIResponse:
    @staticmethod
    def success(data: Any = None, message: str = None, status_code: int = 200):
        """Standard success response"""
        response = {
            'success': True,
            'timestamp': datetime.utcnow().isoformat(),
            'correlation_id': getattr(g, 'correlation_id', None)
        }
        
        if data is not None:
            response['data'] = data
        
        if message:
            response['message'] = message
        
        return jsonify(response), status_code
    
    @staticmethod
    def error(message: str, error_code: str = 'GENERIC_ERROR', 
              details: Dict = None, status_code: int = 400):
        """Standard error response"""
        response = {
            'success': False,
            'error': {
                'message': message,
                'code': error_code,
                'timestamp': datetime.utcnow().isoformat(),
                'correlation_id': getattr(g, 'correlation_id', None)
            }
        }
        
        if details:
            response['error']['details'] = details
        
        return jsonify(response), status_code
    
    @staticmethod
    def paginated(data: list, page: int, per_page: int, total: int):
        """Paginated response format"""
        return APIResponse.success({
            'items': data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
    
    @staticmethod
    def job_status(job_id: str, status: str, progress: int = None, 
                   result: Any = None, error: str = None):
        """Job status response format"""
        response_data = {
            'job_id': job_id,
            'status': status
        }
        
        if progress is not None:
            response_data['progress'] = progress
        
        if result is not None:
            response_data['result'] = result
        
        if error:
            response_data['error'] = error
        
        return APIResponse.success(response_data)