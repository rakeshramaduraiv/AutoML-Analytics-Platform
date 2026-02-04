import React, { useState } from 'react';
import { BarChart3, TrendingUp, Target, Zap, Activity, Settings, Download, Palette } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale } from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale);

const PowerBIVisualization = ({ data, title = "Interactive Dashboard" }) => {
  const [selectedChart, setSelectedChart] = useState('line');
  const [customColors, setCustomColors] = useState(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);
  const [showCustomization, setShowCustomization] = useState(false);
  const [chartConfig, setChartConfig] = useState({
    showGrid: true,
    showLegend: true,
    showTooltips: true,
    animation: true,
    responsive: true
  });

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: <TrendingUp size={16} />, component: Line },
    { id: 'bar', name: 'Bar Chart', icon: <BarChart3 size={16} />, component: Bar },
    { id: 'doughnut', name: 'Doughnut', icon: <Target size={16} />, component: Doughnut },
    { id: 'radar', name: 'Radar Chart', icon: <Target size={16} />, component: Radar },
    { id: 'scatter', name: 'Scatter Plot', icon: <Zap size={16} />, component: Scatter }
  ];

  const generateChartData = () => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const datasets = [
      {
        label: 'Revenue ($M)',
        data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
        borderColor: customColors[0],
        backgroundColor: customColors[0] + '20',
        tension: 0.4,
        fill: selectedChart === 'line'
      },
      {
        label: 'Profit ($M)',
        data: [8, 12, 10, 18, 15, 22, 20, 25, 23, 28, 26, 32],
        borderColor: customColors[1],
        backgroundColor: customColors[1] + '20',
        tension: 0.4,
        fill: selectedChart === 'line'
      },
      {
        label: 'Expenses ($M)',
        data: [4, 7, 5, 7, 7, 8, 8, 10, 9, 12, 12, 13],
        borderColor: customColors[2],
        backgroundColor: customColors[2] + '20',
        tension: 0.4,
        fill: selectedChart === 'line'
      }
    ];

    if (selectedChart === 'doughnut') {
      return {
        labels: ['Revenue', 'Profit', 'Expenses'],
        datasets: [{
          data: [45, 32, 13],
          backgroundColor: customColors.slice(0, 3),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }

    if (selectedChart === 'radar') {
      return {
        labels: ['Performance', 'Quality', 'Speed', 'Reliability', 'Innovation', 'Cost'],
        datasets: [{
          label: 'Current Quarter',
          data: [85, 92, 78, 88, 75, 82],
          borderColor: customColors[0],
          backgroundColor: customColors[0] + '20',
          pointBackgroundColor: customColors[0]
        }]
      };
    }

    if (selectedChart === 'scatter') {
      return {
        datasets: [{
          label: 'Performance vs Cost',
          data: Array.from({length: 20}, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100
          })),
          backgroundColor: customColors[0] + '60',
          borderColor: customColors[0]
        }]
      };
    }

    return { labels, datasets };
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: chartConfig.responsive,
      maintainAspectRatio: false,
      animation: chartConfig.animation ? {
        duration: 1000,
        easing: 'easeInOutQuart'
      } : false,
      plugins: {
        legend: {
          display: chartConfig.showLegend,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          enabled: chartConfig.showTooltips,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#3B82F6',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true
        }
      }
    };

    if (selectedChart === 'line' || selectedChart === 'bar') {
      baseOptions.scales = {
        x: {
          grid: { display: chartConfig.showGrid, color: '#E5E7EB' },
          ticks: { font: { size: 11 } }
        },
        y: {
          grid: { display: chartConfig.showGrid, color: '#E5E7EB' },
          ticks: { font: { size: 11 } }
        }
      };
    }

    if (selectedChart === 'radar') {
      baseOptions.scales = {
        r: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#E5E7EB' },
          pointLabels: { font: { size: 12 } }
        }
      };
    }

    return baseOptions;
  };

  const exportChart = (format) => {
    alert(`Exporting chart as ${format.toUpperCase()}...\n\nFeatures:\n• High-resolution export\n• Custom branding\n• Multiple formats\n• Batch export\n• Scheduled reports`);
  };

  const ChartComponent = chartTypes.find(type => type.id === selectedChart)?.component || Line;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      margin: '20px 0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1F2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <BarChart3 size={20} /> {title}
          <div style={{
            padding: '4px 12px',
            backgroundColor: '#10B981',
            color: 'white',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}>
            LIVE
          </div>
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            style={{
              padding: '8px 16px',
              backgroundColor: showCustomization ? '#3B82F6' : '#F3F4F6',
              color: showCustomization ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Settings size={16} /> Customize
          </button>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => document.getElementById('export-menu').style.display = 
                document.getElementById('export-menu').style.display === 'block' ? 'none' : 'block'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Download size={16} /> Export
            </button>
            <div
              id="export-menu"
              style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                marginTop: '5px'
              }}
            >
              {['PNG', 'PDF', 'Excel', 'PowerBI'].map(format => (
                <button
                  key={format}
                  onClick={() => {
                    exportChart(format);
                    document.getElementById('export-menu').style.display = 'none';
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        flexWrap: 'wrap'
      }}>
        {chartTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedChart(type.id)}
            style={{
              padding: '10px 16px',
              backgroundColor: selectedChart === type.id ? '#3B82F6' : '#F9FAFB',
              color: selectedChart === type.id ? 'white' : '#374151',
              border: selectedChart === type.id ? 'none' : '1px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (selectedChart !== type.id) {
                e.target.style.backgroundColor = '#F3F4F6';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChart !== type.id) {
                e.target.style.backgroundColor = '#F9FAFB';
              }
            }}
          >
            {type.icon} {type.name}
          </button>
        ))}
      </div>

      {/* Customization Panel */}
      {showCustomization && (
        <div style={{
          backgroundColor: '#F9FAFB',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          border: '1px solid #E5E7EB'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '1rem' }}>
            <Palette size={16} /> Chart Customization
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Color Palette */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Color Palette
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {customColors.map((color, idx) => (
                  <input
                    key={idx}
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...customColors];
                      newColors[idx] = e.target.value;
                      setCustomColors(newColors);
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Chart Options */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Display Options
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(chartConfig).map(([key, value]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Quick Presets
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Corporate', colors: ['#1F2937', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
                  { name: 'Vibrant', colors: ['#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'] },
                  { name: 'Minimal', colors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'] }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setCustomColors(preset.colors)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div style={{
        height: '400px',
        position: 'relative',
        backgroundColor: '#FAFAFA',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <ChartComponent
          data={generateChartData()}
          options={getChartOptions()}
        />
      </div>

      {/* Chart Insights */}
      <div style={{
        marginTop: '25px',
        padding: '20px',
        backgroundColor: '#F0F9FF',
        borderRadius: '12px',
        border: '1px solid #BAE6FD'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0369A1', fontSize: '1rem' }}>
          <Activity size={16} /> AI Insights
        </h4>
        <div style={{ fontSize: '0.9rem', color: '#0F172A', lineHeight: '1.5' }}>
          • Revenue shows strong upward trend with 275% growth year-over-year<br/>
          • Profit margins improved by 18% in Q4 indicating operational efficiency<br/>
          • Seasonal patterns suggest peak performance in Q4 (Oct-Dec)<br/>
          • Recommended action: Increase marketing spend in Q3 to maximize Q4 returns
        </div>
      </div>
    </div>
  );
};

export default PowerBIVisualization;