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

    const data = sampleData[selectedDataset].data;
    const labels = data.map(item => item[report.xAxis]);
    const values = data.map(item => item[report.yAxis]);

    const colorSchemes = {
      default: ['#0078D4', '#00BCF2', '#40E0D0', '#1BA1E2', '#0050EF']
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
    const data = sampleData[selectedDataset].data;
    const values = data.map(item => item[report.yAxis]);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="card-visualization">
        <div className="card-value">{total.toLocaleString()}</div>
        <div className="card-label">{report.yAxis}</div>
      </div>
    );
  };

  return (
    <div className="powerbi-container">
      <div className="powerbi-header">
        <h1>Report Generator</h1>
        <select 
          value={selectedDataset || ''} 
          onChange={(e) => setSelectedDataset(e.target.value)}
        >
          <option value="">Select Dataset</option>
          {datasets.map(dataset => (
            <option key={dataset} value={dataset}>{dataset.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="powerbi-workspace">
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

        <div className="report-canvas">
          {reports.length === 0 ? (
            <div className="empty-canvas">
              <h2>Start Building Your Report</h2>
              <p>Select a visualization type from the left panel to begin</p>
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
                  <input
                    type="text"
                    value={report.title}
                    onChange={(e) => updateReport(report.id, { title: e.target.value })}
                    className="widget-title"
                  />
                  <button 
                    onClick={() => deleteReport(report.id)}
                    className="delete-btn"
                  >
                    <X size={16} />
                  </button>
                </div>

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

                <div className="widget-chart">
                  {renderChart(report)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="properties-panel">
          <h3>Format</h3>
          {selectedReport ? (
            <div className="properties-content">
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
      </div>
    </div>
  );
};

export default PowerBIReportPage;