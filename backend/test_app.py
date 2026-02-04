from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "AutoML Analytics Platform"})

if __name__ == '__main__':
    print("Starting minimal Flask app...")
    app.run(debug=True, host='0.0.0.0', port=5000)