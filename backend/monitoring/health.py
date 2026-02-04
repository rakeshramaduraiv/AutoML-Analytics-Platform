import os
import time
from datetime import datetime
from database.connection import db
from monitoring.metrics import metrics

class HealthChecker:
    def __init__(self):
        self.checks = {}
    
    def register_check(self, name, check_func):
        """Register a health check function"""
        self.checks[name] = check_func
    
    def run_checks(self):
        """Run all health checks and return status"""
        results = {}
        overall_healthy = True
        
        for name, check_func in self.checks.items():
            try:
                start_time = time.time()
                result = check_func()
                duration = time.time() - start_time
                
                results[name] = {
                    'status': 'healthy' if result else 'unhealthy',
                    'duration_ms': round(duration * 1000, 2),
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                if not result:
                    overall_healthy = False
                    
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }
                overall_healthy = False
        
        return {
            'overall_status': 'healthy' if overall_healthy else 'unhealthy',
            'checks': results,
            'timestamp': datetime.utcnow().isoformat()
        }

def check_database():
    """Check database connectivity"""
    try:
        db.session.execute('SELECT 1')
        return True
    except:
        return False

def check_filesystem():
    """Check required directories exist and are writable"""
    required_dirs = ['uploads', 'models', 'logs']
    for dir_name in required_dirs:
        if not os.path.exists(dir_name):
            return False
        if not os.access(dir_name, os.W_OK):
            return False
    return True

def check_ml_engine():
    """Check ML engine can import required libraries"""
    try:
        import sklearn
        import pandas
        import numpy
        return True
    except ImportError:
        return False

# Initialize health checker
health_checker = HealthChecker()
health_checker.register_check('database', check_database)
health_checker.register_check('filesystem', check_filesystem)
health_checker.register_check('ml_engine', check_ml_engine)