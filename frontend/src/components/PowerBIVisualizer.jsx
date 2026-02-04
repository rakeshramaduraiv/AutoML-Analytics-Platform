import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Lightbulb } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Bar, Line, Scatter, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const PowerBIVisualizer = ({ datasetMetadata, datasetPreview }) => {
  const [selectedChart, setSelectedChart] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggregation, setAggregation] = useState('count');
  const [filterValue, setFilterValue] = useState('');
  const [chartTitle, setChartTitle] = useState('Custom Visualization');

  useEffect(() => {
    if (datasetMetadata?.column_names?.length > 0) {
      setXAxis(datasetMetadata.column_names[0]);
      if (datasetMetadata.column_names.length > 1) {
        setYAxis(datasetMetadata.column_names[1]);
      }
    }
  }, [datasetMetadata]);

  if (!datasetMetadata || !datasetPreview) {
    return <div>Loading visualizations...</div>;
  }

  const { column_names, inferred_column_types } = datasetMetadata;
  const numericColumns = column_names?.filter(col => inferred_column_types?.[col] === 'numeric') || [];
  const categoricalColumns = column_names?.filter(col => inferred_column_types?.[col] === 'categorical') || [];

  const generateVisualization = () => {
    if (!xAxis || !datasetPreview) return null;

    let filteredData = datasetPreview;
    if (filterValue) {
      filteredData = datasetPreview.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }

    const chartConfig = {
      responsive: true,
      plugins: {
        title: { display: true, text: chartTitle },
        legend: { position: 'top' }
      }
    };

    switch (selectedChart) {
      case 'bar':
        return generateBarChart(filteredData, chartConfig);
      case 'line':
        return generateLineChart(filteredData, chartConfig);
      case 'scatter':
        return generateScatterChart(filteredData, chartConfig);
      case 'pie':
        return generatePieChart(filteredData, chartConfig);
      case 'doughnut':
        return generateDoughnutChart(filteredData, chartConfig);
      default:
        return null;
    }
  };

  const generateBarChart = (data, config) => {
    if (categoricalColumns.includes(xAxis)) {
      const valueCounts = {};
      data.forEach(row => {
        const value = row[xAxis];
        if (value) {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(valueCounts).sort(([,a], [,b]) => b - a).slice(0, 10);
      
      return (
        <Bar
          data={{
            labels: sortedEntries.map(([label]) => label),
            datasets: [{
              label: aggregation === 'count' ? 'Count' : yAxis,
              data: sortedEntries.map(([, count]) => count),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          }}
          options={config}
        />
      );
    }
    return null;
  };

  const generateLineChart = (data, config) => {
    if (numericColumns.includes(xAxis) && numericColumns.includes(yAxis)) {
      const chartData = data
        .map(row => ({ x: parseFloat(row[xAxis]), y: parseFloat(row[yAxis]) }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y))
        .sort((a, b) => a.x - b.x);

      return (
        <Line
          data={{
            datasets: [{
              label: `${yAxis} vs ${xAxis}`,
              data: chartData,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            }]
          }}
          options={{
            ...config,
            scales: {
              x: { title: { display: true, text: xAxis } },
              y: { title: { display: true, text: yAxis } }
            }
          }}
        />
      );
    }
    return null;
  };

  const generateScatterChart = (data, config) => {
    if (numericColumns.includes(xAxis) && numericColumns.includes(yAxis)) {
      const scatterData = data
        .map(row => ({ x: parseFloat(row[xAxis]), y: parseFloat(row[yAxis]) }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y))
        .slice(0, 500);

      return (
        <Scatter
          data={{
            datasets: [{
              label: `${yAxis} vs ${xAxis}`,
              data: scatterData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)'
            }]
          }}
          options={{
            ...config,
            scales: {
              x: { title: { display: true, text: xAxis } },
              y: { title: { display: true, text: yAxis } }
            }
          }}
        />
      );
    }
    return null;
  };

  const generatePieChart = (data, config) => {
    if (categoricalColumns.includes(xAxis)) {
      const valueCounts = {};
      data.forEach(row => {
        const value = row[xAxis];
        if (value) {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(valueCounts).sort(([,a], [,b]) => b - a).slice(0, 8);
      
      return (
        <Pie
          data={{
            labels: sortedEntries.map(([label]) => label),
            datasets: [{
              data: sortedEntries.map(([, count]) => count),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ]
            }]
          }}
          options={config}
        />
      );
    }
    return null;
  };

  const generateDoughnutChart = (data, config) => {
    if (categoricalColumns.includes(xAxis)) {
      const valueCounts = {};
      data.forEach(row => {
        const value = row[xAxis];
        if (value) {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(valueCounts).sort(([,a], [,b]) => b - a).slice(0, 6);
      
      return (
        <Doughnut
          data={{
            labels: sortedEntries.map(([label]) => label),
            datasets: [{
              data: sortedEntries.map(([, count]) => count),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
              ]
            }]
          }}
          options={config}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2><BarChart3 size={24} /> PowerBI-Style Custom Visualizations</h2>
      
      {/* Visualization Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Chart Type:</label>
          <select 
            value={selectedChart} 
            onChange={(e) => setSelectedChart(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="bar"><BarChart3 size={16} /> Bar Chart</option>
            <option value="line"><TrendingUp size={16} /> Line Chart</option>
            <option value="scatter"><Activity size={16} /> Scatter Plot</option>
            <option value="pie"><Target size={16} /> Pie Chart</option>
            <option value="doughnut"><Target size={16} /> Doughnut Chart</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>X-Axis:</label>
          <select 
            value={xAxis} 
            onChange={(e) => setXAxis(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {column_names?.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Y-Axis:</label>
          <select 
            value={yAxis} 
            onChange={(e) => setYAxis(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">Select column...</option>
            {numericColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Aggregation:</label>
          <select 
            value={aggregation} 
            onChange={(e) => setAggregation(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter:</label>
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Filter data..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Chart Title:</label>
          <input
            type="text"
            value={chartTitle}
            onChange={(e) => setChartTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      {/* Visualization Display */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '10px', 
        border: '1px solid #ddd',
        minHeight: '400px'
      }}>
        {generateVisualization() || (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <h3><BarChart3 size={20} /> Select appropriate columns and chart type to generate visualization</h3>
            <p>Choose X-axis and Y-axis columns that match your selected chart type</p>
          </div>
        )}
      </div>

      {/* Chart Recommendations */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h4><Lightbulb size={16} /> Chart Recommendations:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Bar Chart:</strong> Best for categorical data comparison</li>
          <li><strong>Line Chart:</strong> Ideal for trends over time or continuous data</li>
          <li><strong>Scatter Plot:</strong> Perfect for correlation between two numeric variables</li>
          <li><strong>Pie/Doughnut:</strong> Great for showing proportions of categorical data</li>
        </ul>
      </div>
    </div>
  );
};

export default PowerBIVisualizer;