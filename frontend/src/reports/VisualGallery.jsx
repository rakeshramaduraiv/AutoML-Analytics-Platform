import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, ScatterChart, Table, Activity, Search } from 'lucide-react';

const visualTypes = [
  { type: 'bar', icon: BarChart3, label: 'Bar Chart', description: 'Compare values across categories' },
  { type: 'line', icon: LineChart, label: 'Line Chart', description: 'Show trends over time' },
  { type: 'pie', icon: PieChart, label: 'Pie Chart', description: 'Show proportions' },
  { type: 'scatter', icon: ScatterChart, label: 'Scatter Plot', description: 'Show correlations' },
  { type: 'table', icon: Table, label: 'Table', description: 'Display raw data' },
  { type: 'kpi', icon: Activity, label: 'KPI Card', description: 'Show key metrics' }
];

const VisualGallery = ({ onAddVisual }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredType, setHoveredType] = useState(null);

  const filteredVisuals = visualTypes.filter(v => 
    v.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="visual-gallery" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="gallery-header">
        <h3>Visualizations</h3>
        <p>Click to add to canvas</p>
      </div>
      
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search visuals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px'
            }}
          />
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredVisuals.map(({ type, icon: Icon, label, description }) => (
          <div
            key={type}
            className="gallery-item"
            onClick={() => onAddVisual(type)}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
            style={{
              background: hoveredType === type ? '#EFF6FF' : 'white',
              transition: 'all 0.2s'
            }}
          >
            <Icon size={24} color={hoveredType === type ? '#3B82F6' : '#6B7280'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '13px', color: '#374151' }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{description}</div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default VisualGallery;
