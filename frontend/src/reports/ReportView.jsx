import React, { useReducer, useEffect, useState } from 'react';
import { Save, Download } from 'lucide-react';
import VisualGallery from './VisualGallery';
import ReportCanvas from './ReportCanvas';
import PropertyEditor from './PropertyEditor';
import { reportReducer, initialReportState, reportActions } from './reportReducer';
import './reportView.css';

const ReportView = () => {
  const [state, dispatch] = useReducer(reportReducer, initialReportState);
  const [dataset, setDataset] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    // Load dataset from localStorage
    const stored = localStorage.getItem('uploadResult');
    if (stored) {
      const result = JSON.parse(stored);
      setUploadResult(result);
      generateMockDataset(result);
    }

    // Load saved report if exists
    const savedReport = localStorage.getItem('currentReport');
    if (savedReport) {
      dispatch({ type: reportActions.LOAD_REPORT, payload: JSON.parse(savedReport) });
    }
  }, []);

  const generateMockDataset = (metadata) => {
    if (!metadata) return;
    
    const { column_names, inferred_column_types, number_of_rows } = metadata;
    const sampleSize = Math.min(50, number_of_rows || 20);
    const sample = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const row = {};
      column_names?.forEach(column => {
        const columnType = inferred_column_types?.[column];
        
        if (columnType === 'numeric') {
          row[column] = Math.floor(Math.random() * 1000) + 100;
        } else {
          const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
          row[column] = categories[Math.floor(Math.random() * categories.length)];
        }
      });
      sample.push(row);
    }
    
    setDataset(sample);
  };

  const handleAddVisual = (type) => {
    dispatch({ type: reportActions.ADD_VISUAL, payload: { type } });
  };

  const handleSelectVisual = (id) => {
    dispatch({ type: reportActions.SELECT_VISUAL, payload: { id } });
  };

  const handleMoveVisual = (id, x, y) => {
    dispatch({ type: reportActions.MOVE_VISUAL, payload: { id, x, y } });
  };

  const handleResizeVisual = (id, w, h) => {
    dispatch({ type: reportActions.RESIZE_VISUAL, payload: { id, w, h } });
  };

  const handleDeleteVisual = (id) => {
    dispatch({ type: reportActions.DELETE_VISUAL, payload: { id } });
  };

  const handleUpdateDataConfig = (config) => {
    if (state.selectedVisualId) {
      dispatch({
        type: reportActions.UPDATE_DATA_CONFIG,
        payload: { id: state.selectedVisualId, config }
      });
    }
  };

  const handleUpdateStyleConfig = (config) => {
    if (state.selectedVisualId) {
      dispatch({
        type: reportActions.UPDATE_STYLE_CONFIG,
        payload: { id: state.selectedVisualId, config }
      });
    }
  };

  const handleSaveReport = () => {
    localStorage.setItem('currentReport', JSON.stringify(state));
    alert('Report saved successfully!');
  };

  const selectedVisual = state.visuals.find(v => v.id === state.selectedVisualId);

  if (!uploadResult) {
    return (
      <div className="report-view">
        <div className="report-empty">
          <h2>No Dataset Available</h2>
          <p>Please upload a dataset first to create reports</p>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary">
            Upload Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-view">
      <div className="report-header">
        <div className="report-title">
          <h1>Report Builder</h1>
          <p>Dataset: {uploadResult?.filename || 'Unknown'}</p>
        </div>
        <div className="report-actions">
          <button className="btn btn-secondary" onClick={handleSaveReport}>
            <Save size={16} />
            Save Report
          </button>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="report-workspace">
        <div className="workspace-left">
          <VisualGallery onAddVisual={handleAddVisual} />
        </div>

        <div className="workspace-center">
          <ReportCanvas
            visuals={state.visuals}
            selectedVisualId={state.selectedVisualId}
            dataset={dataset}
            onSelectVisual={handleSelectVisual}
            onMoveVisual={handleMoveVisual}
            onResizeVisual={handleResizeVisual}
            onDeleteVisual={handleDeleteVisual}
          />
        </div>

        <div className="workspace-right">
          <PropertyEditor
            visual={selectedVisual}
            dataset={dataset}
            onUpdateDataConfig={handleUpdateDataConfig}
            onUpdateStyleConfig={handleUpdateStyleConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportView;
