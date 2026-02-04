import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Download, 
  Eye, Grid, Layout, Save, Share2,
  Plus, Trash2, Copy, RefreshCw, Edit3
} from 'lucide-react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ImprovedPowerBIPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setUploadResult(result);
      generateSampleData(result);
    }
    
    // Load saved reports
    const savedReports = localStorage.getItem('powerbi_reports');
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, []);

  const generateSampleData = (metadata) => {
    if (!metadata) return;
    
    const { column_names, inferred_column_types, number_of_rows } = metadata;
    const sampleSize = Math.min(100, number_of_rows || 50);
    const sample = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const row = {};
      column_names?.forEach(column => {
        const columnType = inferred_column_types?.[column];
        
        if (columnType === 'numeric') {
          if (column.toLowerCase().includes('sales') || column.toLowerCase().includes('revenue')) {
            row[column] = Math.floor(Math.random() * 100000) + 10000;
          } else if (column.toLowerCase().includes('age')) {
            row[column] = Math.floor(Math.random() * 60) + 18;
          } else if (column.toLowerCase().includes('score') || column.toLowerCase().includes('rating')) {
            row[column] = Math.floor(Math.random() * 100) + 1;
          } else {
            row[column] = Math.round(Math.random() * 1000) / 10;
          }
        } else {
          if (column.toLowerCase().includes('region') || column.toLowerCase().includes('location')) {
            const regions = ['North', 'South', 'East', 'West', 'Central'];
            row[column] = regions[Math.floor(Math.random() * regions.length)];
          } else if (column.toLowerCase().includes('category') || column.toLowerCase().includes('type')) {
            const categories = ['Premium', 'Standard', 'Basic', 'Enterprise'];
            row[column] = categories[Math.floor(Math.random() * categories.length)];
          } else if (column.toLowerCase().includes('status')) {
            const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
            row[column] = statuses[Math.floor(Math.random() * statuses.length)];
          } else if (column.toLowerCase().includes('date')) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            row[column] = months[Math.floor(Math.random() * months.length)] + ' 2024';
          } else {
            const values = ['Product A', 'Product B', 'Product C', 'Service X', 'Service Y'];
            row[column] = values[Math.floor(Math.random() * values.length)];
          }
        }
      });
      sample.push(row);
    }
    
    setDataPreview(sample);
  };

  const generateReport = async (reportType) => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newReport = {
      id: Date.now(),
      name: `${reportType} Report - ${new Date().toLocaleDateString()}`,
      type: reportType,
      created: new Date().toISOString(),
      charts: generateChartsForReport(reportType)
    };
    
    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    setActiveReport(newReport);
    localStorage.setItem('powerbi_reports', JSON.stringify(updatedReports));
    
    setIsGenerating(false);
  };

  const generateChartsForReport = (reportType) => {
    if (!dataPreview.length) return [];
    
    const charts = [];
    const columns = Object.keys(dataPreview[0]);
    const numericColumns = columns.filter(col => 
      typeof dataPreview[0][col] === 'number'
    );
    const categoricalColumns = columns.filter(col => 
      typeof dataPreview[0][col] === 'string'
    );

    switch (reportType) {
      case 'Executive Dashboard':
        if (numericColumns.length > 0 && categoricalColumns.length > 0) {
          charts.push(createBarChart(categoricalColumns[0], numericColumns[0], 'Revenue by Region'));
          charts.push(createPieChart(categoricalColumns[0], 'Market Share Distribution'));
          if (numericColumns.length > 1) {
            charts.push(createLineChart(categoricalColumns[0], numericColumns[1], 'Trend Analysis'));
          }
        }
        break;
      
      case 'Sales Report':
        if (numericColumns.length > 0 && categoricalColumns.length > 0) {
          charts.push(createBarChart(categoricalColumns[0], numericColumns[0], 'Sales Performance'));
          charts.push(createDoughnutChart(categoricalColumns[0], 'Sales Distribution'));
          if (categoricalColumns.length > 1) {
            charts.push(createBarChart(categoricalColumns[1], numericColumns[0], 'Sales by Category'));
          }
        }
        break;
      
      case 'Analytics Report':
        if (numericColumns.length >= 2) {
          charts.push(createLineChart(categoricalColumns[0] || 'Index', numericColumns[0], 'Performance Metrics'));
          charts.push(createBarChart(categoricalColumns[0] || 'Category', numericColumns[1], 'Comparative Analysis'));
        }
        break;
      
      default:
        if (numericColumns.length > 0 && categoricalColumns.length > 0) {
          charts.push(createBarChart(categoricalColumns[0], numericColumns[0], 'Data Overview'));
        }
    }
    
    return charts;
  };

  const createBarChart = (xColumn, yColumn, title) => {
    const aggregatedData = {};
    dataPreview.forEach(row => {
      const key = row[xColumn];
      if (!aggregatedData[key]) {
        aggregatedData[key] = 0;
      }
      aggregatedData[key] += row[yColumn] || 0;
    });

    const labels = Object.keys(aggregatedData);
    const data = Object.values(aggregatedData);

    return {
      id: Date.now() + Math.random(),
      type: 'bar',
      title,
      component: (
        <Bar
          data={{
            labels,
            datasets: [{
              label: yColumn,
              data,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: title },
              legend: { position: 'top' }
            }
          }}
        />
      )
    };
  };

  const createPieChart = (column, title) => {
    const counts = {};
    dataPreview.forEach(row => {
      const value = row[column];
      counts[value] = (counts[value] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return {
      id: Date.now() + Math.random(),
      type: 'pie',
      title,
      component: (
        <Pie
          data={{
            labels,
            datasets: [{
              data,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ]
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: title },
              legend: { position: 'right' }
            }
          }}
        />
      )
    };
  };

  const createLineChart = (xColumn, yColumn, title) => {
    const sortedData = dataPreview
      .map(row => ({ x: row[xColumn], y: row[yColumn] }))
      .filter(point => point.y !== undefined)
      .slice(0, 20);

    return {
      id: Date.now() + Math.random(),
      type: 'line',
      title,
      component: (
        <Line
          data={{
            labels: sortedData.map(d => d.x),
            datasets: [{
              label: yColumn,
              data: sortedData.map(d => d.y),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: title },
              legend: { position: 'top' }
            }
          }}
        />
      )
    };
  };

  const createDoughnutChart = (column, title) => {
    const counts = {};
    dataPreview.forEach(row => {
      const value = row[column];
      counts[value] = (counts[value] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return {
      id: Date.now() + Math.random(),
      type: 'doughnut',
      title,
      component: (
        <Doughnut
          data={{
            labels,
            datasets: [{
              data,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40'
              ]
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: title },
              legend: { position: 'bottom' }
            }
          }}
        />
      )
    };
  };

  const deleteReport = (reportId) => {
    const updatedReports = reports.filter(r => r.id !== reportId);
    setReports(updatedReports);
    localStorage.setItem('powerbi_reports', JSON.stringify(updatedReports));
    if (activeReport?.id === reportId) {
      setActiveReport(null);
    }
  };

  if (!uploadResult) {
    return (
      <div className="powerbi-page">
        <div className="page-header">
          <h1><BarChart3 size={32} />PowerBI Report Generator</h1>
          <p>Create professional business intelligence reports from your data</p>
        </div>
        
        <div className="empty-state">
          <BarChart3 size={64} color="#6B7280" />
          <h3>No Data Available</h3>
          <p>Upload a dataset to start creating PowerBI-style reports</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Upload Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="powerbi-page">
      <div className="page-header">
        <h1><BarChart3 size={32} />PowerBI Report Generator</h1>
        <p>Create professional business intelligence reports from your data</p>
      </div>

      <div className="powerbi-workspace">
        {/* Dataset Info Header */}
        <div className="dataset-info-header">
          <div className="dataset-summary">
            <h3>Dataset: {uploadResult?.filename || uploadResult?.name || 'Unknown'}</h3>
            <div className="dataset-stats">
              <span>{uploadResult?.rows?.toLocaleString() || uploadResult?.number_of_rows?.toLocaleString() || 'N/A'} records</span>
              <span>{uploadResult?.columns || uploadResult?.number_of_columns || uploadResult?.column_names?.length || 'N/A'} features</span>
              <span>{uploadResult?.document_type || uploadResult?.file_type || 'Unknown'}</span>
            </div>
          </div>
        </div>
        {/* Left Panel - Report Templates */}
        <div className="templates-panel">
          <div className="panel-header">
            <h3><Layout size={20} />Report Templates</h3>
          </div>
          
          <div className="template-list">
            {[
              { name: 'Executive Dashboard', icon: TrendingUp, description: 'High-level KPIs and metrics' },
              { name: 'Sales Report', icon: BarChart3, description: 'Sales performance analysis' },
              { name: 'Analytics Report', icon: PieChart, description: 'Detailed data analytics' },
              { name: 'Custom Report', icon: Grid, description: 'Build your own report' }
            ].map(template => (
              <div key={template.name} className="template-item">
                <div className="template-info">
                  <template.icon size={20} />
                  <div>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => generateReport(template.name)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <RefreshCw size={14} className="spinning" /> : <Plus size={14} />}
                  Generate
                </button>
              </div>
            ))}
          </div>

          <div className="saved-reports">
            <h4><Save size={16} />Saved Reports ({reports.length})</h4>
            {reports.map(report => (
              <div key={report.id} className="saved-report-item">
                <div className="report-info">
                  <span className="report-name">{report.name}</span>
                  <span className="report-date">{new Date(report.created).toLocaleDateString()}</span>
                </div>
                <div className="report-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => setActiveReport(report)}
                    title="View Report"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => deleteReport(report.id)}
                    title="Delete Report"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Report Viewer */}
        <div className="report-viewer">
          {activeReport ? (
            <>
              <div className="report-header">
                <div className="report-title">
                  <h2>{activeReport.name}</h2>
                  <span className="report-type">{activeReport.type}</span>
                </div>
                <div className="report-actions">
                  <button className="btn btn-secondary">
                    <Download size={16} />
                    Export PDF
                  </button>
                  <button className="btn btn-secondary">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>
              
              <div className="charts-grid">
                {activeReport.charts.map(chart => (
                  <div key={chart.id} className="chart-container">
                    <div className="chart-header">
                      <h4>{chart.title}</h4>
                      <div className="chart-actions">
                        <button className="btn-icon" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button className="btn-icon" title="Copy">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="chart-content">
                      {chart.component}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-report-selected">
              <BarChart3 size={64} color="#6B7280" />
              <h3>No Report Selected</h3>
              <p>Generate a new report or select an existing one to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedPowerBIPage;