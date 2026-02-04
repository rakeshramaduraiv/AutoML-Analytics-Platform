import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon, ICON_SIZES } from '../constants/icons';
import { Bot, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

const NewSidebar = () => {
  const [stats, setStats] = useState({
    totalFiles: 12,
    modelsCreated: 8,
    predictions: 1247,
    systemHealth: 99.8,
    activeJobs: 3
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        predictions: prev.predictions + Math.floor(Math.random() * 3),
        systemHealth: Math.max(98, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 0.2))
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { 
      path: '/', 
      iconName: 'DATA_INGESTION',
      label: 'Data Ingestion', 
      description: 'Upload & process datasets',
      badge: 'NEW'
    },
    { 
      path: '/preprocess', 
      iconName: 'SETTINGS',
      label: 'Data Preprocessing', 
      description: 'Clean & transform data',
      badge: 'CLEAN'
    },
    { 
      path: '/powerquery', 
      iconName: 'TRANSFORM',
      label: 'Power Query', 
      description: 'Advanced data transformation',
      badge: 'PRO'
    },
    { 
      path: '/dashboard', 
      iconName: 'ANALYTICS',
      label: 'Analytics Hub', 
      description: 'Real-time insights & KPIs',
      badge: stats.activeJobs > 0 ? stats.activeJobs.toString() : null
    },
    { 
      path: '/train', 
      iconName: 'ML_TRAINING',
      label: 'ML Training', 
      description: 'Enterprise AutoML with intelligent algorithm selection',
      badge: 'AI'
    },
    { 
      path: '/predict', 
      iconName: 'AI_PREDICTION',
      label: 'AI Prediction Engine', 
      description: 'Enterprise ML inference with real-time analytics & confidence scoring',
      badge: 'LIVE'
    },
    { 
      path: '/report', 
      iconName: 'REPORTS',
      label: 'BI Reports', 
      description: 'Enterprise dashboards',
      badge: null
    },
    { 
      path: '/powerbi', 
      iconName: 'POWERBI',
      label: 'PowerBI Reports', 
      description: 'Interactive report builder',
      badge: 'NEW'
    }
  ];

  return (
    <aside style={{
      width: isCollapsed ? '80px' : '280px',
      minHeight: 'calc(100vh - 70px)',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      borderRight: '1px solid #E5E7EB',
      transition: 'width 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0,0,0,0.05)'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '25px 20px',
        borderBottom: '1px solid #E5E7EB',
        position: 'relative'
      }}>
        <button
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#F3F4F6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#E5E7EB'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#F3F4F6'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        {!isCollapsed && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  color: '#1F2937'
                }}>AutoML Enterprise</h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: '#6B7280',
                  fontWeight: '500'
                }}>AI Analytics Platform</p>
              </div>
            </div>
            
            {/* Live Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
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
                color: '#059669',
                fontWeight: '600'
              }}>System Health: {stats.systemHealth.toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '20px 15px',
        overflowY: 'auto'
      }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: isCollapsed ? '12px 8px' : '15px 16px',
              textDecoration: 'none',
              color: location.pathname === item.path ? '#3B82F6' : '#6B7280',
              backgroundColor: location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: '12px',
              margin: '6px 0',
              transition: 'all 0.3s ease',
              border: location.pathname === item.path ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
              position: 'relative',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.backgroundColor = '#F9FAFB';
                e.target.style.borderColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = 'transparent';
              }
            }}
            title={isCollapsed ? `${item.label} - ${item.description}` : ''}
          >
            <Icon 
              name={item.iconName} 
              size={ICON_SIZES.MEDIUM}
              style={{ 
                marginRight: isCollapsed ? 0 : '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            
            {!isCollapsed && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: location.pathname === item.path ? '700' : '600',
                    fontSize: '0.95rem',
                    marginBottom: '2px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#9CA3AF',
                    fontWeight: '500'
                  }}>
                    {item.description}
                  </div>
                </div>
                
                {item.badge && (
                  <div style={{
                    padding: '3px 8px',
                    backgroundColor: item.badge === 'LIVE' ? '#10B981' : 
                                   item.badge === 'AI' ? '#8B5CF6' : 
                                   item.badge === 'NEW' ? '#F59E0B' : 
                                   item.badge === 'CLEAN' ? '#06B6D4' : '#3B82F6',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    minWidth: '20px'
                  }}>
                    {item.badge}
                  </div>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Enterprise Stats */}
      {!isCollapsed && (
        <>
          <div style={{
            padding: '20px 15px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <h4 style={{ 
              margin: '0 0 15px 0', 
              fontSize: '1rem', 
              fontWeight: '700',
              color: '#1F2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Icon name="CHART" size={ICON_SIZES.SMALL} /> Enterprise Metrics
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { iconName: 'DATABASE', label: 'Datasets', value: stats.totalFiles, color: '#3B82F6' },
                { iconName: 'MODELS', label: 'ML Models', value: stats.modelsCreated, color: '#10B981' },
                { iconName: 'AI_PREDICTION', label: 'Predictions', value: stats.predictions.toLocaleString(), color: '#8B5CF6' },
                { iconName: 'ACTIVITY', label: 'Active Jobs', value: stats.activeJobs, color: '#F59E0B' }
              ].map(({ iconName, label, value, color }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #F3F4F6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={iconName} size={ICON_SIZES.SMALL} color={color} />
                    <span style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: '500' }}>{label}</span>
                  </div>
                  <span style={{ fontWeight: '700', color, fontSize: '0.9rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise Help */}
          <div style={{
            padding: '20px 15px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '0.9rem', 
                color: '#3B82F6',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Lightbulb size={ICON_SIZES.SMALL} /> Enterprise Tip
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '0.8rem', 
                color: '#6B7280', 
                lineHeight: '1.4',
                fontWeight: '500'
              }}>
                Upload enterprise data (PDF, DOCX, XLSX) for AI-powered analysis with SOC2 compliance!
              </p>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default NewSidebar;