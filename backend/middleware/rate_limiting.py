import time
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify
import threading

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(deque)
        self.lock = threading.Lock()
    
    def is_allowed(self, key, limit, window_seconds):
        """Check if request is within rate limit"""
        now = time.time()
        window_start = now - window_seconds
        
        with self.lock:
            # Remove old requests outside the window
            while self.requests[key] and self.requests[key][0] < window_start:
                self.requests[key].popleft()
            
            # Check if under limit
            if len(self.requests[key]) < limit:
                self.requests[key].append(now)
                return True
            
            return False
    
    def get_reset_time(self, key, window_seconds):
        """Get time when rate limit resets"""
        with self.lock:
            if not self.requests[key]:
                return 0
            return int(self.requests[key][0] + window_seconds)

rate_limiter = RateLimiter()

def rate_limit(requests_per_minute=60):
    """Decorator for rate limiting endpoints"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Use IP address as key (in production, use user ID)
            key = request.remote_addr
            limit = requests_per_minute
            window = 60  # 1 minute
            
            if not rate_limiter.is_allowed(key, limit, window):
                reset_time = rate_limiter.get_reset_time(key, window)
                
                return jsonify({
                    'error': {
                        'message': 'Rate limit exceeded',
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'retry_after': reset_time
                    }
                }), 429
            
            return f(*args, **kwargs)
        return wrapper
    return decorator