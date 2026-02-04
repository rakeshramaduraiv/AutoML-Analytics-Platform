"""
Structured Logging for Production Observability
"""

import logging
import json
import uuid
from datetime import datetime
from functools import wraps
from flask import request, g

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
    
    def _log_structured(self, level: str, message: str, **context):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'message': message,
            'correlation_id': getattr(g, 'correlation_id', None),
            **context
        }
        getattr(self.logger, level.lower())(json.dumps(log_entry))
    
    def info(self, message: str, **context):
        self._log_structured('INFO', message, **context)
    
    def error(self, message: str, **context):
        self._log_structured('ERROR', message, **context)

class MLDecisionTracer:
    def __init__(self, logger: StructuredLogger):
        self.logger = logger
    
    def log_training_start(self, job_id: str, filename: str):
        self.logger.info(
            "ML training started",
            component="training",
            job_id=job_id,
            filename=filename
        )
    
    def log_training_completion(self, job_id: str, success: bool, error: str = None):
        if success:
            self.logger.info("Training completed", component="training", job_id=job_id)
        else:
            self.logger.error("Training failed", component="training", job_id=job_id, error=error)

def add_correlation_id():
    g.correlation_id = str(uuid.uuid4())

app_logger = StructuredLogger('automl.app')
ml_tracer = MLDecisionTracer(app_logger)