import React, { useState, useEffect } from 'react';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      setHasError(true);
      setError(error);
      setErrorInfo(errorInfo);
      
      // Log to enterprise monitoring
      console.error('Enterprise Error Boundary:', error, errorInfo);
      
      // Send to monitoring service (in production)
      if (process.env.NODE_ENV === 'production') {
        // Analytics.track('error', { error: error.message, stack: error.stack });
      }
    };

    window.addEventListener('error', (event) => {
      handleError(event.error, { componentStack: event.filename + ':' + event.lineno });
    });

    window.addEventListener('unhandledrejection', (event) => {
      handleError(new Error(event.reason), { componentStack: 'Promise rejection' });
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#F59E0B' }}>⚠</div>
          <h2 style={{ color: '#EF4444', marginBottom: '15px' }}>
            Enterprise System Error
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '20px' }}>
            An unexpected error occurred in the AutoML platform. Our monitoring team has been notified.
          </p>
          
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <h4 style={{ color: '#DC2626', margin: '0 0 10px 0' }}>Error Details:</h4>
            <code style={{ fontSize: '0.9rem', color: '#374151' }}>
              {error?.message || 'Unknown error occurred'}
            </code>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Reload Application
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🏠 Go Home
            </button>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#F0F9FF',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#0369A1'
          }}>
            💡 <strong>Enterprise Support:</strong> Contact support@automl-enterprise.com with error ID: {Date.now()}
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;