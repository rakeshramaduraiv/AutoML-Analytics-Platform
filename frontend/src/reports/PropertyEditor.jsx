import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Palette, Type, BarChart2, Eye, Grid3x3, Filter, X } from 'lucide-react';

const PropertyEditor = ({ visual, dataset, onUpdateDataConfig, onUpdateStyleConfig }) => {
  const [expandedSections, setExpandedSections] = useState({
    data: true,
    filters: false,
    format: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!visual) {
    return (
      <div className="property-editor">
        <div className="editor-empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Database size={48} color="#D1D5DB" />
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#9CA3AF' }}>Select a visual to edit properties</p>
        </div>
      </div>
    );
  }

  const columns = dataset && dataset.length > 0 ? Object.keys(dataset[0]) : [];
  const numericColumns = columns.filter(col => 
    dataset && dataset.length > 0 && typeof dataset[0][col] === 'number'
  );
  const categoricalColumns = columns.filter(col => 
    dataset && dataset.length > 0 && typeof dataset[0][col] !== 'number'
  );

  const addFilter = () => {
    const filters = visual.dataConfig.filters || [];
    onUpdateDataConfig({ 
      filters: [...filters, { field: '', operator: 'equals', value: '' }] 
    });
  };

  const updateFilter = (index, key, value) => {
    const filters = [...(visual.dataConfig.filters || [])];
    filters[index] = { ...filters[index], [key]: value };
    onUpdateDataConfig({ filters });
  };

  const removeFilter = (index) => {
    const filters = [...(visual.dataConfig.filters || [])];
    filters.splice(index, 1);
    onUpdateDataConfig({ filters });
  };

  return (
    <div className="property-editor">
      <div className="editor-header" style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BarChart2 size={18} color="#3B82F6" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Visualizations</h3>
        </div>
        <span className="visual-type-badge">{visual.type}</span>
      </div>

      {/* Data Section */}
      <div className="editor-section-collapsible">
        <div 
          className="section-header" 
          onClick={() => toggleSection('data')}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            background: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB',
            userSelect: 'none'
          }}
        >
          {expandedSections.data ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Database size={16} color="#6B7280" />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#374151' }}>Data</h4>
        </div>
        
        {expandedSections.data && (
          <div style={{ padding: '16px' }}>
            {visual.type !== 'kpi' && visual.type !== 'table' && (
              <>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Axis</label>
                  <select
                    value={visual.dataConfig.xAxis || ''}
                    onChange={(e) => onUpdateDataConfig({ xAxis: e.target.value })}
                  >
                    <option value="">Add field</option>
                    {categoricalColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legend</label>
                  <select
                    value={visual.dataConfig.category || ''}
                    onChange={(e) => onUpdateDataConfig({ category: e.target.value })}
                  >
                    <option value="">Add field</option>
                    {categoricalColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Values</label>
                  <select
                    value={visual.dataConfig.yAxis || ''}
                    onChange={(e) => onUpdateDataConfig({ yAxis: e.target.value })}
                  >
                    <option value="">Count occurrences</option>
                    {numericColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  {visual.dataConfig.yAxis && (
                    <select
                      value={visual.dataConfig.aggregation || 'sum'}
                      onChange={(e) => onUpdateDataConfig({ aggregation: e.target.value })}
                      style={{ marginTop: '8px' }}
                    >
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                    </select>
                  )}
                </div>
              </>
            )}

            {visual.type === 'kpi' && (
              <>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</label>
                  <select
                    value={visual.dataConfig.yAxis || ''}
                    onChange={(e) => onUpdateDataConfig({ yAxis: e.target.value })}
                  >
                    <option value="">Select field</option>
                    {numericColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aggregation</label>
                  <select
                    value={visual.dataConfig.aggregation || 'sum'}
                    onChange={(e) => onUpdateDataConfig({ aggregation: e.target.value })}
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                  </select>
                </div>
              </>
            )}

            {visual.type === 'table' && (
              <div className="form-group">
                <label style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Columns</label>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  All columns displayed
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="editor-section-collapsible">
        <div 
          className="section-header" 
          onClick={() => toggleSection('filters')}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            background: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB',
            userSelect: 'none'
          }}
        >
          {expandedSections.filters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Filter size={16} color="#6B7280" />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#374151' }}>Filters</h4>
        </div>
        
        {expandedSections.filters && (
          <div style={{ padding: '16px' }}>
            {(visual.dataConfig.filters || []).map((filter, idx) => (
              <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '6px', position: 'relative' }}>
                <button
                  onClick={() => removeFilter(idx)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    padding: '4px'
                  }}
                >
                  <X size={14} />
                </button>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(idx, 'field', e.target.value)}
                    style={{ fontSize: '12px' }}
                  >
                    <option value="">Select field</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                    style={{ fontSize: '12px' }}
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                    placeholder="Value"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addFilter}
              style={{
                width: '100%',
                padding: '8px',
                background: '#EFF6FF',
                border: '1px dashed #3B82F6',
                borderRadius: '6px',
                color: '#3B82F6',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              + Add Filter
            </button>
          </div>
        )}
      </div>

      {/* Format Section */}
      <div className="editor-section-collapsible">
        <div 
          className="section-header" 
          onClick={() => toggleSection('format')}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            background: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB',
            userSelect: 'none'
          }}
        >
          {expandedSections.format ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Palette size={16} color="#6B7280" />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#374151' }}>Format</h4>
        </div>
        
        {expandedSections.format && (
          <div style={{ padding: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={14} color="#6B7280" />
                Title
              </label>
              <input
                type="text"
                value={visual.styleConfig.title || ''}
                onChange={(e) => onUpdateStyleConfig({ title: e.target.value })}
                placeholder="Enter title"
              />
            </div>

            {visual.type !== 'table' && visual.type !== 'kpi' && (
              <>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Palette size={14} color="#6B7280" />
                    Color Scheme
                  </label>
                  <select
                    value={visual.styleConfig.colorScheme || 'default'}
                    onChange={(e) => onUpdateStyleConfig({ colorScheme: e.target.value })}
                  >
                    <option value="default">Default Blue</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="multi">Multi-color</option>
                  </select>
                </div>

                {visual.type === 'bar' && (
                  <div className="form-group">
                    <label>Orientation</label>
                    <select
                      value={visual.styleConfig.chartOrientation || 'vertical'}
                      onChange={(e) => onUpdateStyleConfig({ chartOrientation: e.target.value })}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Legend Position</label>
                  <select
                    value={visual.styleConfig.legendPosition || 'top'}
                    onChange={(e) => onUpdateStyleConfig({ legendPosition: e.target.value })}
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>X-Axis Label</label>
                  <input
                    type="text"
                    value={visual.styleConfig.xAxisLabel || ''}
                    onChange={(e) => onUpdateStyleConfig({ xAxisLabel: e.target.value })}
                    placeholder="X-Axis title"
                  />
                </div>

                <div className="form-group">
                  <label>Y-Axis Label</label>
                  <input
                    type="text"
                    value={visual.styleConfig.yAxisLabel || ''}
                    onChange={(e) => onUpdateStyleConfig({ yAxisLabel: e.target.value })}
                    placeholder="Y-Axis title"
                  />
                </div>

                <div className="form-group">
                  <label>Number Format</label>
                  <select
                    value={visual.styleConfig.numberFormat || 'number'}
                    onChange={(e) => onUpdateStyleConfig({ numberFormat: e.target.value })}
                  >
                    <option value="number">1,234</option>
                    <option value="decimal">1,234.56</option>
                    <option value="currency">$1,234.56</option>
                    <option value="percent">12.34%</option>
                    <option value="compact">1.2K</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Type size={14} color="#6B7280" />
                    Data Labels
                  </label>
                  <select
                    value={visual.styleConfig.dataLabels || 'none'}
                    onChange={(e) => onUpdateStyleConfig({ dataLabels: e.target.value })}
                  >
                    <option value="none">None</option>
                    <option value="value">Show Values</option>
                    <option value="percentage">Show Percentage</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={visual.styleConfig.showLegend !== false}
                      onChange={(e) => onUpdateStyleConfig({ showLegend: e.target.checked })}
                    />
                    <Eye size={14} color="#6B7280" />
                    Show Legend
                  </label>
                </div>

                {(visual.type === 'bar' || visual.type === 'line') && (
                  <div className="form-group checkbox-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={visual.styleConfig.showGridlines !== false}
                        onChange={(e) => onUpdateStyleConfig({ showGridlines: e.target.checked })}
                      />
                      <Grid3x3 size={14} color="#6B7280" />
                      Show Gridlines
                    </label>
                  </div>
                )}
              </>
            )}

            {visual.type === 'kpi' && (
              <>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Type size={14} color="#6B7280" />
                    Font Size
                  </label>
                  <select
                    value={visual.styleConfig.fontSize || 'large'}
                    onChange={(e) => onUpdateStyleConfig({ fontSize: e.target.value })}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Palette size={14} color="#6B7280" />
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={visual.styleConfig.color || '#3B82F6'}
                    onChange={(e) => onUpdateStyleConfig({ color: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyEditor;
