from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def init_database(app):
    """Initialize database with connection pooling"""
    database_url = os.getenv('DATABASE_URL', 'sqlite:///automl.db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 300,
        'pool_pre_ping': True
    }
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        db.create_all()
    
    return db