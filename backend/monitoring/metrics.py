import time
from collections import defaultdict, deque
from threading import Lock
from datetime import datetime

class MetricsCollector:
    def __init__(self):
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(lambda: deque(maxlen=1000))
        self.lock = Lock()
    
    def increment(self, metric_name, value=1, tags=None):
        """Increment a counter metric"""
        with self.lock:
            key = f"{metric_name}:{tags}" if tags else metric_name
            self.counters[key] += value
    
    def gauge(self, metric_name, value, tags=None):
        """Set a gauge metric"""
        with self.lock:
            key = f"{metric_name}:{tags}" if tags else metric_name
            self.gauges[key] = value
    
    def histogram(self, metric_name, value, tags=None):
        """Add value to histogram"""
        with self.lock:
            key = f"{metric_name}:{tags}" if tags else metric_name
            self.histograms[key].append(value)
    
    def timer(self, metric_name, tags=None):
        """Context manager for timing operations"""
        return TimerContext(self, metric_name, tags)
    
    def get_metrics(self):
        """Get current metrics snapshot"""
        with self.lock:
            return {
                'counters': dict(self.counters),
                'gauges': dict(self.gauges),
                'histograms': {k: list(v) for k, v in self.histograms.items()},
                'timestamp': datetime.utcnow().isoformat()
            }

class TimerContext:
    def __init__(self, collector, metric_name, tags):
        self.collector = collector
        self.metric_name = metric_name
        self.tags = tags
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        self.collector.histogram(f"{self.metric_name}_duration", duration, self.tags)

# Global metrics instance
metrics = MetricsCollector()