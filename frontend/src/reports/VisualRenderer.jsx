import React, { useMemo } from 'react';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const VisualRenderer = ({ visual, dataset }) => {
  const { type, dataConfig, styleConfig } = visual;

  // Color schemes
  const getColorScheme = (scheme) => {
    const schemes = {
      default: '#3B82F6',
      green: '#10B981',
      red: '#EF4444',
      purple: '#8B5CF6',
      orange: '#F59E0B',
      multi: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    };
    return schemes[scheme] || schemes.default;
  };

  // Number formatting
  const formatNumber = (value, format) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    
    switch (format) {
      case 'decimal':
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'currency':
        return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'percent':
        return (num).toFixed(2) + '%';
      case 'compact':
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
      default:
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
  };

  // Aggregate data with memoization
  const aggregateData = useMemo(() => {
    if (!dataset || !dataConfig.xAxis) return null;

    // Apply filters first
    let filteredData = dataset;
    if (dataConfig.filters && dataConfig.filters.length > 0) {
      filteredData = dataset.filter(row => {
        return dataConfig.filters.every(filter => {
          if (!filter.field || !filter.value) return true;
          const cellValue = String(row[filter.field] || '');
          const filterValue = String(filter.value);
          
          switch (filter.operator) {
            case 'equals':
              return cellValue === filterValue;
            case 'not_equals':
              return cellValue !== filterValue;
            case 'contains':
              return cellValue.toLowerCase().includes(filterValue.toLowerCase());
            case 'greater_than':
              return Number(cellValue) > Number(filterValue);
            case 'less_than':
              return Number(cellValue) < Number(filterValue);
            default:
              return true;
          }
        });
      });
    }

    // If no yAxis, count occurrences by xAxis (and optionally by category/legend)
    if (!dataConfig.yAxis) {
      if (dataConfig.category) {
        // Group by both xAxis and category
        const grouped = {};
        filteredData.forEach(row => {
          const xKey = String(row[dataConfig.xAxis] || 'Unknown');
          const catKey = String(row[dataConfig.category] || 'Unknown');
          if (!grouped[xKey]) grouped[xKey] = {};
          grouped[xKey][catKey] = (grouped[xKey][catKey] || 0) + 1;
        });
        return grouped;
      } else {
        // Simple count by xAxis
        const grouped = {};
        filteredData.forEach(row => {
          const key = String(row[dataConfig.xAxis] || 'Unknown');
          grouped[key] = (grouped[key] || 0) + 1;
        });
        return grouped;
      }
    }

    // Group by xAxis (and optionally category) and aggregate yAxis values
    if (dataConfig.category) {
      const grouped = {};
      filteredData.forEach(row => {
        const xKey = String(row[dataConfig.xAxis] || 'Unknown');
        const catKey = String(row[dataConfig.category] || 'Unknown');
        if (!grouped[xKey]) grouped[xKey] = {};
        if (!grouped[xKey][catKey]) grouped[xKey][catKey] = [];
        const value = Number(row[dataConfig.yAxis]) || 0;
        grouped[xKey][catKey].push(value);
      });

      const result = {};
      const aggType = dataConfig.aggregation || 'sum';
      
      Object.keys(grouped).forEach(xKey => {
        result[xKey] = {};
        Object.keys(grouped[xKey]).forEach(catKey => {
          const values = grouped[xKey][catKey];
          switch (aggType) {
            case 'sum':
              result[xKey][catKey] = values.reduce((a, b) => a + b, 0);
              break;
            case 'avg':
              result[xKey][catKey] = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case 'count':
              result[xKey][catKey] = values.length;
              break;
            case 'min':
              result[xKey][catKey] = Math.min(...values);
              break;
            case 'max':
              result[xKey][catKey] = Math.max(...values);
              break;
            default:
              result[xKey][catKey] = values.reduce((a, b) => a + b, 0);
          }
        });
      });
      return result;
    } else {
      // Simple grouping by xAxis only
      const grouped = {};
      filteredData.forEach(row => {
        const key = String(row[dataConfig.xAxis] || 'Unknown');
        if (!grouped[key]) grouped[key] = [];
        const value = Number(row[dataConfig.yAxis]) || 0;
        grouped[key].push(value);
      });

      const result = {};
      const aggType = dataConfig.aggregation || 'sum';
      
      Object.keys(grouped).forEach(key => {
        const values = grouped[key];
        switch (aggType) {
          case 'sum':
            result[key] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[key] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'count':
            result[key] = values.length;
            break;
          case 'min':
            result[key] = Math.min(...values);
            break;
          case 'max':
            result[key] = Math.max(...values);
            break;
          default:
            result[key] = values.reduce((a, b) => a + b, 0);
        }
      });
      return result;
    }
  }, [dataset, dataConfig.xAxis, dataConfig.yAxis, dataConfig.category, dataConfig.aggregation, dataConfig.filters]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!aggregateData) return null;

    const colors = getColorScheme(styleConfig.colorScheme || 'default');

    // Check if we have category grouping (nested object)
    const hasCategory = typeof Object.values(aggregateData)[0] === 'object' && !Array.isArray(Object.values(aggregateData)[0]);

    if (hasCategory) {
      // Multi-series data with legend
      const labels = Object.keys(aggregateData);
      const categories = [...new Set(Object.values(aggregateData).flatMap(obj => Object.keys(obj)))];
      
      const datasets = categories.map((cat, idx) => {
        const color = Array.isArray(colors) ? colors[idx % colors.length] : colors;
        return {
          label: cat,
          data: labels.map(label => aggregateData[label][cat] || 0),
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 2,
          fill: type === 'line'
        };
      });

      return { labels, datasets };
    } else {
      // Single series data
      const labels = Object.keys(aggregateData);
      const values = Object.values(aggregateData);

      return {
        labels,
        datasets: [{
          label: dataConfig.yAxis || 'Count',
          data: values,
          backgroundColor: Array.isArray(colors) 
            ? colors 
            : colors + '80',
          borderColor: Array.isArray(colors) 
            ? colors 
            : colors,
          borderWidth: 2,
          fill: type === 'line'
        }]
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregateData, dataConfig.yAxis, dataConfig.category, styleConfig.colorScheme, type]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 750 },
    indexAxis: (type === 'bar' && styleConfig.chartOrientation === 'horizontal') ? 'y' : 'x',
    plugins: {
      legend: { 
        display: styleConfig.showLegend !== false,
        position: styleConfig.legendPosition || 'top',
        labels: { font: { size: 11 }, padding: 10 }
      },
      title: { 
        display: !!styleConfig.title, 
        text: styleConfig.title,
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 10 }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${formatNumber(value, styleConfig.numberFormat || 'number')}`;
          }
        }
      }
    },
    scales: (type === 'bar' || type === 'line') ? {
      x: { 
        grid: { display: styleConfig.showGridlines !== false, color: '#F3F4F6' },
        ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 0 },
        title: {
          display: !!styleConfig.xAxisLabel,
          text: styleConfig.xAxisLabel,
          font: { size: 12, weight: 'bold' }
        }
      },
      y: { 
        grid: { display: styleConfig.showGridlines !== false, color: '#F3F4F6' },
        ticks: { 
          font: { size: 11 },
          callback: (value) => formatNumber(value, styleConfig.numberFormat || 'number')
        },
        beginAtZero: true,
        title: {
          display: !!styleConfig.yAxisLabel,
          text: styleConfig.yAxisLabel,
          font: { size: 12, weight: 'bold' }
        }
      }
    } : undefined
  }), [type, styleConfig.showLegend, styleConfig.title, styleConfig.showGridlines, styleConfig.legendPosition, styleConfig.chartOrientation, styleConfig.xAxisLabel, styleConfig.yAxisLabel, styleConfig.numberFormat]);

  // Calculate KPI with trend
  const kpiData = useMemo(() => {
    if (!dataset || !dataConfig.yAxis) return null;

    const aggType = dataConfig.aggregation || 'sum';
    const values = dataset.map(row => Number(row[dataConfig.yAxis]) || 0);
    
    let current = 0;
    switch (aggType) {
      case 'sum':
        current = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        current = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        current = values.length;
        break;
      case 'min':
        current = Math.min(...values);
        break;
      case 'max':
        current = Math.max(...values);
        break;
      default:
        current = values.reduce((a, b) => a + b, 0);
    }

    // Calculate trend (compare first half vs second half)
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'neutral';
    const trendPercent = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0;

    return { current, trend, trendPercent, aggType };
  }, [dataset, dataConfig.yAxis, dataConfig.aggregation]);

  if (!chartData && type !== 'table' && type !== 'kpi') {
    return (
      <div className="visual-placeholder">
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          {!dataConfig.xAxis 
            ? 'Select an Axis field from properties →' 
            : 'Chart ready'}
        </p>
      </div>
    );
  }

  switch (type) {
    case 'bar':
      return <Bar data={chartData} options={chartOptions} />;
    case 'line':
      return <Line data={chartData} options={chartOptions} />;
    case 'pie':
      return <Pie data={chartData} options={chartOptions} />;
    case 'scatter':
      return <Scatter data={chartData} options={chartOptions} />;
    case 'table':
      if (!dataset || dataset.length === 0) {
        return (
          <div className="visual-placeholder">
            <p>No data available</p>
          </div>
        );
      }
      return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                {Object.keys(dataset[0] || {}).map(col => (
                  <th key={col} style={{ 
                    padding: '6px 8px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #E5E7EB',
                    background: '#F9FAFB',
                    fontWeight: 600,
                    position: 'sticky',
                    top: 0,
                    whiteSpace: 'nowrap',
                    fontSize: '11px'
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.slice(0, 100).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{ padding: '6px 8px', color: '#374151', whiteSpace: 'nowrap', fontSize: '11px' }}>
                      {typeof val === 'number' ? val.toLocaleString() : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'kpi':
      if (!kpiData) {
        return (
          <div className="visual-placeholder">
            <p>Configure value field</p>
          </div>
        );
      }

      const fontSize = {
        small: '28px',
        medium: '40px',
        large: '52px',
        xlarge: '68px'
      }[styleConfig.fontSize || 'large'];

      const TrendIcon = kpiData.trend === 'up' ? TrendingUp : kpiData.trend === 'down' ? TrendingDown : Minus;
      const trendColor = kpiData.trend === 'up' ? '#10B981' : kpiData.trend === 'down' ? '#EF4444' : '#6B7280';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {styleConfig.title || dataConfig.yAxis}
          </div>
          <div style={{ 
            fontSize, 
            fontWeight: 'bold', 
            color: styleConfig.color || '#3B82F6',
            marginBottom: '12px'
          }}>
            {kpiData.current.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
            <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{kpiData.aggType}</span>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trendColor, fontWeight: 500 }}>
              <TrendIcon size={14} />
              {Math.abs(kpiData.trendPercent).toFixed(1)}%
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '8px' }}>
            {dataset.length} records
          </div>
        </div>
      );
    default:
      return <div>Unknown visual type</div>;
  }
};

export default VisualRenderer;
