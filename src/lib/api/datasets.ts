import api from '../api';

// Types for dataset API
export interface CreateDatasetDto {
  projectId: string;
  name: string;
  description: string;
}

export interface DatasetResponse {
  _id: string;
  projectId: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetUploadResponse {
  _id: string;
  datasetId: string;
  projectId: string;
  userId: string;
  sourceUri: string;
  assetType: string;
  status: string;
  aiAnnotationStatus: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Datasets API endpoints
export const datasetsAPI = {
  // Create a new dataset
  create: async (datasetData: CreateDatasetDto): Promise<DatasetResponse> => {
    const response = await api.post('/datasets', datasetData);
    return response.data;
  },

  // Get all datasets for the authenticated user
  getAll: async (): Promise<DatasetResponse[]> => {
    const response = await api.get('/datasets');
    return response.data;
  },

  // Get datasets by project ID
  getByProject: async (projectId: string): Promise<DatasetResponse[]> => {
    const response = await api.get(`/datasets/project/${projectId}`);
    return response.data;
  },

  // Get a single dataset by ID
  getById: async (datasetId: string): Promise<DatasetResponse> => {
    const response = await api.get(`/datasets/${datasetId}`);
    return response.data;
  },

  // Update a dataset
  update: async (
    datasetId: string,
    datasetData: Partial<CreateDatasetDto>,
  ): Promise<DatasetResponse> => {
    const response = await api.patch(`/datasets/${datasetId}`, datasetData);
    return response.data;
  },

  // Delete a dataset
  delete: async (datasetId: string): Promise<void> => {
    await api.delete(`/datasets/${datasetId}`);
  },

  // Upload assets to dataset
  uploadAssets: async (
    datasetId: string,
    files: File[],
  ): Promise<AssetUploadResponse[]> => {
    const formData = new FormData();
    formData.append('datasetId', datasetId);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
