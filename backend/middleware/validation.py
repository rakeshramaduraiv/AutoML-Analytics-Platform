from functools import wraps
from flask import request, jsonify
import json

def validate_json(required_fields=None):
    """Validate JSON request body"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            try:
                data = request.get_json()
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid JSON format'}), 400
            
            if required_fields:
                missing = [field for field in required_fields if field not in data]
                if missing:
                    return jsonify({'error': f'Missing required fields: {missing}'}), 400
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def validate_file_upload(allowed_extensions=None):
    """Validate file upload requests"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if allowed_extensions:
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                if ext not in allowed_extensions:
                    return jsonify({'error': f'File type not allowed. Allowed: {allowed_extensions}'}), 400
            
            return f(*args, **kwargs)
        return wrapper
    return decorator