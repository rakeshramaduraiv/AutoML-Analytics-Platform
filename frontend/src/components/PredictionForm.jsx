import React, { useState, useEffect } from 'react';
import { ICON_SIZES } from '../constants/icons';
import { FileText, Clipboard, Lightbulb, RotateCcw, Zap } from 'lucide-react';

const PredictionForm = ({ selectedModel, modelMetadata, onPredict, isLoading }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Reset form when model changes
  useEffect(() => {
    if (modelMetadata && modelMetadata.feature_columns) {
      const initialData = {};
      modelMetadata.feature_columns.forEach(feature => {
        initialData[feature] = '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [modelMetadata]);

  // Handle input changes
  const handleInputChange = (feature, value) => {
    setFormData(prev => ({
      ...prev,
      [feature]: value
    }));
    
    // Clear error for this field
    if (errors[feature]) {
      setErrors(prev => ({
        ...prev,
        [feature]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!modelMetadata || !modelMetadata.feature_columns) {
      return { general: 'Model metadata not available' };
    }

    modelMetadata.feature_columns.forEach(feature => {
      const value = formData[feature];
      
      if (value === '' || value === null || value === undefined) {
        newErrors[feature] = 'This field is required';
      } else {
        // Validate numeric fields
        const inferredType = getInferredType(feature);
        if (inferredType === 'numeric') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            newErrors[feature] = 'Must be a valid number';
          }
        }
      }
    });

    return newErrors;
  };

  // Infer field type based on feature name (simple heuristics)
  const getInferredType = (feature) => {
    const featureLower = feature.toLowerCase();
    
    // Numeric indicators
    if (featureLower.includes('age') || 
        featureLower.includes('income') || 
        featureLower.includes('salary') ||
        featureLower.includes('price') ||
        featureLower.includes('amount') ||
        featureLower.includes('score') ||
        featureLower.includes('count') ||
        featureLower.includes('number') ||
        featureLower.includes('rate') ||
        featureLower.includes('percent')) {
      return 'numeric';
    }
    
    return 'categorical';
  };

  // Get input placeholder based on feature name
  const getPlaceholder = (feature) => {
    const featureLower = feature.toLowerCase();
    
    if (featureLower.includes('age')) return 'e.g., 35';
    if (featureLower.includes('income') || featureLower.includes('salary')) return 'e.g., 50000';
    if (featureLower.includes('price') || featureLower.includes('amount')) return 'e.g., 299.99';
    if (featureLower.includes('score')) return 'e.g., 85';
    if (featureLower.includes('category') || featureLower.includes('type')) return 'e.g., Category A';
    if (featureLower.includes('status')) return 'e.g., Active';
    
    return `Enter ${feature}`;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert numeric fields to numbers
    const processedData = {};
    modelMetadata.feature_columns.forEach(feature => {
      const value = formData[feature];
      const inferredType = getInferredType(feature);
      
      if (inferredType === 'numeric') {
        processedData[feature] = parseFloat(value);
      } else {
        processedData[feature] = value;
      }
    });

    onPredict(processedData);
  };

  // Load sample data for demo
  const loadSampleData = () => {
    if (!modelMetadata || !modelMetadata.feature_columns) return;

    const sampleData = {};
    modelMetadata.feature_columns.forEach((feature, index) => {
      const inferredType = getInferredType(feature);
      
      if (inferredType === 'numeric') {
        // Generate realistic numeric values
        sampleData[feature] = Math.floor(Math.random() * 100) + 1;
      } else {
        // Generate realistic categorical values
        const categories = ['A', 'B', 'C', 'High', 'Medium', 'Low', 'Yes', 'No'];
        sampleData[feature] = categories[index % categories.length];
      }
    });

    setFormData(sampleData);
    setErrors({});
  };

  if (!selectedModel) {
    return (
      <div className="prediction-form-placeholder">
        <p>Select a model to start making predictions</p>
      </div>
    );
  }

  if (!modelMetadata || !modelMetadata.feature_columns) {
    return (
      <div className="prediction-form-loading">
        <p>Loading model information...</p>
      </div>
    );
  }

  return (
    <div className="prediction-form">
      <div className="form-header">
        <h3><FileText size={ICON_SIZES.LARGE} style={{ marginRight: '8px' }} />Input Features</h3>
        <p>Enter values for all features to make a prediction</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={loadSampleData}
            className="sample-data-btn"
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3B82F6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clipboard size={16} />
            Load Sample Data
          </button>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#FEF3C7', 
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Lightbulb size={16} />
            Click "Load Sample Data" to auto-fill with example values
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form-fields">
        <div className="fields-grid">
          {modelMetadata.feature_columns.map(feature => {
            const inferredType = getInferredType(feature);
            const hasError = errors[feature];
            
            return (
              <div key={feature} className={`form-field ${hasError ? 'error' : ''}`}>
                <label htmlFor={feature}>
                  {feature}
                  <span className="field-type">({inferredType})</span>
                </label>
                
                <input
                  id={feature}
                  type={inferredType === 'numeric' ? 'number' : 'text'}
                  value={formData[feature] || ''}
                  onChange={(e) => handleInputChange(feature, e.target.value)}
                  placeholder={getPlaceholder(feature)}
                  className={hasError ? 'error' : ''}
                  step={inferredType === 'numeric' ? 'any' : undefined}
                />
                
                {hasError && (
                  <span className="error-message">{hasError}</span>
                )}
              </div>
            );
          })}
        </div>

        {errors.general && (
          <div className="form-error">
            {errors.general}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading}
            className="predict-btn"
          >
            {isLoading ? (
              <>
                <RotateCcw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Predicting...
              </>
            ) : (
              <>
                <Zap size={16} style={{ marginRight: '8px' }} />
                Make Prediction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;