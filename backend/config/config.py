# Application configuration settings
import os

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    UPLOAD_FOLDER = 'datasets'
    MODEL_FOLDER = 'models'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size