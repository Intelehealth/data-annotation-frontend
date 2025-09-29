import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DatasetResponse {
  _id: string;
  userId: string | { _id: string; firstName: string; lastName: string; email: string };
  name: string;
  description: string;
  datasetType: string;
  accessType: 'private' | 'public' | 'shared';
  sharedWith: { userId: string; email: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatasetRequest {
  name: string;
  description: string;
  datasetType: string;
  accessType?: 'private' | 'public' | 'shared';
}

export interface UpdateDatasetRequest {
  name?: string;
  description?: string;
  datasetType?: string;
  accessType?: 'private' | 'public' | 'shared';
  sharedWith?: { userId: string; email: string }[];
}

export const datasetsAPI = {
  // Get all datasets for the current user
  async getAll(): Promise<DatasetResponse[]> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/datasets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Search datasets
  async search(query: string): Promise<DatasetResponse[]> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(
      `${API_BASE_URL}/datasets/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  // Get a specific dataset
  async getById(id: string): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/datasets/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Create a new dataset
  async create(data: CreateDatasetRequest): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_BASE_URL}/datasets`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Update a dataset
  async update(
    id: string,
    data: UpdateDatasetRequest,
  ): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.patch(`${API_BASE_URL}/datasets/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Delete a dataset
  async delete(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await axios.delete(`${API_BASE_URL}/datasets/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Upload assets to a dataset
  async uploadAssets(datasetId: string, files: File[]): Promise<any[]> {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();

    // Add all files to FormData
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/datasets/${datasetId}/assets`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  // Admin-only methods for managing dataset access
  async shareWithUsers(datasetId: string, userIds: string[]): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${API_BASE_URL}/datasets/${datasetId}/share`,
      { userIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },

  async makePublic(datasetId: string): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.patch(
      `${API_BASE_URL}/datasets/${datasetId}/make-public`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },

  async makePrivate(datasetId: string): Promise<DatasetResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.patch(
      `${API_BASE_URL}/datasets/${datasetId}/make-private`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },
};
