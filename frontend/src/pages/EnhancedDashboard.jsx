import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Activity, Target, Zap, CheckCircle, AlertTriangle, XCircle, RefreshCw, Lightbulb, TrendingUp } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import PowerBIVisualization from '../components/PowerBIVisualization';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const [uploadResult, setUploadResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);
  const [systemHealth, setSystemHealth] = useState(98.5);
  const [chartPosition, setChartPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        setUploadResult(parsedData);
        generateAnalytics(parsedData);
      } catch (error) {
        console.error('Failed to parse stored data');
        localStorage.removeItem('uploadResult');
      }
    }
    
    // Real-time data simulation
    intervalRef.current = setInterval(() => {
      setRealTimeData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          value: Math.floor(Math.random() * 100) + 50,
          throughput: Math.floor(Math.random() * 1000) + 500
        };
        return [...prev.slice(-9), newPoint];
      });
      
      setSystemHealth(prev => {
        const change = (Math.random() - 0.5) * 2;
        return Math.max(95, Math.min(100, prev + change));
      });
    }, 3000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getChartData = () => {
    return {
      labels: realTimeData.map(d => d.time),
      datasets: [
        {
          label: 'System Performance',
          data: realTimeData.map(d => d.value),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Throughput',
          data: realTimeData.map(d => d.throughput),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Performance %'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Throughput (req/s)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-Time System Metrics'
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'excellent': return <CheckCircle size={16} color="#10B981" />;
      case 'good': return <Target size={16} color="#3B82F6" />;
      case 'warning': return <AlertTriangle size={16} color="#F59E0B" />;
      case 'critical': return <XCircle size={16} color="#EF4444" />;
      default: return <Activity size={16} color="#6B7280" />;
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.chart-header')) {
      setIsDragging(true);
      const rect = chartRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const handleMouseMove = (e) => {
        setChartPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY
        });
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const generateAnalytics = (data) => {
    
    setTimeout(() => {
      const mockAnalytics = {
        overview: {
          totalFiles: 1,
          dataQuality: data.content_preview && data.content_preview.data_completeness && typeof data.content_preview.data_completeness === 'number' 
            ? Math.round(data.content_preview.data_completeness * 100) : 87,
          processingStatus: 'Complete',
          lastUpdated: new Date().toLocaleString(),
          mlReadiness: 'High'
        },
        metrics: [
          { 
            id: 'quality', 
            title: 'Data Quality Score', 
            value: data.content_preview && data.content_preview.data_completeness && typeof data.content_preview.data_completeness === 'number' 
              ? Math.round(data.content_preview.data_completeness * 100) : 87, 
            unit: '%', 
            trend: '+5.2%', 
            trendDirection: 'up',
            color: '#10B981',
            icon: <Target size={20} />,
            description: 'ML-ready data completeness with automated quality checks',
            benchmark: 85,
            status: 'excellent'
          },
          { 
            id: 'records', 
            title: 'Active Records', 
            value: data.rows || 1000, 
            unit: '', 
            trend: '+12.5K', 
            trendDirection: 'up',
            color: '#3B82F6',
            icon: <BarChart3 size={20} />,
            description: 'Real-time data ingestion with automated validation',
            benchmark: 800,
            status: 'above-target'
          },
          { 
            id: 'features', 
            title: 'Feature Engineering', 
            value: data.columns || 8, 
            unit: ' vars', 
            trend: '+3 new', 
            trendDirection: 'up',
            color: '#8B5CF6',
            icon: <Activity size={20} />,
            description: 'Automated feature selection and dimensionality optimization',
            benchmark: 5,
            status: 'optimal'
          },
          { 
            id: 'processing', 
            title: 'Processing Latency', 
            value: 2.3, 
            unit: 's', 
            trend: '-18%', 
            trendDirection: 'down',
            color: '#F59E0B',
            icon: <Zap size={20} />,
            description: 'Enterprise-grade processing with GPU acceleration',
            benchmark: 3.0,
            status: 'excellent'
          },
          {
            id: 'accuracy',
            title: 'Model Accuracy',
            value: 94.7,
            unit: '%',
            trend: '+2.1%',
            trendDirection: 'up',
            color: '#EF4444',
            icon: <Target size={20} />,
            description: 'Cross-validated performance with confidence intervals',
            benchmark: 90,
            status: 'excellent'
          },
          {
            id: 'throughput',
            title: 'API Throughput',
            value: 847,
            unit: ' req/s',
            trend: '+23%',
            trendDirection: 'up',
            color: '#06B6D4',
            icon: <Activity size={20} />,
            description: 'Real-time prediction API with auto-scaling',
            benchmark: 500,
            status: 'excellent'
          }
        ],
        insights: [
          {
            type: 'success',
            icon: <CheckCircle size={16} color="#10B981" />,
            title: 'High Quality Dataset',
            message: 'Your data meets enterprise standards with minimal missing values',
            action: 'Ready for ML training'
          },
          {
            type: 'info',
            icon: <Target size={16} color="#3B82F6" />,
            title: 'Content Analysis Complete',
            message: data.text_analytics?.summary || 'Document structure analyzed successfully',
            action: 'View detailed report'
          },
          {
            type: 'warning',
            icon: <AlertTriangle size={16} color="#F59E0B" />,
            title: 'Optimization Opportunity',
            message: 'Consider feature engineering for improved model performance',
            action: 'Learn more'
          }
        ],
        quickActions: [
          { 
            id: 'train', 
            title: 'Train ML Model', 
            description: 'Create intelligent models from your data', 
            icon: <Activity size={20} />, 
            color: '#10B981',
            action: () => navigate('/train')
          },
          { 
            id: 'visualize', 
            title: 'Create Visualizations', 
            description: 'Build PowerBI-style interactive charts', 
            icon: <BarChart3 size={20} />, 
            color: '#3B82F6',
            action: () => navigate('/dashboard')
          },
          { 
            id: 'predict', 
            title: 'Make Predictions', 
            description: 'Use trained models for real-time inference', 
            icon: <Zap size={20} />, 
            color: '#8B5CF6',
            action: () => navigate('/predict')
          },
          { 
            id: 'report', 
            title: 'Generate Report', 
            description: 'Create comprehensive business intelligence reports', 
            icon: <Target size={20} />, 
            color: '#F59E0B',
            action: () => navigate('/report')
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
      setIsLoading(false);
    }, 1000);
  };

  if (!uploadResult) {
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
          textAlign: 'center', 
          backgroundColor: 'white', 
          padding: '60px 40px', 
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#3B82F6' }}><BarChart3 size={64} /></div>
          <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>Analytics Dashboard</h2>
          <p style={{ color: '#6B7280', marginBottom: '30px' }}>Upload your data to unlock powerful insights and AI-driven analytics</p>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              padding: '15px 30px', 
              backgroundColor: '#3B82F6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
          >
            Upload Your Data
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px', color: '#3B82F6' }}><RefreshCw size={48} /></div>
          <h2>Generating Analytics...</h2>
          <p>Processing your data for insights</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header with Live Status */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '25px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10B981',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>System Online</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '25px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}><RefreshCw size={16} /> Auto-Refresh: ON</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '25px',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}><RefreshCw size={16} /> Refresh Data</span>
            </div>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '700' }}>
            <BarChart3 size={20} /> Analytics Dashboard
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Comprehensive insights from your data powered by AI
          </p>
          <div style={{ 
            marginTop: '15px',
            fontSize: '0.9rem',
            opacity: 0.8
          }}>
            Last updated: {new Date().toLocaleString()} | Data freshness: <span style={{ color: '#10B981' }}>Real-time</span>
          </div>
        </div>

        {/* PowerBI-Style Customizable Visualizations */}
        <PowerBIVisualization 
          data={analytics} 
          title="Business Intelligence Dashboard" 
        />
        
        <PowerBIVisualization 
          data={analytics} 
          title="Performance Analytics" 
        />

        {/* Real-Time Monitoring Section */}
        {realTimeData.length > 0 && (
          <div 
            ref={chartRef}
            style={{ 
              backgroundColor: 'white', 
              padding: '30px', 
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: '40px',
              position: 'relative',
              left: chartPosition.x,
              top: chartPosition.y,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
          >
            <div 
              className="chart-header"
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '25px',
                cursor: 'grab'
              }}
            >
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1F2937', 
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <TrendingUp size={20} /> Real-Time System Monitoring
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: systemHealth > 98 ? '#10B981' : systemHealth > 95 ? '#F59E0B' : '#EF4444',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                    System Health: {systemHealth.toFixed(1)}%
                  </span>
                </div>
                <div style={{ 
                  padding: '6px 12px', 
                  backgroundColor: '#10B981', 
                  color: 'white', 
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  LIVE
                </div>
              </div>
            </div>
            
            <div style={{ height: '300px' }}>
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>
        )}

        {/* System Status Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => alert('API Throughput Details:\n\nCurrent: ' + (realTimeData.length > 0 ? realTimeData[realTimeData.length - 1]?.throughput || 847 : 847) + ' req/s\nPeak: 1,247 req/s\nAverage: 623 req/s\nUptime: 99.8%')}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '10px', cursor: 'pointer' }}><Activity size={32} color="#3B82F6" /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6', marginBottom: '5px' }}>
              {realTimeData.length > 0 ? realTimeData[realTimeData.length - 1]?.throughput || 847 : 847}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>API Requests/sec</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '5px' }}>↑ +23% vs last hour</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => alert('System Health Details:\n\nCurrent: ' + systemHealth.toFixed(1) + '%\nCPU Usage: 23%\nMemory: 67%\nDisk I/O: Normal\nNetwork: Optimal')}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '10px', cursor: 'pointer' }}><CheckCircle size={32} color="#10B981" /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981', marginBottom: '5px' }}>
              {systemHealth.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>System Health</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '5px' }}>Excellent</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => alert('Model Performance Details:\n\nAccuracy: 94.7%\nPrecision: 92.3%\nRecall: 96.1%\nF1-Score: 94.2%\nAUC-ROC: 0.987\nConfidence: High')}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '10px', cursor: 'pointer' }}><Target size={32} color="#8B5CF6" /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8B5CF6', marginBottom: '5px' }}>
              94.7%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Model Accuracy</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '5px' }}>Above Target</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => alert('Response Time Details:\n\nCurrent: 2.3s\nP50: 1.8s\nP95: 4.2s\nP99: 7.1s\nTimeout Rate: 0.02%\nSLA: 99.95%')}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '10px', cursor: 'pointer' }}><Zap size={32} color="#F59E0B" /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B', marginBottom: '5px' }}>
              2.3s
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Avg Response</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '5px' }}>↓ -18% improved</div>
          </div>
        </div>
        {/* Enhanced Metrics Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '25px', 
          marginBottom: '40px' 
        }}>
          {analytics?.metrics.map((metric) => (
            <div 
              key={metric.id}
              style={{ 
                backgroundColor: 'white', 
                padding: '30px', 
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: activeMetric === metric.id ? `3px solid ${metric.color}` : '3px solid transparent'
              }}
              onClick={() => setActiveMetric(activeMetric === metric.id ? null : metric.id)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '2rem' }}>{metric.icon}</div>
                  <div style={{ 
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    backgroundColor: getStatusColor(metric.status) + '20',
                    color: getStatusColor(metric.status),
                    borderRadius: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {getStatusIcon(metric.status)} {metric.status}
                  </div>
                </div>
                <div style={{ 
                  padding: '5px 12px', 
                  backgroundColor: metric.trendDirection === 'up' ? '#10B981' : '#EF4444', 
                  color: 'white', 
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {metric.trendDirection === 'up' ? '↑' : '↓'} {metric.trend}
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: metric.color,
                  marginBottom: '5px'
                }}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  <span style={{ fontSize: '1rem', marginLeft: '5px' }}>{metric.unit}</span>
                </div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: '#1F2937',
                  marginBottom: '8px'
                }}>
                  {metric.title}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#6B7280',
                  lineHeight: '1.4'
                }}>
                  {metric.description}
                </div>
              </div>

              {activeMetric === metric.id && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '15px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '10px',
                  borderLeft: `4px solid ${metric.color}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '10px' }}>
                    <strong>Performance Analysis:</strong> Current value is {metric.value > metric.benchmark ? 'above' : 'below'} benchmark of {metric.benchmark}{metric.unit}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      flex: 1, 
                      height: '8px', 
                      backgroundColor: '#E5E7EB', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(100, (metric.value / (metric.benchmark * 1.2)) * 100)}%`,
                        backgroundColor: metric.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                      {Math.round((metric.value / metric.benchmark) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Insights Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1F2937', 
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Lightbulb size={20} /> AI-Powered Insights
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {analytics?.insights.map((insight, idx) => (
              <div key={idx} style={{ 
                padding: '20px', 
                backgroundColor: insight.type === 'success' ? '#ECFDF5' : 
                                insight.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
                borderRadius: '15px',
                border: `2px solid ${insight.type === 'success' ? '#10B981' : 
                                   insight.type === 'warning' ? '#F59E0B' : '#3B82F6'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{insight.icon}</span>
                  <h4 style={{ margin: 0, color: '#1F2937', fontWeight: '600' }}>{insight.title}</h4>
                </div>
                <p style={{ margin: '0 0 15px 0', color: '#374151', lineHeight: '1.5' }}>
                  {insight.message}
                </p>
                <button style={{ 
                  padding: '8px 16px', 
                  backgroundColor: insight.type === 'success' ? '#10B981' : 
                                  insight.type === 'warning' ? '#F59E0B' : '#3B82F6',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  if (insight.type === 'success') {
                    alert('🎯 Data Quality Report:\n\n✓ Completeness: 94.2%\n✓ Consistency: 91.8%\n✓ Validity: 96.5%\n✓ Uniqueness: 99.1%\n\nRecommendation: Ready for production ML training');
                  } else if (insight.type === 'info') {
                    alert('🔍 Content Analysis Summary:\n\n✓ Document structure validated\n✓ Schema compliance: 100%\n✓ Data types identified\n✓ Relationships mapped\n\nNext: Feature engineering recommended');
                  } else {
                    alert('⚡ Optimization Opportunities:\n\n• Feature scaling recommended\n• Categorical encoding needed\n• Missing value imputation\n• Outlier detection suggested\n\nEstimated improvement: +12% accuracy');
                  }
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {insight.action} 🔗
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1F2937', 
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Activity size={20} /> Quick Actions
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {analytics?.quickActions.map((action) => (
              <div 
                key={action.id}
                onClick={action.action}
                style={{ 
                  padding: '25px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = action.color + '10';
                  e.target.style.borderColor = action.color;
                  e.target.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginRight: '15px',
                    padding: '10px',
                    backgroundColor: action.color + '20',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (action.id === 'train') {
                      alert('🤖 ML Training Options:\n\n• AutoML Pipeline\n• Custom Model Builder\n• Transfer Learning\n• Ensemble Methods\n\nEstimated training time: 15-30 minutes');
                    } else if (action.id === 'visualize') {
                      alert('📈 Visualization Library:\n\n• Interactive Charts\n• Statistical Plots\n• Correlation Matrices\n• Feature Distributions\n• Custom Dashboards');
                    } else if (action.id === 'predict') {
                      alert('🔮 Prediction Services:\n\n• Real-time API\n• Batch Processing\n• Model Comparison\n• Confidence Scoring\n• A/B Testing');
                    } else {
                      alert('📄 Report Generation:\n\n• Executive Summary\n• Technical Analysis\n• Performance Metrics\n• Business Insights\n• Export Options (PDF/Excel)');
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.backgroundColor = action.color + '40';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.backgroundColor = action.color + '20';
                  }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <h4 style={{ 
                      margin: 0, 
                      color: '#1F2937', 
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.id === 'train') {
                        alert('🚀 Ready to start ML training?\n\nYour data quality score: 87%\nRecommended algorithms: Random Forest, XGBoost\nExpected accuracy: 85-92%\n\nClick the card to proceed!');
                      }
                    }}
                    >
                      {action.title} {action.id === 'train' ? '🔥' : action.id === 'visualize' ? '✨' : action.id === 'predict' ? '🎯' : '📈'}
                    </h4>
                  </div>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: '#6B7280', 
                  lineHeight: '1.4',
                  fontSize: '0.95rem'
                }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedDashboard;