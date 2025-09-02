import api from '../api';

// Types for CSV processing API
export interface CSVUploadResult {
  csvImportId: string;
  fileName: string;
  totalRows: number;
  columns: string[];
  status: string;
}

export interface CSVPreviewResult {
  columns: string[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  metadata: {
    delimiter: string;
    encoding: string;
    hasHeader: boolean;
    totalColumns: number;
  };
}

export interface ColumnMapping {
  csvColumnName: string;
  projectMetadataField: string;
  dataType: string;
  isRequired: boolean;
  defaultValue?: any;
}

export interface ColumnMappingResult {
  csvImportId: string;
  columnMappings: ColumnMapping[];
}

export interface AssetCreationResult {
  success: boolean;
  totalAssets: number;
  errors: string[];
}

export interface CSVImportStatus {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  columns: string[];
  columnMappings: ColumnMapping[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// CSV Processing API endpoints
export const csvProcessingAPI = {
  // Upload CSV file
  uploadCSV: async (
    datasetId: string,
    projectId: string,
    file: File,
  ): Promise<CSVUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const response = await api.post(`/csv-processing/upload/${datasetId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Preview CSV content
  previewCSV: async (csvImportId: string): Promise<CSVPreviewResult> => {
    const response = await api.get(`/csv-processing/preview/${csvImportId}`);
    return response.data;
  },

  // Map CSV columns to project metadata fields
  mapColumns: async (
    csvImportId: string,
    columnMappings: ColumnMapping[],
  ): Promise<ColumnMappingResult> => {
    const response = await api.post(`/csv-processing/map-columns/${csvImportId}`, {
      columnMappings,
    });
    return response.data;
  },

  // Validate and create assets from CSV
  validateAndCreateAssets: async (
    csvImportId: string,
  ): Promise<AssetCreationResult> => {
    const response = await api.post(`/csv-processing/validate-and-create/${csvImportId}`);
    return response.data;
  },

  // Get CSV import status
  getCSVImportStatus: async (csvImportId: string): Promise<CSVImportStatus> => {
    const response = await api.get(`/csv-processing/status/${csvImportId}`);
    return response.data;
  },
};
