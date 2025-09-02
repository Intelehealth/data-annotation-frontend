import { jsonApi } from '../api';

export interface CSVRowData {
  rowIndex: number;
  data: Record<string, any>;
  processed: boolean;
  errors?: string[];
}

export interface CSVImport {
  _id: string;
  datasetId: string;
  projectId: string;
  userId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  totalRows: number;
  processedRows: number;
  status: string;
  columns?: string[];
  columnMappings: any[];
  rowData: CSVRowData[];
  metadata: {
    delimiter: string;
    encoding: string;
    hasHeader: boolean;
    totalColumns: number;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AnnotationField {
  csvColumnName: string;
  fieldName: string;
  fieldType: 'text' | 'image' | 'audio';
  isRequired: boolean;
  isMetadataField: boolean;
  isAnnotationField: boolean;
  options?: string[];
  instructions?: string;
}

export interface AnnotationConfig {
  _id: string;
  csvImportId: string;
  projectId: string;
  userId: string;
  annotationFields: AnnotationField[];
  rowAnnotations: any[];
  totalRows: number;
  completedRows: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class CSVImportsAPI {
  // Get CSV import by ID with full data including rowData
  static async findOne(id: string): Promise<CSVImport> {
    const response = await jsonApi.get(`/csv-processing/data/${id}`);
    return response.data;
  }

  // Get CSV import status (same as findOne since we're using the status endpoint)
  static async getStatus(id: string): Promise<CSVImport> {
    return this.findOne(id);
  }

  // Get CSV columns
  static async getColumns(id: string): Promise<{ columns: string[] }> {
    const response = await jsonApi.get(`/csv-processing/imports/${id}/columns`);
    return response.data;
  }

  // Get annotation config for CSV import
  static async getAnnotationConfig(
    csvImportId: string,
  ): Promise<AnnotationConfig> {
    const response = await jsonApi.get(
      `/csv-processing/field-selection/${csvImportId}`,
    );
    return response.data;
  }

  // Get annotation progress
  static async getAnnotationProgress(csvImportId: string): Promise<{
    totalRows: number;
    completedRows: number;
    pendingRows: number;
    inProgressRows: number;
    status: string;
  }> {
    const response = await jsonApi.get(
      `/csv-processing/field-selection/${csvImportId}/progress`,
    );
    return response.data;
  }
}
