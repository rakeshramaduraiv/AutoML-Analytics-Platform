import os
import secrets
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from models import db, Dataset, TrainingRun, PredictionJob
from routes.upload import upload_bp
from routes.analyze import analyze_bp
from routes.train import train_bp
from routes.predict_simple import predict_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

CORS(app, origins=os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(','))
socketio = SocketIO(app, cors_allowed_origins=os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000'), async_mode='threading')
db.init_app(app)

with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database initialization failed: {e}")

app.register_blueprint(upload_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(train_bp)
app.register_blueprint(predict_bp)

@socketio.on('connect')
def handle_connect():
    try:
        emit('status', {'message': 'Connected to AutoML Platform'})
    except Exception:
        pass

@socketio.on('request_stats')
def handle_stats_request():
    try:
        stats = {
            'total_datasets': Dataset.query.count(),
            'total_models': TrainingRun.query.filter_by(status='completed').count(),
            'total_predictions': PredictionJob.query.count(),
            'active_training': TrainingRun.query.filter_by(status='running').count()
        }
        emit('stats_update', stats)
    except Exception:
        emit('error', {'message': 'Failed to retrieve stats'})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "AutoML Analytics Platform",
        "database": "connected",
        "websocket": "enabled"
    })

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    socketio.run(app, debug=debug, host=host, port=port)