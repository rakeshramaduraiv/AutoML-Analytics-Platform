// Utility functions for handling upload results consistently across the platform

export const getUploadInfo = (uploadResult) => {
  if (!uploadResult) {
    return {
      filename: 'No file selected',
      fileType: 'Unknown',
      rows: 'N/A',
      columns: 'N/A',
      size: 'N/A'
    };
  }

  // Handle different property name variations from backend
  const filename = uploadResult.filename || 
                  uploadResult.name || 
                  uploadResult.file_name || 
                  'Unknown file';

  const fileType = uploadResult.document_type || 
                  uploadResult.file_type || 
                  uploadResult.type || 
                  uploadResult.extension ||
                  'Unknown';

  const rows = uploadResult.rows || 
              uploadResult.number_of_rows || 
              uploadResult.row_count || 
              0;

  const columns = uploadResult.columns || 
                 uploadResult.number_of_columns || 
                 uploadResult.column_count ||
                 (uploadResult.column_names ? uploadResult.column_names.length : 0);

  const size = uploadResult.file_size || 
              uploadResult.size || 
              'Unknown';

  return {
    filename,
    fileType,
    rows: rows > 0 ? rows.toLocaleString() : 'N/A',
    columns: columns > 0 ? columns : 'N/A',
    size: typeof size === 'number' ? `${(size / 1024).toFixed(1)} KB` : size,
    columnNames: uploadResult.column_names || [],
    columnTypes: uploadResult.inferred_column_types || {}
  };
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getDatasetStatus = (uploadResult) => {
  if (!uploadResult) {
    return {
      status: 'no-data',
      message: 'No dataset available',
      color: '#6B7280'
    };
  }

  const info = getUploadInfo(uploadResult);
  
  if (info.rows === 'N/A' || info.columns === 'N/A') {
    return {
      status: 'incomplete',
      message: 'Dataset information incomplete',
      color: '#F59E0B'
    };
  }

  const rowCount = parseInt(info.rows.replace(/,/g, ''));
  const colCount = parseInt(info.columns);

  if (rowCount < 10 || colCount < 2) {
    return {
      status: 'insufficient',
      message: 'Dataset too small for training',
      color: '#EF4444'
    };
  }

  return {
    status: 'ready',
    message: 'Ready for training',
    color: '#10B981'
  };
};

export const createDatasetInfoCard = (uploadResult, title = 'Dataset Information') => {
  const info = getUploadInfo(uploadResult);
  const status = getDatasetStatus(uploadResult);

  return {
    title,
    info,
    status,
    isValid: status.status === 'ready'
  };
};