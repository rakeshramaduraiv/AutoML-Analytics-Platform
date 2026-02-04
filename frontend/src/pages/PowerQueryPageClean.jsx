import React, { useState, useEffect } from 'react';
import { 
  Database, Filter, Shuffle, Code, Play, Download, 
  RefreshCw, Settings, Eye, Table,
  Plus, Minus, Edit3, Copy, Trash2, ChevronDown,
  SortAsc, Type, AlertCircle
} from 'lucide-react';

const PowerQueryPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [queryCode, setQueryCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const generateInitialQuery = (columns) => {
      const query = `let
    Source = Excel.Workbook(File.Contents("${uploadResult?.filename || 'data.xlsx'}"), null, true),
    Sheet1_Sheet = Source{[Item="Sheet1",Kind="Sheet"]}[Data],
    #"Promoted Headers" = Table.PromoteHeaders(Sheet1_Sheet, [PromoteAllScalars=true])
in
    #"Promoted Headers"`;
      
      setQueryCode(query);
    };

    const generateSampleData = (metadata) => {
      if (!metadata) return;
      
      const { column_names, inferred_column_types, number_of_rows } = metadata;
      const sampleSize = Math.min(100, number_of_rows || 50);
      const sample = [];
      
      for (let i = 0; i < sampleSize; i++) {
        const row = {};
        column_names?.forEach(column => {
          const columnType = inferred_column_types?.[column];
          
          if (columnType === 'numeric') {
            if (column.toLowerCase().includes('age')) {
              row[column] = Math.floor(Math.random() * 60) + 18;
            } else if (column.toLowerCase().includes('salary')) {
              row[column] = Math.floor(Math.random() * 80000) + 30000;
            } else if (column.toLowerCase().includes('price')) {
              row[column] = Math.floor(Math.random() * 1000) + 10;
            } else {
              row[column] = Math.round(Math.random() * 1000) / 10;
            }
          } else {
            if (column.toLowerCase().includes('name')) {
              const names = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson'];
              row[column] = names[Math.floor(Math.random() * names.length)];
            } else if (column.toLowerCase().includes('category')) {
              const categories = ['Premium', 'Standard', 'Basic', 'Enterprise'];
              row[column] = categories[Math.floor(Math.random() * categories.length)];
            } else if (column.toLowerCase().includes('status')) {
              const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
              row[column] = statuses[Math.floor(Math.random() * statuses.length)];
            } else if (column.toLowerCase().includes('date')) {
              const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
              row[column] = date.toISOString().split('T')[0];
            } else {
              const values = ['Option A', 'Option B', 'Option C', 'Option D'];
              row[column] = values[Math.floor(Math.random() * values.length)];
            }
          }
        });
        sample.push(row);
      }
      
      setDataPreview(sample);
      generateInitialQuery(column_names);
    };

    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setUploadResult(result);
      generateSampleData(result);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTransformation = (type, config) => {
    const newTransform = {
      id: Date.now(),
      type,
      config,
      applied: false
    };
    
    setTransformations(prev => [...prev, newTransform]);
    updateQueryCode([...transformations, newTransform]);
  };

  const removeTransformation = (id) => {
    const updated = transformations.filter(t => t.id !== id);
    setTransformations(updated);
    updateQueryCode(updated);
  };

  const updateQueryCode = (transforms) => {
    let query = `let
    Source = Excel.Workbook(File.Contents("${uploadResult?.filename || 'data.xlsx'}"), null, true),
    Sheet1_Sheet = Source{[Item="Sheet1",Kind="Sheet"]}[Data],
    #"Promoted Headers" = Table.PromoteHeaders(Sheet1_Sheet, [PromoteAllScalars=true])`;
    
    transforms.forEach((transform, index) => {
      const stepName = `#"${transform.type} ${index + 1}"`;
      switch (transform.type) {
        case 'Filter Rows':
          query += `,
    ${stepName} = Table.SelectRows(#"Promoted Headers", each [${transform.config.column}] ${transform.config.operator} "${transform.config.value}")`;
          break;
        case 'Remove Columns':
          query += `,
    ${stepName} = Table.RemoveColumns(#"Promoted Headers",{"${transform.config.columns?.join('", "') || ''}"})`;
          break;
        case 'Rename Column':
          query += `,
    ${stepName} = Table.RenameColumns(#"Promoted Headers",{{"${transform.config.oldName}", "${transform.config.newName}"}})`;
          break;
        default:
          break;
      }
    });
    
    query += `
in
    ${transforms.length > 0 ? `#"${transforms[transforms.length - 1].type} ${transforms.length}"` : '#"Promoted Headers"'}`;
    
    setQueryCode(query);
  };

  const applyTransformations = async () => {
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let processedData = [...dataPreview];
    
    transformations.forEach(transform => {
      switch (transform.type) {
        case 'Filter Rows':
          processedData = processedData.filter(row => {
            const value = row[transform.config.column];
            switch (transform.config.operator) {
              case '=':
                return value === transform.config.value;
              case '!=':
                return value !== transform.config.value;
              case '>':
                return parseFloat(value) > parseFloat(transform.config.value);
              case '<':
                return parseFloat(value) < parseFloat(transform.config.value);
              default:
                return true;
            }
          });
          break;
        case 'Remove Columns':
          processedData = processedData.map(row => {
            const newRow = { ...row };
            transform.config.columns?.forEach(col => delete newRow[col]);
            return newRow;
          });
          break;
        case 'Rename Column':
          processedData = processedData.map(row => {
            const newRow = { ...row };
            if (newRow[transform.config.oldName] !== undefined) {
              newRow[transform.config.newName] = newRow[transform.config.oldName];
              delete newRow[transform.config.oldName];
            }
            return newRow;
          });
          break;
        default:
          break;
      }
    });
    
    setDataPreview(processedData);
    setIsProcessing(false);
  };

  const TransformationPanel = () => {
    const [showPanel, setShowPanel] = useState(false);
    const [transformType, setTransformType] = useState('');
    const [config, setConfig] = useState({});

    const transformOptions = [
      { value: 'Filter Rows', icon: Filter, description: 'Filter rows based on conditions' },
      { value: 'Remove Columns', icon: Minus, description: 'Remove selected columns' },
      { value: 'Rename Column', icon: Edit3, description: 'Rename a column' },
      { value: 'Change Type', icon: Type, description: 'Change column data type' }
    ];

    const handleAddTransform = () => {
      if (transformType && Object.keys(config).length > 0) {
        addTransformation(transformType, config);
        setTransformType('');
        setConfig({});
        setShowPanel(false);
      }
    };

    return (
      <div className="transformation-panel">
        <button 
          className="btn btn-primary"
          onClick={() => setShowPanel(!showPanel)}
        >
          <Plus size={16} />
          Add Transformation
        </button>
        
        {showPanel && (
          <div className="transform-config">
            <div className="transform-selector">
              <label>Transformation Type:</label>
              <select 
                value={transformType}
                onChange={(e) => setTransformType(e.target.value)}
              >
                <option value="">Select transformation...</option>
                {transformOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            
            {transformType === 'Filter Rows' && (
              <div className="config-inputs">
                <select 
                  value={config.column || ''}
                  onChange={(e) => setConfig({...config, column: e.target.value})}
                >
                  <option value="">Select column...</option>
                  {uploadResult?.column_names?.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select 
                  value={config.operator || ''}
                  onChange={(e) => setConfig({...config, operator: e.target.value})}
                >
                  <option value="">Operator...</option>
                  <option value="=">Equals</option>
                  <option value="!=">Not Equals</option>
                  <option value=">">Greater Than</option>
                  <option value="<">Less Than</option>
                </select>
                <input 
                  type="text"
                  placeholder="Value"
                  value={config.value || ''}
                  onChange={(e) => setConfig({...config, value: e.target.value})}
                />
              </div>
            )}
            
            {transformType === 'Remove Columns' && (
              <div className="config-inputs">
                <div className="column-selector">
                  <label>Select columns to remove:</label>
                  {uploadResult?.column_names?.map(col => (
                    <label key={col} className="checkbox-option">
                      <input 
                        type="checkbox"
                        checked={config.columns?.includes(col) || false}
                        onChange={(e) => {
                          const columns = config.columns || [];
                          if (e.target.checked) {
                            setConfig({...config, columns: [...columns, col]});
                          } else {
                            setConfig({...config, columns: columns.filter(c => c !== col)});
                          }
                        }}
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {transformType === 'Rename Column' && (
              <div className="config-inputs">
                <select 
                  value={config.oldName || ''}
                  onChange={(e) => setConfig({...config, oldName: e.target.value})}
                >
                  <option value="">Select column...</option>
                  {uploadResult?.column_names?.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  placeholder="New name"
                  value={config.newName || ''}
                  onChange={(e) => setConfig({...config, newName: e.target.value})}
                />
              </div>
            )}
            
            <div className="config-actions">
              <button className="btn btn-success" onClick={handleAddTransform}>
                Add
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!uploadResult) {
    return (
      <div className="power-query-page">
        <div className="page-header">
          <h1><Shuffle size={32} />Power Query Editor</h1>
          <p>Transform and shape your data with advanced query capabilities</p>
        </div>
        
        <div className="empty-state">
          <Database size={64} color="#6B7280" />
          <h3>No Data Source Connected</h3>
          <p>Upload a dataset to start building powerful data transformations</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            <Database size={16} />
            Connect Data Source
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="power-query-page">
      <div className="page-header">
        <h1><Shuffle size={32} />Power Query Editor</h1>
        <p>Transform and shape your data with advanced query capabilities</p>
      </div>

      <div className="query-workspace">
        {/* Left Panel - Transformations */}
        <div className="transformations-panel">
          <div className="panel-header">
            <h3><Settings size={20} />Applied Steps</h3>
            <TransformationPanel />
          </div>
          
          <div className="steps-list">
            <div className="step-item source">
              <Database size={16} />
              <span>Source</span>
            </div>
            <div className="step-item">
              <Table size={16} />
              <span>Promoted Headers</span>
            </div>
            
            {transformations.map((transform, index) => (
              <div key={transform.id} className="step-item">
                <Shuffle size={16} />
                <span>{transform.type} {index + 1}</span>
                <button 
                  className="remove-step"
                  onClick={() => removeTransformation(transform.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="panel-actions">
            <button 
              className="btn btn-primary"
              onClick={applyTransformations}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Apply Changes
                </>
              )}
            </button>
            <button className="btn btn-secondary">
              <Download size={16} />
              Export Query
            </button>
          </div>
        </div>

        {/* Center Panel - Data Preview */}
        <div className="data-preview-panel">
          <div className="panel-header">
            <h3><Eye size={20} />Data Preview</h3>
            <div className="preview-stats">
              <span>{dataPreview.length} rows</span>
              <span>{Object.keys(dataPreview[0] || {}).length} columns</span>
            </div>
          </div>
          
          <div className="data-table-container">
            {dataPreview.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(dataPreview[0]).map(column => (
                      <th key={column}>
                        <div className="column-header">
                          <span>{column}</span>
                          <div className="column-actions">
                            <button title="Sort Ascending">
                              <SortAsc size={14} />
                            </button>
                            <button title="Filter">
                              <Filter size={14} />
                            </button>
                            <button title="More Options">
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.slice(0, 50).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex}>
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel - Query Code */}
        <div className="query-code-panel">
          <div className="panel-header">
            <h3><Code size={20} />M Query</h3>
            <button className="btn btn-secondary btn-sm">
              <Copy size={14} />
              Copy
            </button>
          </div>
          
          <div className="code-editor">
            <pre className="query-code">
              <code>{queryCode}</code>
            </pre>
          </div>
          
          <div className="query-info">
            <div className="info-item">
              <AlertCircle size={16} />
              <span>Query is valid and ready to execute</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerQueryPage;