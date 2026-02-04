import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/dashboard.css';
import './styles/enterprise.css';

// Enterprise error boundary
class EnterpriseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Enterprise Error:', error, errorInfo);
    // In production, send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#F59E0B' }}>⚠</div>
            <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>System Error</h2>
            <p style={{ color: '#6B7280', marginBottom: '30px' }}>
              An unexpected error occurred. Our engineering team has been notified.
            </p>
            <button
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <EnterpriseErrorBoundary>
      <App />
    </EnterpriseErrorBoundary>
  </React.StrictMode>
);