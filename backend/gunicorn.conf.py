import os

bind = "0.0.0.0:5000"
workers = int(os.environ.get("GUNICORN_WORKERS", 2))
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"