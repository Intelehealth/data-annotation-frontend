import { jsonApi } from '../api';

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
      options?: string[];
      instructions?: string;
    }[];
  }) => {
    const response = await jsonApi.post('/field-selection', data);
    return response.data;
  },

  // Get field selection configuration for a CSV import
  getFieldSelection: async (csvImportId: string) => {
    const response = await jsonApi.get(`/field-selection/${csvImportId}`);
    return response.data;
  },

  // Start annotation process
  startAnnotation: async (csvImportId: string) => {
    const response = await jsonApi.post(
      `/field-selection/${csvImportId}/start`,
    );
    return response.data;
  },

  // Get annotation progress
  getAnnotationProgress: async (csvImportId: string) => {
    const response = await jsonApi.get(
      `/field-selection/${csvImportId}/progress`,
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

  // Dataset-level configuration methods
  saveDatasetFieldConfig: async (data: {
    datasetId: string;
    annotationFields: {
      csvColumnName: string;
      fieldName: string;
      fieldType: 'text' | 'number' | 'markdown' | 'image' | 'audio';
      isRequired: boolean;
      isAnnotationField: boolean;
      isPrimaryKey?: boolean;
      isVisible?: boolean;
      options?: string[];
      isNewColumn?: boolean;
      newColumnId?: string;
    }[];
    annotationLabels: {
      name: string;
      color: string;
      description?: string;
      hotkey?: string;
    }[];
    newColumns: {
      id: string;
      columnName: string;
      columnType: 'text' | 'number' | 'select' | 'selectrange' | 'multiselect';
      isRequired: boolean;
      defaultValue?: string;
      options?: string[];
      placeholder?: string;
      validation?: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
      };
    }[];
  }) => {
    const response = await jsonApi.post(
      `/field-selection/dataset/${data.datasetId}`,
      {
        annotationFields: data.annotationFields,
        annotationLabels: data.annotationLabels,
        newColumns: data.newColumns,
      },
    );
    return response.data;
  },

  getDatasetFieldConfig: async (datasetId: string) => {
    const response = await jsonApi.get(`/field-selection/dataset/${datasetId}`);
    return response.data;
  },

  checkDatasetFieldConfig: async (
    datasetId: string,
  ): Promise<{ hasConfig: boolean; config?: any }> => {
    const response = await jsonApi.get(
      `/field-selection/dataset/${datasetId}/check`,
    );
    return response.data;
  },

  getDatasetCSVImports: async (datasetId: string) => {
    const response = await jsonApi.get(
      `/csv-processing/dataset/${datasetId}/imports`,
    );
    return response.data;
  },
};
