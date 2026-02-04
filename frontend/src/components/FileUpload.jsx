import React, { useState } from 'react';
import { uploadDataset } from '../services/api';
import { Icon, ICON_SIZES } from '../constants/icons';
import { FolderOpen, Upload, FileText, FileImage, FileSpreadsheet, Wrench, RotateCcw, Zap, XCircle } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const result = await uploadDataset(file);
      onUploadSuccess(result);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return FileText;
    if (['docx', 'doc'].includes(ext)) return FileText;
    if (['pptx', 'ppt'].includes(ext)) return FileSpreadsheet;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
    if (['png', 'jpg', 'jpeg'].includes(ext)) return FileImage;
    if (['json', 'xml'].includes(ext)) return Wrench;
    return FolderOpen;
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#007bff' : '#ccc'}`,
          padding: '2rem',
          textAlign: 'center',
          borderRadius: '8px',
          backgroundColor: dragActive ? '#f8f9fa' : 'white',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          <FolderOpen size={48} color="#007bff" />
        </div>
        
        <h3>Upload Any Business File</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          PDF, DOCX, PPTX, CSV, XLSX, JSON, XML, Images
        </p>
        
        <input 
          type="file" 
          accept=".pdf,.docx,.doc,.pptx,.ppt,.csv,.xlsx,.xls,.json,.xml,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        
        <label 
          htmlFor="file-input"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          Choose Any File
        </label>
      </div>
      
      {file && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            {React.createElement(getFileIcon(file.name), { size: 24, style: { marginRight: '0.5rem' } })}
            <div>
              <strong>{file.name}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: isUploading ? '#6c757d' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {isUploading ? (
              <>
                <RotateCcw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <Zap size={16} style={{ marginRight: '8px' }} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <XCircle size={16} style={{ marginRight: '8px' }} />
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;