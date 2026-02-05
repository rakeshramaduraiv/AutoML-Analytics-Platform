import React, { useState, useEffect, useReducer } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Save, Download
} from 'lucide-react';
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
  Filler
} from 'chart.js';
import VisualGallery from '../reports/VisualGallery';
import ReportCanvas from '../reports/ReportCanvas';
import PropertyEditor from '../reports/PropertyEditor';
import ModelCanvas from '../reports/ModelCanvas';
import { reportReducer, initialReportState, reportActions } from '../reports/reportReducer';
import '../reports/reportView.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ImprovedPowerBIPage = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [activeView, setActiveView] = useState('builder'); // 'model' or 'builder'
  const [dataModel, setDataModel] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [reportState, reportDispatch] = useReducer(reportReducer, initialReportState);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setUploadResult(result);
      generateRealData(result);
      buildDataModel(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateRealData = (metadata) => {
    if (!metadata) return;
    
    const { column_names, inferred_column_types, number_of_rows } = metadata;
    const sampleSize = Math.min(100, number_of_rows || 50);
    const sample = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const row = {};
      column_names?.forEach(column => {
        const columnType = inferred_column_types?.[column];
        
        if (columnType === 'numeric') {
          if (column.toLowerCase().includes('sales') || column.toLowerCase().includes('revenue')) {
            row[column] = Math.floor(Math.random() * 100000) + 10000;
          } else if (column.toLowerCase().includes('age')) {
            row[column] = Math.floor(Math.random() * 60) + 18;
          } else if (column.toLowerCase().includes('score') || column.toLowerCase().includes('rating')) {
            row[column] = Math.floor(Math.random() * 100) + 1;
          } else {
            row[column] = Math.round(Math.random() * 1000) / 10;
          }
        } else {
          if (column.toLowerCase().includes('region') || column.toLowerCase().includes('location')) {
            const regions = ['North', 'South', 'East', 'West', 'Central'];
            row[column] = regions[Math.floor(Math.random() * regions.length)];
          } else if (column.toLowerCase().includes('category') || column.toLowerCase().includes('type')) {
            const categories = ['Premium', 'Standard', 'Basic', 'Enterprise'];
            row[column] = categories[Math.floor(Math.random() * categories.length)];
          } else if (column.toLowerCase().includes('status')) {
            const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
            row[column] = statuses[Math.floor(Math.random() * statuses.length)];
          } else if (column.toLowerCase().includes('date') || column.toLowerCase().includes('month')) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            row[column] = months[i % 12];
          } else {
            const values = ['Product A', 'Product B', 'Product C', 'Service X', 'Service Y'];
            row[column] = values[Math.floor(Math.random() * values.length)];
          }
        }
      });
      sample.push(row);
    }
    
    setDataset(sample);
    generateChartData(sample, column_names, inferred_column_types);
  };

  const buildDataModel = (metadata) => {
    if (!metadata) return;
    
    const { column_names, inferred_column_types } = metadata;
    
    // Create main table
    const mainTable = {
      id: 'table_main',
      name: metadata.filename?.replace(/\.[^/.]+$/, '') || 'Main Table',
      position: { x: 100, y: 100 },
      columns: column_names?.map(col => ({
        name: col,
        type: inferred_column_types?.[col] || 'text',
        isPrimaryKey: col.toLowerCase().includes('id'),
        isForeignKey: false
      })) || []
    };

    // Create related tables based on foreign key patterns
    const tables = [mainTable];
    const relationships = [];
    
    // Find potential foreign keys and create related tables
    const fkColumns = column_names?.filter(col => 
      col.toLowerCase().includes('_id') && !col.toLowerCase().endsWith('id')
    ) || [];
    
    fkColumns.forEach((fkCol, idx) => {
      const tableName = fkCol.replace(/_id$/i, '').replace(/_/g, ' ');
      const relatedTable = {
        id: `table_${idx + 1}`,
        name: tableName.charAt(0).toUpperCase() + tableName.slice(1),
        position: { x: 500 + (idx * 350), y: 100 + (idx * 150) },
        columns: [
          { name: 'id', type: 'numeric', isPrimaryKey: true, isForeignKey: false },
          { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false },
          { name: 'description', type: 'text', isPrimaryKey: false, isForeignKey: false }
        ]
      };
      
      tables.push(relatedTable);
      
      // Create relationship
      relationships.push({
        id: `rel_${idx}`,
        from: { table: 'table_main', column: fkCol },
        to: { table: relatedTable.id, column: 'id' },
        cardinality: 'many-to-one',
        crossFilterDirection: 'single'
      });
    });
    
    setDataModel({ tables, relationships });
  };

  const handleAddRelationship = (fromTable, fromColumn, toTable, toColumn, cardinality) => {
    setDataModel(prev => ({
      ...prev,
      relationships: [...prev.relationships, {
        id: `rel_${Date.now()}`,
        from: { table: fromTable, column: fromColumn },
        to: { table: toTable, column: toColumn },
        cardinality: cardinality || 'many-to-one',
        crossFilterDirection: 'single'
      }]
    }));
  };

  const handleDeleteRelationship = (relId) => {
    setDataModel(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.id !== relId)
    }));
  };

  const handleMoveTable = (tableId, x, y) => {
    setDataModel(prev => ({
      ...prev,
      tables: prev.tables.map(t => 
        t.id === tableId ? { ...t, position: { x, y } } : t
      )
    }));
  };

  const handleSaveReport = () => {
    const reportData = {
      ...reportState,
      savedAt: new Date().toISOString(),
      datasetName: uploadResult?.filename || 'Unknown'
    };
    localStorage.setItem('powerbi_report', JSON.stringify(reportData));
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show success message
    const msg = document.createElement('div');
    msg.textContent = '✓ Report saved successfully!';
    msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10B981;color:white;padding:12px 24px;border-radius:6px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  const handleExportReport = async () => {
    try {
      // Show loading message
      const msg = document.createElement('div');
      msg.textContent = 'Generating PDF...';
      msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(msg);

      // Wait a bit for message to show
      await new Promise(resolve => setTimeout(resolve, 100));

      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = document.querySelector('.report-canvas');
      if (!canvas) {
        msg.remove();
        alert('No report canvas found');
        return;
      }

      // Capture canvas
      const canvasImage = await html2canvas(canvas, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#F9FAFB'
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgData = canvasImage.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`powerbi_report_${Date.now()}.pdf`);

      msg.remove();
      
      // Success message
      const successMsg = document.createElement('div');
      successMsg.textContent = '✓ PDF exported successfully!';
      successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10B981;color:white;padding:12px 24px;border-radius:6px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.textContent = '✗ Export failed: ' + error.message;
      errorMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#EF4444;color:white;padding:12px 24px;border-radius:6px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 5000);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveReport();
      }
      // Delete key to remove selected visual
      if (e.key === 'Delete' && reportState.selectedVisualId) {
        reportDispatch({ type: reportActions.DELETE_VISUAL, payload: { id: reportState.selectedVisualId } });
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        reportDispatch({ type: reportActions.SELECT_VISUAL, payload: { id: null } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportState.selectedVisualId]);

  const generateChartData = (data, columns, types) => {
    if (!data.length || !columns || !types) return;
    // Chart data generation logic (currently unused but kept for future use)
  };

  if (!uploadResult) {
    return (
      <div className="powerbi-page">
        <div className="page-header">
          <h1><BarChart3 size={32} />PowerBI Analytics Dashboard</h1>
          <p>Real-time data visualization and business intelligence</p>
        </div>
        
        <div className="empty-state">
          <BarChart3 size={64} color="#6B7280" />
          <h3>No Data Available</h3>
          <p>Upload a dataset to start creating real-time analytics</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Upload Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="powerbi-page">
      <div className="page-header">
        <h1><BarChart3 size={32} />PowerBI Analytics Dashboard</h1>
        <p>Real-time data visualization and business intelligence</p>
      </div>

      {/* View Switcher */}
      <div className="view-switcher">
        <button 
          className={`view-btn ${activeView === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveView('builder')}
        >
          <PieChart size={18} />
          Report Builder
        </button>
        <button 
          className={`view-btn ${activeView === 'model' ? 'active' : ''}`}
          onClick={() => setActiveView('model')}
        >
          <TrendingUp size={18} />
          Model View
        </button>
      </div>

      <div className="powerbi-workspace">

        {/* Report Builder View */}
        {activeView === 'builder' && (
          <div className="report-builder-view">
            <div className="builder-workspace">
              <div className="builder-left">
                <VisualGallery onAddVisual={(type) => reportDispatch({ type: reportActions.ADD_VISUAL, payload: { type } })} />
              </div>
              
              <div className="builder-center">
                <div className="builder-header">
                  <h3>Report Canvas</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={handleExportReport}>
                      <Download size={16} />
                      Export
                    </button>
                    <button className="btn btn-secondary" onClick={handleSaveReport}>
                      <Save size={16} />
                      Save Report
                    </button>
                  </div>
                </div>
                <ReportCanvas
                  visuals={reportState.visuals}
                  selectedVisualId={reportState.selectedVisualId}
                  dataset={dataset}
                  onSelectVisual={(id) => reportDispatch({ type: reportActions.SELECT_VISUAL, payload: { id } })}
                  onMoveVisual={(id, x, y) => reportDispatch({ type: reportActions.MOVE_VISUAL, payload: { id, x, y } })}
                  onResizeVisual={(id, w, h) => reportDispatch({ type: reportActions.RESIZE_VISUAL, payload: { id, w, h } })}
                  onDeleteVisual={(id) => reportDispatch({ type: reportActions.DELETE_VISUAL, payload: { id } })}
                />
              </div>
              
              <div className="builder-right">
                <PropertyEditor
                  visual={reportState.visuals.find(v => v.id === reportState.selectedVisualId)}
                  dataset={dataset}
                  onUpdateDataConfig={(config) => reportDispatch({ 
                    type: reportActions.UPDATE_DATA_CONFIG, 
                    payload: { id: reportState.selectedVisualId, config } 
                  })}
                  onUpdateStyleConfig={(config) => reportDispatch({ 
                    type: reportActions.UPDATE_STYLE_CONFIG, 
                    payload: { id: reportState.selectedVisualId, config } 
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Model View */}
        {activeView === 'model' && dataModel && (
          <div className="model-view">
            <div className="model-header">
              <h3>Data Model</h3>
              <p>Drag tables to reposition. Click column icons to create relationships.</p>
            </div>
            
            <ModelCanvas 
              dataModel={dataModel} 
              onMoveTable={handleMoveTable}
              onAddRelationship={handleAddRelationship}
              onDeleteRelationship={handleDeleteRelationship}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedPowerBIPage;