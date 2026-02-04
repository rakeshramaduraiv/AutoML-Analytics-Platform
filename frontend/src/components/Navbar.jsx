import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../constants/icons';
import { Bell, Bot } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [systemHealth, setSystemHealth] = useState(99.8);
  const [activeUsers, setActiveUsers] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => Math.max(98, Math.min(100, prev + (Math.random() - 0.5) * 0.5)));
      setActiveUsers(prev => Math.max(200, Math.min(300, prev + Math.floor((Math.random() - 0.5) * 10))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => {
    return location.pathname === path || (path === '/upload' && location.pathname === '/');
  };

  return (
    <nav style={{
      height: '70px',
      background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Enterprise Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '45px',
            height: '45px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.4rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #FFFFFF, #E5E7EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>AutoML Enterprise</h2>
            <span style={{
              fontSize: '0.8rem',
              color: '#9CA3AF',
              fontWeight: '500'
            }}>AI-Powered Analytics Platform</span>
          </div>
        </div>
        
        {/* Live Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginLeft: '30px'
        }}>
          <div style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{
              fontSize: '0.8rem',
              color: '#10B981',
              fontWeight: '600'
            }}>LIVE</span>
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#9CA3AF',
            fontWeight: '500'
          }}>
            Health: {systemHealth.toFixed(1)}% | Users: {activeUsers}
          </div>
        </div>
      </div>
      
      {/* Enterprise Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {[
          { path: '/upload', iconName: 'DATA_INGESTION', label: 'Data Ingestion', desc: 'Upload and process datasets' },
          { path: '/dashboard', iconName: 'ANALYTICS', label: 'Analytics', desc: 'View insights and performance' },
          { path: '/train', iconName: 'ML_TRAINING', label: 'ML Training', desc: 'Train and deploy models' },
          { path: '/predict', iconName: 'AI_PREDICTION', label: 'Inference', desc: 'Real-time predictions' },
          { path: '/report', iconName: 'REPORTS', label: 'Reports', desc: 'Business intelligence' }
        ].map(({ path, iconName, label, desc }) => (
          <Link
            key={path}
            to={path}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              backgroundColor: isActive(path) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: isActive(path) ? '#3B82F6' : '#D1D5DB',
              border: isActive(path) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!isActive(path)) {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.target.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(path)) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#D1D5DB';
              }
            }}
            title={desc}
          >
            <Icon name={iconName} size={20} />
            {label}
          </Link>
        ))}
      </div>
      
      {/* Enterprise Status Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <button
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
          }}
          onClick={() => alert('System Notifications:\n\n• Model training completed\n• New dataset uploaded\n• Performance alert resolved\n• System update available')}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <Bell size={16} style={{ marginRight: '6px' }} />
          Alerts
        </button>
        
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{
            fontSize: '0.8rem',
            color: '#10B981',
            fontWeight: '700'
          }}>ENTERPRISE ONLINE</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;