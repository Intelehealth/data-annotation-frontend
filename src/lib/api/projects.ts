import api from '../api';

// Types for project API
export interface MetadataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface AnnotationLabel {
  name: string;
  type: 'bbox' | 'polygon' | 'point' | 'line' | 'text' | 'classification';
  color: string;
  description?: string;
  attributes?: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
    defaultValue?: any;
  }[];
}

export interface CreateProjectDto {
  name: string;
  description: string;
  schema: {
    metadataFields: MetadataField[];
    annotationLabels: AnnotationLabel[];
  };
}

export interface ProjectResponse {
  _id: string;
  userId: string;
  name: string;
  description: string;
  projectSchema: {
    metadataFields: MetadataField[];
    annotationLabels: AnnotationLabel[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Projects API endpoints
export const projectsAPI = {
  // Create a new project
  create: async (projectData: CreateProjectDto): Promise<ProjectResponse> => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Get all projects for the authenticated user
  getAll: async (): Promise<ProjectResponse[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Get a single project by ID
  getById: async (projectId: string): Promise<ProjectResponse> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Update a project
  update: async (
    projectId: string,
    projectData: Partial<CreateProjectDto>,
  ): Promise<ProjectResponse> => {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete a project (soft delete)
  delete: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  // Search projects
  search: async (searchTerm: string): Promise<ProjectResponse[]> => {
    const response = await api.get(
      `/projects/search?q=${encodeURIComponent(searchTerm)}`,
    );
    return response.data;
  },
};
