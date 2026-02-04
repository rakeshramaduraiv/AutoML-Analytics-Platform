import React, { useState } from 'react';
import UniversalFileUpload from '../components/UniversalFileUpload';
import { 
  Zap, BarChart3, FileText, Target, Brain, TrendingUp, 
  FileCheck, Smile, Frown, Meh, BookOpen, Eye, Settings
} from 'lucide-react';

const UploadPage = () => {
  const [uploadResult, setUploadResult] = useState(null);

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadResult(result);
    localStorage.setItem('uploadResult', JSON.stringify(result));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1><Zap size={32} style={{ marginRight: '12px' }} />Enterprise File Processing Platform</h1>
        <p className="page-subtitle">
          Upload any business file and get instant AI-powered analysis
        </p>
      </div>

      <UniversalFileUpload onUploadSuccess={handleUploadSuccess} />
      
      {uploadResult && (
        <div className="upload-results" style={{ marginTop: '30px', padding: '20px', border: '2px solid #28a745', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
          <h2><BarChart3 size={24} style={{ marginRight: '8px' }} />File Analysis Results</h2>
          
          {/* Document Analysis Results */}
          {uploadResult.document_type && (
            <div style={{ marginBottom: '20px' }}>
              <h3><FileText size={20} style={{ marginRight: '8px' }} />Document Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><FileCheck size={18} style={{ marginRight: '6px' }} />Content</h4>
                  <p><strong>Type:</strong> {uploadResult.document_type}</p>
                  {uploadResult.document_metadata && (
                    <>
                      <p><strong>Pages:</strong> {uploadResult.document_metadata.page_count || 'N/A'}</p>
                      <p><strong>Words:</strong> {uploadResult.document_metadata.word_count || 'N/A'}</p>
                      <p><strong>Language:</strong> {uploadResult.document_metadata.language || 'Auto-detected'}</p>
                    </>
                  )}
                </div>
                
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><Target size={18} style={{ marginRight: '6px' }} />Quality</h4>
                  {uploadResult.content_preview && (
                    <>
                      <p><strong>Extraction:</strong> {uploadResult.content_preview.extraction_quality}</p>
                      <p><strong>Completeness:</strong> {Math.round(uploadResult.content_preview.data_completeness * 100)}%</p>
                    </>
                  )}
                </div>
                
                {uploadResult.text_analytics && (
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <h4><Brain size={18} style={{ marginRight: '6px' }} />AI Analysis</h4>
                    <p><strong>Sentiment:</strong> {
                      uploadResult.text_analytics.sentiment_score > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Smile size={16} color="#28a745" /> Positive
                        </span>
                      ) : uploadResult.text_analytics.sentiment_score < 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Frown size={16} color="#dc3545" /> Negative
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Meh size={16} color="#6c757d" /> Neutral
                        </span>
                      )
                    }</p>
                    {uploadResult.text_analytics.key_phrases && (
                      <p><strong>Key Topics:</strong> {uploadResult.text_analytics.key_phrases.slice(0, 3).join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
              
              {uploadResult.content_preview && uploadResult.content_preview.text_sample && (
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><BookOpen size={18} style={{ marginRight: '6px' }} />Content Preview</h4>
                  <div style={{ maxHeight: '200px', overflow: 'auto', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                    {uploadResult.content_preview.text_sample}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Data Analysis Results */}
          {uploadResult.rows && uploadResult.columns && (
            <div style={{ marginBottom: '20px' }}>
              <h3><BarChart3 size={20} style={{ marginRight: '8px' }} />Data Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><Settings size={18} style={{ marginRight: '6px' }} />Dimensions</h4>
                  <p><strong>{uploadResult.rows}</strong> rows × <strong>{uploadResult.columns}</strong> columns</p>
                </div>
                
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><Settings size={18} style={{ marginRight: '6px' }} />Processing</h4>
                  <p><strong>Method:</strong> {uploadResult.processing_method}</p>
                  <p><strong>Type:</strong> {uploadResult.file_type}</p>
                </div>
              </div>
              
              {uploadResult.preview && (
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4><Eye size={18} style={{ marginRight: '6px' }} />Data Preview</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          {Object.keys(uploadResult.preview[0] || {}).map(col => (
                            <th key={col} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.preview.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i} style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {String(val).substring(0, 50)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
            <h3><Target size={20} style={{ marginRight: '8px' }} />Next Steps</h3>
            <p>Your file has been successfully processed! Choose what to do next:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '15px' }}>              {uploadResult.structured_data && uploadResult.structured_data.has_structured_data && (
                <button 
                  onClick={() => window.location.href = '/train'}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Brain size={16} />
                  Train AI Model
                </button>
              )}
              <button 
                onClick={() => window.location.href = '/dashboard'}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <TrendingUp size={16} />
                Advanced Analytics
              </button>
              <button 
                onClick={() => window.location.href = '/report'}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#17a2b8', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={16} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;