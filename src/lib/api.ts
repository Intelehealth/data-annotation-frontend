import axios from 'axios';

const API_BASE_URL = process.env.NEXT_URL || 'http://localhost:3001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  // Removed default Content-Type header to allow browser to set it automatically
  // This is especially important for FormData uploads
});

// Helper method for JSON requests
export const jsonApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Request interceptor for JSON API to add auth token
jsonApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Response interceptor for JSON API to handle token expiration
jsonApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth API endpoints
export const authAPI = {
  // Register new user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await jsonApi.post('/auth/register', userData);
    return response.data;
  },

  // Login with email/password
  login: async (credentials: { email: string; password: string }) => {
    const response = await jsonApi.post('/auth/login', credentials);
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await jsonApi.post('/auth/refresh');
    return response.data;
  },
};

// Users API endpoints
export const usersAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await jsonApi.get('/users/');
    return response.data;
  },
};

export default api;

// Field Selection API endpoints
export const fieldSelectionAPI = {
  // Save annotation field configuration
  saveFieldSelection: async (data: {
    csvImportId: string;
    annotationFields: {
      csvColumnName: string;
      fieldName: string;
      fieldType: 'text' | 'image' | 'audio';
      isRequired: boolean;
      isMetadataField: boolean;
      isAnnotationField: boolean;
      options?: string[];
      instructions?: string;
    }[];
  }) => {
    const response = await jsonApi.post(
      '/csv-processing/field-selection',
      data,
    );
    return response.data;
  },

  // Get field selection configuration for a CSV import
  getFieldSelection: async (csvImportId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/field-selection/${csvImportId}`,
    );
    return response.data;
  },

  // Get all field selections for a project
  getProjectFieldSelections: async (projectId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/field-selection/project/${projectId}`,
    );
    return response.data;
  },

  // Get CSV imports for a project
  getProjectCSVImports: async (projectId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/project/${projectId}/imports`,
    );
    return response.data;
  },

  // Start annotation process
  startAnnotation: async (csvImportId: string) => {
    const response = await jsonApi.post(
      `/csv-processing/field-selection/${csvImportId}/start`,
    );
    return response.data;
  },

  // Get annotation progress
  getAnnotationProgress: async (csvImportId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/field-selection/${csvImportId}/progress`,
    );
    return response.data;
  },

  // Get CSV columns for a specific CSV import
  getCSVColumns: async (csvImportId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/columns/${csvImportId}`,
    );
    return response.data;
  },

  // Get CSV import status (includes columns)
  getCSVImportStatus: async (csvImportId: string) => {
    const response = await jsonApi.get(`/csv-processing/status/${csvImportId}`);
    return response.data;
  },
};
