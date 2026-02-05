import axios from 'axios';
import io from 'socket.io-client';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TIMEOUT = 600000; // 10 minutes for ML training

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
});

// Create socket connection
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// File upload with progress tracking
export const uploadDataset = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large files
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

// API service with comprehensive functionality
export const apiService = {
  
  // Socket connection
  socket: socket,
  
  // System health and monitoring
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Data management
  uploadDataset: uploadDataset,

  analyzeDataset: async (filename, options = {}) => {
    const response = await api.post('/api/analyze', { 
      filename, 
      ...options 
    });
    return response.data;
  },

  // Model lifecycle management
  trainModel: async (filename, config = {}) => {
    const response = await api.post('/api/train', { 
      filename,
      ...config
    }, {
      timeout: 600000 // 10 minutes for training
    });
    return response.data;
  },

  listModels: async () => {
    const response = await api.get('/api/models');
    return response.data;
  },

  deleteModel: async (modelName) => {
    const response = await api.delete(`/api/models/${modelName}`);
    return response.data;
  },

  // Prediction and inference
  makePrediction: async (modelName, inputData, options = {}) => {
    const response = await api.post('/api/predict', {
      model_name: modelName,
      input_data: inputData,
      ...options
    });
    return response.data;
  },

  // Error handling utility
  handleApiError: (error) => {
    if (error.response) {
      const { status, data } = error.response;
      return {
        type: 'server_error',
        status,
        message: data.error || data.message || 'Server error occurred'
      };
    } else if (error.request) {
      return {
        type: 'network_error',
        message: 'Network error - please check your connection'
      };
    } else {
      return {
        type: 'client_error',
        message: error.message || 'An unexpected error occurred'
      };
    }
  }
};

export default apiService;