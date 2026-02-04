import os
import psutil
import tempfile
import shutil
from contextlib import contextmanager
from datetime import datetime, timedelta
import threading
import time

class ResourceManager:
    def __init__(self, max_memory_mb=1024, cleanup_interval=3600):
        self.max_memory_mb = max_memory_mb
        self.cleanup_interval = cleanup_interval
        self.temp_files = set()
        self.lock = threading.Lock()
        self._start_cleanup_thread()
    
    def check_memory_usage(self):
        """Check if memory usage is within limits"""
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        
        if memory_mb > self.max_memory_mb:
            raise MemoryError(f"Memory usage ({memory_mb:.1f}MB) exceeds limit ({self.max_memory_mb}MB)")
        
        return memory_mb
    
    @contextmanager
    def temp_file(self, suffix=None, prefix=None):
        """Context manager for temporary files with automatic cleanup"""
        temp_fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
        
        try:
            with self.lock:
                self.temp_files.add(temp_path)
            
            os.close(temp_fd)
            yield temp_path
            
        finally:
            self._cleanup_file(temp_path)
    
    @contextmanager
    def temp_directory(self, prefix=None):
        """Context manager for temporary directories"""
        temp_dir = tempfile.mkdtemp(prefix=prefix)
        
        try:
            with self.lock:
                self.temp_files.add(temp_dir)
            
            yield temp_dir
            
        finally:
            self._cleanup_directory(temp_dir)
    
    def _cleanup_file(self, file_path):
        """Clean up a single file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
            
            with self.lock:
                self.temp_files.discard(file_path)
                
        except OSError:
            pass
    
    def _cleanup_directory(self, dir_path):
        """Clean up a directory"""
        try:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
            
            with self.lock:
                self.temp_files.discard(dir_path)
                
        except OSError:
            pass
    
    def _start_cleanup_thread(self):
        """Start background cleanup thread"""
        def cleanup_loop():
            while True:
                time.sleep(self.cleanup_interval)
                self._cleanup_old_files()
        
        thread = threading.Thread(target=cleanup_loop, daemon=True)
        thread.start()
    
    def _cleanup_old_files(self):
        """Clean up old temporary files"""
        cutoff_time = datetime.now() - timedelta(hours=1)
        
        with self.lock:
            files_to_remove = []
            
            for file_path in self.temp_files:
                try:
                    if os.path.exists(file_path):
                        stat = os.stat(file_path)
                        if datetime.fromtimestamp(stat.st_mtime) < cutoff_time:
                            files_to_remove.append(file_path)
                    else:
                        files_to_remove.append(file_path)
                except OSError:
                    files_to_remove.append(file_path)
            
            for file_path in files_to_remove:
                if os.path.isdir(file_path):
                    self._cleanup_directory(file_path)
                else:
                    self._cleanup_file(file_path)

# Global resource manager
resource_manager = ResourceManager()