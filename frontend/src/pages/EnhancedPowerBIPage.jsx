import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Package, Globe, Tag, TrendingUp, Star, BarChart3, Target, FileText, FolderOpen, Trash2, ArrowLeftRight, ArrowUpDown, Search } from 'lucide-react';
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
import './EnhancedPowerBI.css';

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

const EnhancedPowerBIPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [dataColumns, setDataColumns] = useState([]);
  const [reports, setReports] = useState([]);
  const [draggedField, setDraggedField] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const sampleData = {
    sales: {
      columns: [
        { name: 'Month', type: 'date', icon: <Calendar size={16} />, category: 'dimension' },
        { name: 'Revenue', type: 'number', icon: <DollarSign size={16} />, category: 'measure' },
        { name: 'Units', type: 'number', icon: <Package size={16} />, category: 'measure' },
        { name: 'Region', type: 'text', icon: <Globe size={16} />, category: 'dimension' },
        { name: 'Product', type: 'text', icon: <Tag size={16} />, category: 'dimension' },
        { name: 'Profit', type: 'number', icon: <TrendingUp size={16} />, category: 'measure' },
        { name: 'Customer_Satisfaction', type: 'number', icon: <Star size={16} />, category: 'measure' }
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
    { type: 'bar', icon: <BarChart3 size={16} />, name: 'Column Chart' },
    { type: 'line', icon: <TrendingUp size={16} />, name: 'Line Chart' },
    { type: 'pie', icon: <Target size={16} />, name: 'Pie Chart' },
    { type: 'doughnut', icon: <Target size={16} />, name: 'Donut Chart' },
    { type: 'table', icon: <FileText size={16} />, name: 'Table' },
    { type: 'card', icon: <Target size={16} />, name: 'Card' }
  ];

  useEffect(() => {
    setDatasets(['sales', 'marketing', 'operations']);
    setSelectedDataset('sales');
    setDataColumns(sampleData.sales.columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewReport = (type) => {
    const newReport = {
      id: Date.now(),
      type,
      title: `${visualizationTypes.find(v => v.type === type)?.name || type}`,
      xAxis: null,
      yAxis: null,
      colorScheme: 'powerbi',
      showLegend: true,
      position: { x: Math.random() * 200, y: Math.random() * 100 },
      size: { width: 420, height: 320 }
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

    const data = sampleData[selectedDataset].data;
    const labels = data.map(item => item[report.xAxis]);
    const values = data.map(item => item[report.yAxis]);

    const colorSchemes = {
      powerbi: ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#FF8C00'],
      business: ['#107C10', '#FF8C00', '#D13438', '#B146C2', '#00188F', '#881798'],
      modern: ['#6264A7', '#4B4B4B', '#8764B8', '#881798', '#B83B5E', '#FF6B6B']
    };

    const colors = colorSchemes[report.colorScheme] || colorSchemes.powerbi;

    return {
      labels,
      datasets: [{
        label: report.yAxis,
        data: values,
        backgroundColor: colors.map(color => color + '90'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4
      }]
    };
  };

  const renderChart = (report) => {
    const chartData = generateChartData(report);
    if (!chartData) return (
      <div className="chart-placeholder">
        <div className="placeholder-icon"><BarChart3 size={32} /></div>
        <div className="placeholder-text">Drop fields here</div>
        <div className="placeholder-hint">Drag from Fields pane</div>
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
      default: return <div className="unsupported">Coming Soon</div>;
    }
  };

  const renderTable = () => {
    const data = sampleData[selectedDataset]?.data || [];
    return (
      <div className="table-viz">
        <table>
          <thead>
            <tr>{dataColumns.map(col => <th key={col.name}>{col.icon} {col.name}</th>)}</tr>
          </thead>
          <tbody>
            {data.slice(0, 4).map((row, idx) => (
              <tr key={idx}>
                {dataColumns.map(col => <td key={col.name}>{row[col.name]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCard = (report) => {
    if (!report.yAxis) return null;
    const data = sampleData[selectedDataset]?.data || [];
    const values = data.map(item => item[report.yAxis]);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="card-viz">
        <div className="card-value">{total.toLocaleString()}</div>
        <div className="card-label">{report.yAxis}</div>
      </div>
    );
  };

  return (
    <div className="enhanced-powerbi">
      <div className="pbi-header">
        <div className="header-left">
          <h1><BarChart3 size={24} /> Power BI</h1>
          <span className="breadcrumb">My workspace / Sales Report</span>
        </div>
        <div className="header-center">
          <select 
            value={selectedDataset || ''} 
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="dataset-select"
          >
            <option value="">Select Dataset</option>
            {datasets.map(dataset => (
              <option key={dataset} value={dataset}>
                {dataset.charAt(0).toUpperCase() + dataset.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => setShowFilters(!showFilters)}><Search size={16} /> Filters</button>
          <button className="header-btn"><FolderOpen size={16} /> Save</button>
          <button className="header-btn"><ArrowUpDown size={16} /> Export</button>
          <button className="header-btn"><ArrowLeftRight size={16} /> Refresh</button>
        </div>
      </div>

      <div className="pbi-workspace">
        <div className="fields-panel">
          <div className="panel-header">
            <div className="tab active"><FileText size={16} /> Fields</div>
            <div className="tab"><BarChart3 size={16} /> Visualizations</div>
          </div>
          
          <div className="fields-section">
            <div className="dataset-header">
              <span className="dataset-icon"><FolderOpen size={16} /></span>
              <span className="dataset-name">{selectedDataset?.toUpperCase() || 'DATASET'}</span>
              <button className="expand-btn">▼</button>
            </div>
            
            <div className="fields-list">
              {dataColumns.map(column => (
                <div
                  key={column.name}
                  className={`field-item ${column.category}`}
                  draggable
                  onDragStart={() => setDraggedField(column.name)}
                >
                  <span className="field-icon">{column.icon}</span>
                  <span className="field-name">{column.name}</span>
                  <span className="field-type">{column.category === 'measure' ? 'Σ' : 'Abc'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="viz-section">
            <h4><BarChart3 size={16} /> Visualizations</h4>
            <div className="viz-grid">
              {visualizationTypes.map(viz => (
                <div
                  key={viz.type}
                  className="viz-item"
                  onClick={() => createNewReport(viz.type)}
                  title={viz.name}
                >
                  <span className="viz-icon">{viz.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="report-canvas">
          {showFilters && (
            <div className="filters-bar">
              <div className="filter-chip"><Calendar size={16} /> Date: Last 6 months ×</div>
              <div className="filter-chip"><Globe size={16} /> Region: All ×</div>
              <button className="add-filter">+ Add filter</button>
            </div>
          )}
          
          {reports.length === 0 ? (
            <div className="empty-canvas">
              <div className="empty-icon"><BarChart3 size={48} /></div>
              <h2>Create your first visualization</h2>
              <p>Select a visualization from the panel to get started</p>
              <div className="quick-actions">
                <button onClick={() => createNewReport('bar')} className="quick-btn"><BarChart3 size={16} /> Bar Chart</button>
                <button onClick={() => createNewReport('line')} className="quick-btn"><TrendingUp size={16} /> Line Chart</button>
              </div>
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                className={`report-widget ${selectedReport === report.id ? 'selected' : ''}`}
                style={{
                  left: report.position.x,
                  top: report.position.y,
                  width: report.size.width,
                  height: report.size.height
                }}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="widget-header">
                  <div className="widget-title-area">
                    <span className="widget-icon">
                      {visualizationTypes.find(v => v.type === report.type)?.icon}
                    </span>
                    <input
                      type="text"
                      value={report.title}
                      onChange={(e) => updateReport(report.id, { title: e.target.value })}
                      className="widget-title"
                    />
                  </div>
                  <div className="widget-actions">
                    <button onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }} className="delete-btn"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="drop-zones">
                  <div
                    className={`drop-zone axis ${report.xAxis ? 'filled' : ''}`}
                    onDrop={(e) => handleDrop(e, report.id, 'xAxis')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <span className="zone-icon"><ArrowLeftRight size={16} /></span>
                    <div className="zone-content">
                      <span className="zone-label">Axis</span>
                      <span className="zone-value">{report.xAxis || 'Add field'}</span>
                    </div>
                  </div>
                  <div
                    className={`drop-zone values ${report.yAxis ? 'filled' : ''}`}
                    onDrop={(e) => handleDrop(e, report.id, 'yAxis')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <span className="zone-icon"><ArrowUpDown size={16} /></span>
                    <div className="zone-content">
                      <span className="zone-label">Values</span>
                      <span className="zone-value">{report.yAxis || 'Add field'}</span>
                    </div>
                  </div>
                </div>

                <div className="widget-chart">
                  {renderChart(report)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="properties-panel">
          <div className="panel-header">
            <div className="tab active"><Target size={16} /> Format</div>
            <div className="tab"><BarChart3 size={16} /> Analytics</div>
          </div>
          
          {selectedReport ? (
            <div className="properties-content">
              <div className="property-section">
                <div className="section-title"><BarChart3 size={16} /> Visual</div>
                <div className="property-item">
                  <label>Chart Type</label>
                  <select 
                    value={reports.find(r => r.id === selectedReport)?.type || ''}
                    onChange={(e) => updateReport(selectedReport, { type: e.target.value })}
                  >
                    {visualizationTypes.map(viz => (
                      <option key={viz.type} value={viz.type}>{viz.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="property-section">
                <div className="section-title"><Target size={16} /> Colors</div>
                <div className="property-item">
                  <label>Theme</label>
                  <select 
                    value={reports.find(r => r.id === selectedReport)?.colorScheme || 'powerbi'}
                    onChange={(e) => updateReport(selectedReport, { colorScheme: e.target.value })}
                  >
                    <option value="powerbi">Power BI</option>
                    <option value="business">Business</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
              </div>
              
              <div className="property-section">
                <div className="section-title"><BarChart3 size={16} /> Legend</div>
                <div className="property-item">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={reports.find(r => r.id === selectedReport)?.showLegend || false}
                      onChange={(e) => updateReport(selectedReport, { showLegend: e.target.checked })}
                    />
                    Show Legend
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon"><BarChart3 size={32} /></div>
              <p>Select a visualization to format</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPowerBIPage;