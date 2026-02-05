import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { X, BarChart3, PieChart, TrendingUp, Table, Target } from 'lucide-react';
import './PowerBIReportPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PowerBIReportPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [dataColumns, setDataColumns] = useState([]);
  const [reports, setReports] = useState([]);
  const [draggedField, setDraggedField] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'view'

  const sampleData = {
    sales: {
      columns: [
        { name: 'Month', type: 'date', IconComponent: BarChart3 },
        { name: 'Revenue', type: 'number', IconComponent: Target },
        { name: 'Units', type: 'number', IconComponent: Target },
        { name: 'Region', type: 'text', IconComponent: BarChart3 },
        { name: 'Product', type: 'text', IconComponent: BarChart3 },
        { name: 'Profit', type: 'number', IconComponent: Target },
        { name: 'Customer_Satisfaction', type: 'number', IconComponent: Target }
      ],
      data: [
        { Month: 'Jan', Revenue: 45000, Units: 120, Region: 'North', Product: 'A', Profit: 12000, Customer_Satisfaction: 4.2 },
        { Month: 'Feb', Revenue: 52000, Units: 140, Region: 'South', Product: 'B', Profit: 15000, Customer_Satisfaction: 4.5 },
        { Month: 'Mar', Revenue: 48000, Units: 130, Region: 'East', Product: 'A', Profit: 13000, Customer_Satisfaction: 4.1 },
        { Month: 'Apr', Revenue: 61000, Units: 165, Region: 'West', Product: 'C', Profit: 18000, Customer_Satisfaction: 4.7 },
        { Month: 'May', Revenue: 55000, Units: 150, Region: 'North', Product: 'B', Profit: 16000, Customer_Satisfaction: 4.3 },
        { Month: 'Jun', Revenue: 67000, Units: 180, Region: 'South', Product: 'A', Profit: 20000, Customer_Satisfaction: 4.6 }
      ]
    }
  };

  const visualizationTypes = [
    { type: 'bar', IconComponent: BarChart3, name: 'Column Chart' },
    { type: 'line', IconComponent: TrendingUp, name: 'Line Chart' },
    { type: 'pie', IconComponent: PieChart, name: 'Pie Chart' },
    { type: 'doughnut', IconComponent: PieChart, name: 'Donut Chart' },
    { type: 'table', IconComponent: Table, name: 'Table' },
    { type: 'card', IconComponent: Target, name: 'Card' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setSelectedDataset('uploaded');
      
      // Generate real data from uploaded file
      const realData = {
        columns: result.column_names?.map((name, idx) => ({
          name,
          type: result.inferred_column_types?.[name] === 'numeric' || result.data_types?.[name]?.includes('int') || result.data_types?.[name]?.includes('float') ? 'number' : 'text',
          IconComponent: result.inferred_column_types?.[name] === 'numeric' || result.data_types?.[name]?.includes('int') || result.data_types?.[name]?.includes('float') ? Target : BarChart3
        })) || sampleData.sales.columns,
        data: result.preview || sampleData.sales.data
      };
      
      setDataColumns(realData.columns);
      sampleData.uploaded = realData;
    } else {
      setDatasets(['sales', 'marketing', 'operations']);
      setSelectedDataset('sales');
      setDataColumns(sampleData.sales.columns);
    }
  }, []);

  const createNewReport = (type) => {
    const newReport = {
      id: Date.now(),
      type,
      title: `${visualizationTypes.find(v => v.type === type)?.name || type}`,
      xAxis: null,
      yAxis: null,
      colorScheme: 'default',
      showLegend: true,
      position: { x: Math.random() * 200, y: Math.random() * 100 },
      size: { width: 400, height: 300 }
    };
    setReports([...reports, newReport]);
    setSelectedReport(newReport.id);
  };

  const updateReport = (reportId, updates) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, ...updates } : report
    ));
  };

  const deleteReport = (reportId) => {
    setReports(reports.filter(report => report.id !== reportId));
    if (selectedReport === reportId) {
      setSelectedReport(null);
    }
  };

  const handleDrop = (e, reportId, dropZone) => {
    e.preventDefault();
    if (draggedField) {
      updateReport(reportId, { [dropZone]: draggedField });
      setDraggedField(null);
    }
  };

  const generateChartData = (report) => {
    if (!report.xAxis || !report.yAxis || !selectedDataset) return null;

    const data = sampleData[selectedDataset]?.data || [];
    if (!data.length) return null;
    
    const labels = data.map(item => item[report.xAxis] || 'N/A');
    const values = data.map(item => {
      const val = item[report.yAxis];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    const colorSchemes = {
      default: ['#0078D4', '#00BCF2', '#40E0D0', '#1BA1E2', '#0050EF'],
      vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      professional: ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#27AE60']
    };

    const colors = colorSchemes[report.colorScheme] || colorSchemes.default;

    return {
      labels,
      datasets: [{
        label: report.yAxis,
        data: values,
        backgroundColor: colors.map(color => color + '90'),
        borderColor: colors,
        borderWidth: 2
      }]
    };
  };

  const renderChart = (report) => {
    const chartData = generateChartData(report);
    if (!chartData) return (
      <div className="chart-placeholder">
        <BarChart3 size={48} color="#ccc" />
        <div>Drop fields to create visualization</div>
      </div>
    );

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: report.showLegend, position: 'top' }
      },
      scales: report.type === 'pie' || report.type === 'doughnut' ? undefined : {
        y: { beginAtZero: true },
        x: {}
      }
    };

    switch (report.type) {
      case 'bar': return <Bar data={chartData} options={options} />;
      case 'line': return <Line data={chartData} options={options} />;
      case 'pie': return <Pie data={chartData} options={options} />;
      case 'doughnut': return <Doughnut data={chartData} options={options} />;
      case 'table': return renderTable();
      case 'card': return renderCard(report);
      default: return <div>Chart type not supported</div>;
    }
  };

  const renderTable = () => {
    if (!selectedDataset) return null;
    const data = sampleData[selectedDataset].data;
    
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {dataColumns.map(col => (
                <th key={col.name}><col.IconComponent size={16} /> {col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, idx) => (
              <tr key={idx}>
                {dataColumns.map(col => (
                  <td key={col.name}>{row[col.name]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCard = (report) => {
    if (!report.yAxis || !selectedDataset) return null;
    const data = sampleData[selectedDataset]?.data || [];
    const values = data.map(item => {
      const val = item[report.yAxis];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = values.length ? (total / values.length) : 0;
    
    return (
      <div className="card-visualization">
        <div className="card-value">{total.toLocaleString()}</div>
        <div className="card-label">{report.yAxis}</div>
        <div className="card-meta">Avg: {avg.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div className="powerbi-container">
      <div className="powerbi-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Report Generator</h1>
          <div style={{
            padding: '4px 12px',
            backgroundColor: '#F3F4F6',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#6B7280'
          }}>Editing</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedDataset || ''} 
            onChange={(e) => {
              setSelectedDataset(e.target.value);
              setDataColumns(sampleData[e.target.value]?.columns || []);
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Select Dataset</option>
            {datasets.map(dataset => (
              <option key={dataset} value={dataset}>{dataset.toUpperCase()}</option>
            ))}
            {localStorage.getItem('uploadResult') && <option value="uploaded">UPLOADED DATA</option>}
          </select>
          <button style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'view' ? '#0078D4' : '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '600'
          }} onClick={() => setViewMode(viewMode === 'edit' ? 'view' : 'edit')}>
            {viewMode === 'edit' ? '👁 View Mode' : '✏️ Edit Mode'}
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '600'
          }} onClick={() => window.print()}>Export</button>
        </div>
      </div>

      <div className="powerbi-workspace">
        {viewMode === 'edit' && (
          <div className="fields-panel">
            <h3>Fields</h3>
            <div className="fields-list">
              {dataColumns.map(column => (
                <div
                  key={column.name}
                  className="field-item"
                  draggable
                  onDragStart={() => setDraggedField(column.name)}
                >
                  <column.IconComponent size={16} />
                  {column.name}
                </div>
              ))}
            </div>

            <h3>Visualizations</h3>
            <div className="viz-types">
              {visualizationTypes.map(viz => (
                <button 
                  key={viz.type}
                  onClick={() => createNewReport(viz.type)} 
                  className="viz-btn"
                >
                  <viz.IconComponent size={16} />
                  {viz.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="report-canvas" style={{ width: viewMode === 'view' ? '100%' : 'calc(100% - 280px - 280px)' }}>
          {reports.length === 0 ? (
            <div className="empty-canvas">
              <h2>{viewMode === 'edit' ? 'Start Building Your Report' : 'No Reports Created'}</h2>
              <p>{viewMode === 'edit' ? 'Select a visualization type from the left panel to begin' : 'Switch to Edit Mode to create reports'}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'view' ? 'repeat(auto-fit, minmax(500px, 1fr))' : '1fr',
              gap: '20px',
              padding: '20px'
            }}>
              {reports.map(report => (
                <div
                  key={report.id}
                  className={`report-widget ${selectedReport === report.id ? 'selected' : ''}`}
                  style={{
                    position: viewMode === 'view' ? 'relative' : 'absolute',
                    left: viewMode === 'view' ? 'auto' : report.position.x,
                    top: viewMode === 'view' ? 'auto' : report.position.y,
                    width: viewMode === 'view' ? '100%' : report.size.width,
                    height: viewMode === 'view' ? 'auto' : report.size.height,
                    minHeight: viewMode === 'view' ? '400px' : 'auto'
                  }}
                  onClick={() => viewMode === 'edit' && setSelectedReport(report.id)}
                >
                  <div className="widget-header">
                    <input
                      type="text"
                      value={report.title}
                      onChange={(e) => updateReport(report.id, { title: e.target.value })}
                      className="widget-title"
                      disabled={viewMode === 'view'}
                      style={{ cursor: viewMode === 'view' ? 'default' : 'text' }}
                    />
                    {viewMode === 'edit' && (
                      <button 
                        onClick={() => deleteReport(report.id)}
                        className="delete-btn"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {viewMode === 'edit' && (
                    <div className="drop-zones">
                      <div
                        className={`drop-zone ${report.xAxis ? 'filled' : ''}`}
                        onDrop={(e) => handleDrop(e, report.id, 'xAxis')}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        X-Axis: {report.xAxis || 'Drop field here'}
                      </div>
                      <div
                        className={`drop-zone ${report.yAxis ? 'filled' : ''}`}
                        onDrop={(e) => handleDrop(e, report.id, 'yAxis')}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        Y-Axis: {report.yAxis || 'Drop field here'}
                      </div>
                    </div>
                  )}

                  <div className="widget-chart" style={{ height: viewMode === 'view' ? '350px' : 'calc(100% - 120px)' }}>
                    {renderChart(report)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {viewMode === 'edit' && (
          <div className="properties-panel">
            <h3>Format</h3>
            {selectedReport ? (
              <div className="properties-content">
                <div className="property-group">
                  <label>Color Scheme</label>
                  <select
                    value={reports.find(r => r.id === selectedReport)?.colorScheme || 'default'}
                    onChange={(e) => updateReport(selectedReport, { colorScheme: e.target.value })}
                  >
                    <option value="default">Default</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
                <div className="property-group">
                  <label>Show Legend</label>
                  <input 
                    type="checkbox" 
                    checked={reports.find(r => r.id === selectedReport)?.showLegend !== false}
                    onChange={(e) => updateReport(selectedReport, { showLegend: e.target.checked })}
                  />
                </div>
              </div>
            ) : (
              <p>Select a visual to format</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PowerBIReportPage;