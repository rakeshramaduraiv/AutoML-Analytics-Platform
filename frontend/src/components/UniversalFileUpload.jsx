import React, { useState } from 'react';
import { uploadDataset } from '../services/api';
import { 
  FolderOpen, FileText, FileImage, FileSpreadsheet, 
  File, Wrench, CheckCircle, RotateCcw, Zap, XCircle
} from 'lucide-react';

const UniversalFileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return { icon: FileText, label: 'PDF Document' };
    if (['docx', 'doc'].includes(ext)) return { icon: FileText, label: 'Word Document' };
    if (['pptx', 'ppt'].includes(ext)) return { icon: FileSpreadsheet, label: 'PowerPoint' };
    if (['xlsx', 'xls'].includes(ext)) return { icon: FileSpreadsheet, label: 'Excel Spreadsheet' };
    if (['csv'].includes(ext)) return { icon: FileSpreadsheet, label: 'CSV Data' };
    if (['json'].includes(ext)) return { icon: Wrench, label: 'JSON Data' };
    if (['xml'].includes(ext)) return { icon: Wrench, label: 'XML Data' };
    if (['png', 'jpg', 'jpeg'].includes(ext)) return { icon: FileImage, label: 'Image' };
    if (['txt'].includes(ext)) return { icon: FileText, label: 'Text File' };
    return { icon: File, label: 'File' };
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        border: '3px dashed #007bff',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
          <FolderOpen size={64} color="#007bff" />
        </div>
        
        <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
          Universal File Upload
        </h2>
        
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>
          Upload ANY business file: PDF, DOCX, PPTX, XLSX, CSV, JSON, XML, Images
        </p>

        <input 
          type="file" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="universal-file-input"
          // NO ACCEPT ATTRIBUTE - ACCEPTS ALL FILES
        />
        
        <label 
          htmlFor="universal-file-input"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          <FolderOpen size={20} />
          Select Any File
        </label>

        <div style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CheckCircle size={16} /> PDF <CheckCircle size={16} /> DOCX <CheckCircle size={16} /> PPTX <CheckCircle size={16} /> XLSX <CheckCircle size={16} /> CSV <CheckCircle size={16} /> JSON <CheckCircle size={16} /> XML <CheckCircle size={16} /> Images
        </div>
      </div>
      
      {file && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          border: '2px solid #28a745',
          borderRadius: '8px',
          backgroundColor: '#d4edda'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {React.createElement(getFileType(file.name).icon, { size: 20 })}
              {getFileType(file.name).label}
            </div>
            <div style={{ fontSize: '16px', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} /> {file.name}
            </div>
            <div style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <File size={16} /> Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isUploading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            {isUploading ? (
              <>
                <RotateCcw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Processing File...
              </>
            ) : (
              <>
                <Zap size={16} style={{ marginRight: '8px' }} />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      )}
      
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '5px',
          color: '#721c24',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <XCircle size={20} /> Error: {error}
        </div>
      )}
    </div>
  );
};

export default UniversalFileUpload;