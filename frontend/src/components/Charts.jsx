import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = ({ datasetMetadata, datasetPreview }) => {
  
  // Return loading state if no data
  if (!datasetMetadata || !datasetPreview) {
    return (
      <div className="charts-loading">
        <p>Loading visualizations...</p>
      </div>
    );
  }

  const { column_names, inferred_column_types } = datasetMetadata;
  
  // Generate charts based on column types
  const generateCharts = () => {
    const charts = [];
    
    // Get numeric and categorical columns
    const numericColumns = column_names?.filter(col => inferred_column_types?.[col] === 'numeric') || [];
    const categoricalColumns = column_names?.filter(col => inferred_column_types?.[col] === 'categorical') || [];
    
    // Generate histograms for numeric columns
    numericColumns.forEach(column => {
      const histogramChart = createHistogram(column, datasetPreview);
      if (histogramChart) {
        charts.push({
          id: `histogram-${column}`,
          title: `Distribution of ${column}`,
          chart: histogramChart,
          type: 'histogram'
        });
      }
    });
    
    // Generate bar charts for categorical columns
    categoricalColumns.forEach(column => {
      const barChart = createBarChart(column, datasetPreview);
      if (barChart) {
        charts.push({
          id: `bar-${column}`,
          title: `Value Counts: ${column}`,
          chart: barChart,
          type: 'bar'
        });
      }
    });
    
    // Generate scatter plot for first two numeric columns
    if (numericColumns.length >= 2) {
      const scatterChart = createScatterPlot(numericColumns[0], numericColumns[1], datasetPreview);
      if (scatterChart) {
        charts.push({
          id: `scatter-${numericColumns[0]}-${numericColumns[1]}`,
          title: `${numericColumns[0]} vs ${numericColumns[1]}`,
          chart: scatterChart,
          type: 'scatter'
        });
      }
    }
    
    return charts;
  };

  // Create histogram for numeric column
  const createHistogram = (column, data) => {
    try {
      const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      if (values.length === 0) return null;
      
      // Create bins for histogram
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
      const binWidth = (max - min) / binCount;
      
      const bins = Array(binCount).fill(0);
      const binLabels = [];
      
      for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binWidth;
        const binEnd = min + (i + 1) * binWidth;
        binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
      }
      
      values.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
        bins[binIndex]++;
      });
      
      return (
        <Bar
          data={{
            labels: binLabels,
            datasets: [{
              label: 'Frequency',
              data: bins,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Frequency' }
              },
              x: {
                title: { display: true, text: column }
              }
            }
          }}
        />
      );
    } catch (error) {
      console.error(`Error creating histogram for ${column}:`, error);
      return null;
    }
  };

  // Create bar chart for categorical column
  const createBarChart = (column, data) => {
    try {
      const valueCounts = {};
      data.forEach(row => {
        const value = row[column];
        if (value !== null && value !== undefined) {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });
      
      const sortedEntries = Object.entries(valueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15); // Limit to top 15 categories
      
      if (sortedEntries.length === 0) return null;
      
      return (
        <Bar
          data={{
            labels: sortedEntries.map(([label]) => label),
            datasets: [{
              label: 'Count',
              data: sortedEntries.map(([, count]) => count),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Count' }
              },
              x: {
                title: { display: true, text: column }
              }
            }
          }}
        />
      );
    } catch (error) {
      console.error(`Error creating bar chart for ${column}:`, error);
      return null;
    }
  };

  // Create scatter plot for two numeric columns
  const createScatterPlot = (xColumn, yColumn, data) => {
    try {
      const scatterData = data
        .map(row => ({
          x: parseFloat(row[xColumn]),
          y: parseFloat(row[yColumn])
        }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y))
        .slice(0, 500); // Limit points for performance
      
      if (scatterData.length === 0) return null;
      
      return (
        <Scatter
          data={{
            datasets: [{
              label: `${xColumn} vs ${yColumn}`,
              data: scatterData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              pointRadius: 3
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                title: { display: true, text: xColumn }
              },
              y: {
                title: { display: true, text: yColumn }
              }
            }
          }}
        />
      );
    } catch (error) {
      console.error(`Error creating scatter plot for ${xColumn} vs ${yColumn}:`, error);
      return null;
    }
  };

  const charts = generateCharts();

  return (
    <div className="charts-container">
      {charts.length === 0 ? (
        <div className="no-charts">
          <p>No visualizations could be generated from this dataset.</p>
        </div>
      ) : (
        <div className="charts-grid">
          {charts.map(({ id, title, chart }) => (
            <div key={id} className="chart-card">
              <h4 className="chart-title">{title}</h4>
              <div className="chart-wrapper">
                {chart}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Charts;