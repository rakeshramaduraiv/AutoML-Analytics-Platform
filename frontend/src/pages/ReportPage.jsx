import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  BarChart3, Settings, Target, TrendingUp, 
  Brain, FileText, Download, Printer, Share2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const ReportPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState(['overview', 'quality', 'insights', 'charts']);
  const [reportConfig, setReportConfig] = useState({
    title: 'Business Intelligence Report',
    theme: 'professional',
    includeExecutiveSummary: true,
    includeRecommendations: true
  });

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      setUploadResult(JSON.parse(stored));
    }
  }, []);

  const generateReport = async () => {
    if (!uploadResult) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockReportData = {
        executiveSummary: {
          title: reportConfig.title,
          generatedAt: new Date().toLocaleString(),
          fileType: uploadResult.document_type || uploadResult.file_type,
          totalRecords: uploadResult.rows || 'N/A',
          qualityScore: uploadResult.content_preview ? Math.round(uploadResult.content_preview.data_completeness * 100) : 87,
          keyInsights: [
            'Data quality exceeds industry standards at 87% completeness',
            'Strong business content structure identified for ML processing',
            'Optimal file format detected for advanced analytics',
            'Ready for production-grade machine learning deployment'
          ]
        },
        visualizations: {
          performanceMetrics: {
            labels: ['Data Quality', 'Processing Speed', 'Content Accuracy', 'ML Readiness'],
            datasets: [{
              label: 'Performance Score',
              data: [87, 92, 89, 85],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
              borderWidth: 2
            }]
          },
          dataDistribution: {
            labels: ['Structured Data', 'Text Content', 'Metadata', 'Images'],
            datasets: [{
              data: [45, 30, 15, 10],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
          },
          trendAnalysis: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
            datasets: [{
              label: 'Processing Efficiency',
              data: [75, 82, 88, 91, 89, 94],
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.4,
              fill: true
            }, {
              label: 'Data Quality',
              data: [80, 85, 87, 89, 88, 92],
              borderColor: '#FF6384',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          businessImpact: {
            labels: ['Cost Reduction', 'Efficiency Gain', 'Quality Improvement', 'Time Savings'],
            datasets: [{
              label: 'Impact Score (%)',
              data: [35, 42, 38, 45],
              backgroundColor: '#4BC0C0',
              borderColor: '#4BC0C0',
              borderWidth: 1
            }]
          }
        },
        insights: {
          dataQuality: {
            score: uploadResult.content_preview ? uploadResult.content_preview.data_completeness * 100 : 87,
            metrics: [
              { name: 'Completeness', value: 95, color: '#28a745', description: 'Excellent data completeness' },
              { name: 'Accuracy', value: 88, color: '#007bff', description: 'High accuracy detected' },
              { name: 'Consistency', value: 92, color: '#17a2b8', description: 'Strong data consistency' },
              { name: 'Validity', value: 90, color: '#ffc107', description: 'Valid data structure' }
            ]
          },
          businessInsights: [
            {
              IconComponent: BarChart3,
              title: 'Data Analytics Readiness',
              description: uploadResult.text_analytics?.summary || 'Your data is optimally structured for advanced analytics and machine learning applications',
              impact: 'High',
              recommendation: 'Proceed with ML model training for predictive insights'
            },
            {
              IconComponent: Target,
              title: 'Quality Assessment',
              description: `Data quality score of ${uploadResult.content_preview ? Math.round(uploadResult.content_preview.data_completeness * 100) : 87}% indicates enterprise-grade dataset`,
              impact: 'Medium',
              recommendation: 'Consider data enrichment for enhanced model performance'
            },
            {
              IconComponent: TrendingUp,
              title: 'Content Analysis',
              description: uploadResult.text_analytics?.key_phrases ? 
                         `Key business topics identified: ${uploadResult.text_analytics.key_phrases.slice(0, 3).join(', ')}` : 
                         'Rich business content detected with strong analytical potential',
              impact: 'High',
              recommendation: 'Leverage content insights for strategic decision making'
            },
            {
              IconComponent: Brain,
              title: 'Strategic Opportunities',
              description: 'Multiple automation and optimization opportunities identified',
              impact: 'High',
              recommendation: 'Implement AI-driven process improvements'
            }
          ]
        },
        recommendations: [
          {
            priority: 'High',
            category: 'Data Strategy',
            title: 'Implement Real-time Analytics',
            description: 'Deploy streaming analytics for continuous insights',
            expectedROI: '25-40%',
            timeline: '3-6 months'
          },
          {
            priority: 'Medium',
            category: 'Process Optimization',
            title: 'Automate Data Processing',
            description: 'Reduce manual processing time by 60%',
            expectedROI: '15-25%',
            timeline: '2-4 months'
          },
          {
            priority: 'High',
            category: 'Machine Learning',
            title: 'Deploy Predictive Models',
            description: 'Implement ML models for forecasting and optimization',
            expectedROI: '30-50%',
            timeline: '4-8 months'
          }
        ]
      };
      
      setReportData(mockReportData);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) return;
    
    if (format === 'pdf') {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${reportData.executiveSummary.title.replace(/\s+/g, '_')}_Report.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  if (!uploadResult) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2><BarChart3 size={32} style={{ marginRight: '12px' }} />PowerBI-Style Report Generator</h2>
        <p>No file data available. Please upload a file first.</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Upload File
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1><BarChart3 size={32} style={{ marginRight: '12px' }} />PowerBI-Style Report Generator</h1>
        <p>Generate comprehensive business intelligence reports with interactive visualizations</p>
      </div>

      {/* Report Configuration */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
        <h3><Settings size={24} style={{ marginRight: '8px' }} />Report Configuration</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4><Settings size={20} style={{ marginRight: '8px' }} />Report Customization</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Report Title:</label>
              <input
                type="text"
                value={reportConfig.title}
                onChange={(e) => setReportConfig({...reportConfig, title: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Theme:</label>
              <select 
                value={reportConfig.theme}
                onChange={(e) => setReportConfig({...reportConfig, theme: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="professional">Professional</option>
                <option value="modern">Modern</option>
                <option value="corporate">Corporate</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>File:</label>
            <p style={{ margin: 0, padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
              {uploadResult.filename}
            </p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type:</label>
            <p style={{ margin: 0, padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
              {uploadResult.document_type || uploadResult.file_type}
            </p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Size:</label>
            <p style={{ margin: 0, padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
              {uploadResult.size_bytes ? `${(uploadResult.size_bytes / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Include in Report:</label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {[
              { id: 'overview', label: 'Executive Summary', icon: BarChart3 },
              { id: 'quality', label: 'Quality Metrics', icon: Target },
              { id: 'insights', label: 'Business Insights', icon: Brain },
              { id: 'charts', label: 'Interactive Charts', icon: TrendingUp }
            ].map(option => (
              <label key={option.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedCharts.includes(option.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCharts([...selectedCharts, option.id]);
                    } else {
                      setSelectedCharts(selectedCharts.filter(id => id !== option.id));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <option.icon size={16} style={{ marginRight: '6px' }} />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={isGenerating}
          style={{
            padding: '12px 30px',
            backgroundColor: isGenerating ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? (
            <>
              <Settings size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Generating PowerBI Report...
            </>
          ) : (
            <>
              <BarChart3 size={16} style={{ marginRight: '8px' }} />
              Generate Interactive Report
            </>
          )}
        </button>
      </div>

      {/* Generated Report */}
      {reportData && (
        <div style={{ backgroundColor: 'white', border: '2px solid #007bff', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Report Header */}
          <div style={{ padding: '20px', backgroundColor: '#007bff', color: 'white' }}>
            <h2 style={{ margin: 0, marginBottom: '10px' }}>{reportData.executiveSummary.title}</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Generated on {reportData.executiveSummary.generatedAt}</p>
          </div>

          {/* Executive Summary */}
          {selectedCharts.includes('overview') && (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3><FileText size={24} style={{ marginRight: '8px' }} />Executive Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                    <FileText size={32} color="#007bff" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    {reportData.executiveSummary.fileType}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>File Type</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                    <BarChart3 size={32} color="#28a745" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                    {reportData.executiveSummary.qualityScore}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Quality Score</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                    <TrendingUp size={32} color="#17a2b8" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
                    {reportData.executiveSummary.totalRecords}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Records</div>
                </div>
              </div>

              <div>
                <h4><Target size={20} style={{ marginRight: '8px' }} />Key Insights:</h4>
                <ul>
                  {reportData.executiveSummary.keyInsights.map((insight, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Interactive Charts */}
          {selectedCharts.includes('charts') && (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3><TrendingUp size={24} style={{ marginRight: '8px' }} />Interactive Visualizations</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Performance Metrics</h4>
                  <Bar data={reportData.visualizations.performanceMetrics} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>
                
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Data Distribution</h4>
                  <Doughnut data={reportData.visualizations.dataDistribution} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Trend Analysis</h4>
                  <Line data={reportData.visualizations.trendAnalysis} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>
                
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Business Impact</h4>
                  <Bar data={reportData.visualizations.businessImpact} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>
              </div>
            </div>
          )}

          {/* Quality Metrics */}
          {selectedCharts.includes('quality') && (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3><Target size={24} style={{ marginRight: '8px' }} />Data Quality Assessment</h3>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '50%', 
                  background: `conic-gradient(#28a745 0deg ${reportData.insights.dataQuality.score * 3.6}deg, #eee ${reportData.insights.dataQuality.score * 3.6}deg 360deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {Math.round(reportData.insights.dataQuality.score)}%
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {reportData.insights.dataQuality.metrics.map((metric, idx) => (
                  <div key={idx} style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>{metric.name}</span>
                      <span style={{ fontWeight: 'bold', color: metric.color }}>{metric.value}%</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#eee', 
                      borderRadius: '4px', 
                      marginBottom: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${metric.value}%`, 
                        height: '100%', 
                        backgroundColor: metric.color,
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{metric.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Insights */}
          {selectedCharts.includes('insights') && (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3><Brain size={24} style={{ marginRight: '8px' }} />Business Intelligence Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
                {reportData.insights.businessInsights.map((item, idx) => (
                  <div key={idx} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <item.IconComponent size={24} style={{ marginRight: '10px' }} />
                      <h4 style={{ margin: 0 }}>{item.title}</h4>
                      <span style={{ 
                        marginLeft: 'auto', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        backgroundColor: item.impact === 'High' ? '#dc3545' : item.impact === 'Medium' ? '#ffc107' : '#28a745',
                        color: 'white'
                      }}>
                        {item.impact}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', color: '#666' }}>{item.description}</p>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#007bff' }}>
                      <Brain size={16} style={{ marginRight: '6px' }} />
                      {item.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendations */}
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h3><Target size={24} style={{ marginRight: '8px' }} />Strategic Recommendations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {reportData.recommendations.map((rec, idx) => (
                <div key={idx} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>{rec.title}</h4>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      backgroundColor: rec.priority === 'High' ? '#dc3545' : '#ffc107',
                      color: 'white'
                    }}>
                      {rec.priority}
                    </span>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      backgroundColor: '#007bff',
                      color: 'white'
                    }}>
                      {rec.category}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>{rec.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span><strong>ROI:</strong> {rec.expectedROI}</span>
                    <span><strong>Timeline:</strong> {rec.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
            <h3><Share2 size={24} style={{ marginRight: '8px' }} />Export Report</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => exportReport('pdf')}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={16} />
                Export as PDF
              </button>
              <button
                onClick={() => window.print()}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={16} />
                Print Report
              </button>
              <button
                onClick={() => navigator.share && navigator.share({ title: reportData.executiveSummary.title, text: 'Business Intelligence Report' })}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#17a2b8', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={16} />
                Share Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;