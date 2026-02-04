import React from 'react';

const DatasetSummary = ({ data }) => {
  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3>Dataset Summary</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{data.rows}</div>
          <div>Rows</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{data.columns}</div>
          <div>Columns</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6c757d' }}>{data.filename}</div>
          <div>Filename</div>
        </div>
      </div>
      
      <div>
        <h4>Columns:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {data.column_names.map((col, index) => (
            <span 
              key={index}
              style={{ 
                padding: '0.25rem 0.5rem', 
                background: '#e9ecef', 
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatasetSummary;