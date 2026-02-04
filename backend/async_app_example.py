from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.job_models import Base
from services.job_manager import init_job_manager
from routes.jobs_api import jobs_bp

app = Flask(__name__)

# Database setup
engine = create_engine('sqlite:///jobs.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
db_session = Session()

# Initialize job manager
job_manager = init_job_manager(db_session)

# Register routes
app.register_blueprint(jobs_bp)

# Example usage
@app.route('/api/train-async', methods=['POST'])
def train_async():
    """Convert sync training to async job"""
    data = request.get_json()
    
    # Instead of training immediately, create job
    job_id = str(uuid.uuid4())
    job = job_manager.create_job(job_id, {
        'filename': data['filename'],
        'config': data.get('config', {}),
        'priority': data.get('priority', 'normal')
    })
    
    return jsonify({
        'job_id': job_id,
        'status': 'PENDING',
        'message': 'Training job submitted',
        'poll_url': f'/api/jobs/{job_id}'
    }), 202

if __name__ == '__main__':
    app.run(debug=True)