import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class DatabaseConfig:
    url: str
    pool_size: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600

@dataclass
class MLConfig:
    max_training_time: int = 3600  # seconds
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    supported_formats: list = None
    
    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = ['csv', 'xlsx', 'json']

@dataclass
class AppConfig:
    debug: bool = False
    secret_key: str = None
    cors_origins: list = None
    log_level: str = 'INFO'
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ['http://localhost:3000']

class Config:
    def __init__(self):
        self.database = DatabaseConfig(
            url=os.getenv('DATABASE_URL', 'sqlite:///automl.db'),
            pool_size=int(os.getenv('DB_POOL_SIZE', '10'))
        )
        
        self.ml = MLConfig(
            max_training_time=int(os.getenv('MAX_TRAINING_TIME', '3600')),
            max_file_size=int(os.getenv('MAX_FILE_SIZE', str(100 * 1024 * 1024)))
        )
        
        self.app = AppConfig(
            debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
            secret_key=os.getenv('SECRET_KEY', 'dev-key-change-in-production'),
            log_level=os.getenv('LOG_LEVEL', 'INFO')
        )

config = Config()