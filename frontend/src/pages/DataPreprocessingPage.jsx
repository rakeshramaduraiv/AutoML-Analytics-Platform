import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Play, Download, Trash2, Plus, Filter, RefreshCw, Eye, Settings, X } from 'lucide-react';

const DataPreprocessingPage = () => {
  const [originalData, setOriginalData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [steps, setSteps] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [activeTransform, setActiveTransform] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [fillValue, setFillValue] = useState('');
  const [dataTypes, setDataTypes] = useState({});

  const transformationTypes = [
    { id: 'remove_nulls', name: 'Remove Nulls', icon: <Trash2 size={16} />, color: '#EF4444' },
    { id: 'fill_nulls', name: 'Fill Nulls', icon: <Plus size={16} />, color: '#10B981' },
    { id: 'filter_rows', name: 'Filter Rows', icon: <Filter size={16} />, color: '#3B82F6' },
    { id: 'change_type', name: 'Change Type', icon: <RefreshCw size={16} />, color: '#8B5CF6' },
    { id: 'remove_duplicates', name: 'Remove Duplicates', icon: <Trash2 size={16} />, color: '#F59E0B' },
    { id: 'uppercase', name: 'Uppercase', icon: <Settings size={16} />, color: '#06B6D4' },
    { id: 'lowercase', name: 'Lowercase', icon: <Settings size={16} />, color: '#84CC16' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        if (parsedData.content_preview?.sample_data) {
          const data = parsedData.content_preview.sample_data;
          setOriginalData(data);
          setProcessedData(data);
          const cols = Object.keys(data[0] || {});
          setColumns(cols);
          
          // Auto-detect data types
          const types = {};
          cols.forEach(col => {
            const sample = data.find(row => row[col] != null)?.[col];
            if (typeof sample === 'number') types[col] = 'number';
            else if (sample && !isNaN(Date.parse(sample))) types[col] = 'date';
            else types[col] = 'text';
          });
          setDataTypes(types);
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
        loadSampleData();
      }
    } else {
      loadSampleData();
    }
  }, []);

  const loadSampleData = () => {
    const sampleData = [
      { Name: 'John Doe', Age: 30, City: 'New York', Salary: 75000, Department: 'Engineering' },
      { Name: 'Jane Smith', Age: 25, City: 'San Francisco', Salary: 85000, Department: 'Marketing' },
      { Name: 'Bob Johnson', Age: null, City: 'Chicago', Salary: 65000, Department: 'Sales' },
      { Name: 'Alice Brown', Age: 35, City: 'Boston', Salary: null, Department: 'Engineering' },
      { Name: 'Charlie Wilson', Age: 28, City: 'Seattle', Salary: 70000, Department: 'Marketing' },
      { Name: 'Diana Davis', Age: 32, City: 'Austin', Salary: 80000, Department: 'Engineering' },
      { Name: 'Eve Miller', Age: 29, City: 'Denver', Salary: 72000, Department: 'Sales' },
      { Name: 'Frank Garcia', Age: null, City: 'Miami', Salary: 68000, Department: 'Marketing' }
    ];
    
    setOriginalData(sampleData);
    setProcessedData(sampleData);
    setColumns(['Name', 'Age', 'City', 'Salary', 'Department']);
    setDataTypes({
      Name: 'text',
      Age: 'number',
      City: 'text',
      Salary: 'number',
      Department: 'text'
    });
  };

  const applyAllTransformations = useCallback(() => {
    let result = [...originalData];
    
    steps.forEach(step => {
      switch (step.type) {
        case 'remove_nulls':
          result = result.filter(row => 
            row[step.column] !== null && row[step.column] !== undefined && row[step.column] !== ''
          );
          break;
        case 'fill_nulls':
          result = result.map(row => ({
            ...row,
            [step.column]: row[step.column] || step.params.fillValue
          }));
          break;
        case 'filter_rows':
          result = result.filter(row => {
            const value = String(row[step.column]).toLowerCase();
            return value.includes(step.params.filterValue.toLowerCase());
          });
          break;
        case 'change_type':
          result = result.map(row => ({
            ...row,
            [step.column]: convertDataType(row[step.column], step.params.newType)
          }));
          break;
        case 'remove_duplicates':
          const seen = new Set();
          result = result.filter(row => {
            const key = row[step.column];
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          break;
        case 'uppercase':
          result = result.map(row => ({
            ...row,
            [step.column]: String(row[step.column]).toUpperCase()
          }));
          break;
        case 'lowercase':
          result = result.map(row => ({
            ...row,
            [step.column]: String(row[step.column]).toLowerCase()
          }));
          break;
        default:
          break;
      }
    });
    
    setProcessedData(result);
  }, [originalData, steps]);

  useEffect(() => {
    applyAllTransformations();
  }, [applyAllTransformations]);

  const convertDataType = (value, type) => {
    switch (type) {
      case 'number': return Number(value) || 0;
      case 'text': return String(value);
      case 'date': return new Date(value).toISOString().split('T')[0];
      default: return value;
    }
  };

  const addStep = (type, params = {}) => {
    if (!selectedColumn) return;
    
    const newStep = {
      id: Date.now(),
      type,
      column: selectedColumn,
      params,
      name: `${transformationTypes.find(t => t.id === type)?.name} on ${selectedColumn}`
    };
    setSteps([...steps, newStep]);
    setActiveTransform(null);
    setFilterValue('');
    setFillValue('');
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const getColumnStats = (column) => {
    const values = processedData.map(row => row[column]).filter(v => v != null);
    const nullCount = processedData.length - values.length;
    const uniqueCount = new Set(values).size;
    
    return {
      total: processedData.length,
      nulls: nullCount,
      unique: uniqueCount,
      type: dataTypes[column] || 'text'
    };
  };

  const TransformationPanel = () => (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '1px solid #E5E7EB'
    }}>
      <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
        <Settings size={20} /> Power Query Transformations
      </h3>
      
      {selectedColumn ? (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #0EA5E9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: '#0369A1' }}>Column: {selectedColumn}</h4>
            <button onClick={() => setSelectedColumn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} color="#6B7280" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.8rem', color: '#374151' }}>
            {(() => {
              const stats = getColumnStats(selectedColumn);
              return (
                <>
                  <div>Total: {stats.total}</div>
                  <div>Nulls: {stats.nulls}</div>
                  <div>Unique: {stats.unique}</div>
                  <div>Type: {stats.type}</div>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '2px dashed #D1D5DB' }}>
          Click a column header to select it for transformation
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        {transformationTypes.map(transform => (
          <button
            key={transform.id}
            onClick={() => setActiveTransform(transform.id)}
            disabled={!selectedColumn}
            style={{
              padding: '12px',
              border: `2px solid ${transform.color}20`,
              borderRadius: '8px',
              backgroundColor: activeTransform === transform.id ? `${transform.color}20` : 'white',
              cursor: selectedColumn ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: selectedColumn ? transform.color : '#9CA3AF',
              transition: 'all 0.2s ease'
            }}
          >
            {transform.icon} {transform.name}
          </button>
        ))}
      </div>
      
      {activeTransform && selectedColumn && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          {activeTransform === 'fill_nulls' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Fill value"
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
              <button
                onClick={() => addStep('fill_nulls', { fillValue })}
                style={{ padding: '8px 16px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          )}
          
          {activeTransform === 'filter_rows' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Filter value (contains)"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
              <button
                onClick={() => addStep('filter_rows', { filterValue })}
                style={{ padding: '8px 16px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          )}
          
          {activeTransform === 'change_type' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                onChange={(e) => addStep('change_type', { newType: e.target.value })}
                style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              >
                <option value="">Select type</option>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>
          )}
          
          {['remove_nulls', 'remove_duplicates', 'uppercase', 'lowercase'].includes(activeTransform) && (
            <button
              onClick={() => addStep(activeTransform)}
              style={{ padding: '8px 16px', backgroundColor: transformationTypes.find(t => t.id === activeTransform)?.color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Apply {transformationTypes.find(t => t.id === activeTransform)?.name}
            </button>
          )}
        </div>
      )}
    </div>
  );

  const StepsPanel = () => (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '1px solid #E5E7EB'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <Play size={20} /> Applied Steps ({steps.length})
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
          {originalData.length} → {processedData.length} rows
        </div>
      </div>
      
      {steps.length === 0 ? (
        <p style={{ color: '#6B7280', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No transformations applied</p>
      ) : (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {steps.map((step, index) => (
            <div key={step.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '6px',
              marginBottom: '6px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  backgroundColor: '#3B82F6', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold' 
                }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{step.name}</span>
              </div>
              <button
                onClick={() => removeStep(step.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const DataPreview = () => (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #E5E7EB'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <Eye size={20} /> Live Data Preview
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
            Showing {Math.min(processedData.length, 20)} of {processedData.length} rows
          </div>
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                [columns.join(','), ...processedData.map(row => columns.map(col => row[col]).join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'cleaned_data.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{
            padding: '8px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.9rem'
          }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto', maxHeight: '500px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {columns.map(column => {
                const stats = getColumnStats(column);
                return (
                  <th
                    key={column}
                    onClick={() => setSelectedColumn(column)}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      borderBottom: '2px solid #E5E7EB',
                      cursor: 'pointer',
                      backgroundColor: selectedColumn === column ? '#3B82F6' : '#F8FAFC',
                      color: selectedColumn === column ? 'white' : '#374151',
                      position: 'sticky',
                      top: 0,
                      minWidth: '120px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      {column} {selectedColumn === column && '✓'}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {stats.type} • {stats.nulls} nulls
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {processedData.slice(0, 20).map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                {columns.map(column => (
                  <td key={column} style={{ 
                    padding: '10px 8px', 
                    backgroundColor: selectedColumn === column ? '#EFF6FF' : 'white',
                    borderRight: '1px solid #F3F4F6'
                  }}>
                    {row[column] === null || row[column] === undefined || row[column] === '' ? 
                      <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.8rem' }}>null</span> : 
                      <span style={{ color: '#374151' }}>{String(row[column])}</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            <Settings size={32} /> Power Query Data Preprocessing
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Real-time data transformation with instant preview
          </p>
        </div>

        {originalData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            backgroundColor: 'white', 
            padding: '60px 40px', 
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <Upload size={64} color="#3B82F6" />
            <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>Loading Sample Data...</h2>
            <p style={{ color: '#6B7280', marginBottom: '30px' }}>
              Preparing demo dataset for Power Query transformations
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
            <div>
              <TransformationPanel />
              <StepsPanel />
            </div>
            <div>
              <DataPreview />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreprocessingPage;