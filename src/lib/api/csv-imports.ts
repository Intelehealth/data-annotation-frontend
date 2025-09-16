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
  isNewColumn?: boolean; // true if this is a new column, not from CSV  
  newColumnId?: string; // Reference to NewColumn if isNewColumn is true
}

export interface AnnotationConfig {
  _id: string;
  csvImportId: string;
  userId?: string;
  annotationFields: AnnotationField[];
  annotationLabels?: any[]; // Add annotation labels
  rowAnnotations: any[];
  totalRows: number;
  completedRows: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatchAnnotationConfigRequest {
  annotationFields?: AnnotationField[];
  annotationLabels?: any[];
  status?: string;
}

export interface PatchRowAnnotationRequest {
  annotations: Record<string, any>;
  confidence?: number;
  notes?: string;
  status?: string;
}

export interface PatchAnnotationResponse {
  success: boolean;
  data: any;
  updatedFields: number;
  changedFields: string[];
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

  // Get CSV imports by dataset ID
  static async getByDataset(datasetId: string): Promise<CSVImport[]> {
    const response = await jsonApi.get(
      `/csv-processing/dataset/${datasetId}/imports`,
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

  // Delete CSV import
  static async deleteCSVImport(
    datasetId: string,
    csvImportId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await jsonApi.delete(
      `/datasets/${datasetId}/csv-imports/${csvImportId}`,
    );
    return response.data;
  }

  // PATCH Methods for Partial Updates
  static async patchAnnotationConfig(
    csvImportId: string,
    patchData: PatchAnnotationConfigRequest,
  ): Promise<PatchAnnotationResponse> {
    const response = await jsonApi.patch(
      `/csv-processing/field-selection/${csvImportId}`,
      patchData,
    );
    return response.data;
  }

  static async patchRowAnnotation(
    csvImportId: string,
    rowIndex: number,
    patchData: PatchRowAnnotationRequest,
  ): Promise<PatchAnnotationResponse> {
    const response = await jsonApi.patch(
      `/csv-processing/field-selection/${csvImportId}/row/${rowIndex}`,
      patchData,
    );
    return response.data;
  }

  static async patchAnnotationField(
    csvImportId: string,
    fieldIndex: number,
    patchData: PatchAnnotationConfigRequest,
  ): Promise<PatchAnnotationResponse> {
    const response = await jsonApi.patch(
      `/csv-processing/field-selection/${csvImportId}/field/${fieldIndex}`,
      patchData,
    );
    return response.data;
  }

  // Direct CSV row data update method
  static async patchCSVRowData(
    csvImportId: string,
    rowIndex: number,
    updatedData: Record<string, any>,
  ): Promise<PatchAnnotationResponse> {
    const response = await jsonApi.patch(
      `/csv-processing/data/${csvImportId}/row/${rowIndex}`,
      { data: updatedData },
    );
    return response.data;
  }

  // Utility method to create partial update objects
  static createPartialUpdate<T extends Record<string, any>>(updates: Partial<T>): Partial<T> {
    // Remove undefined values to ensure only changed fields are sent
    const cleanedUpdates: Partial<T> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof T] !== undefined) {
        cleanedUpdates[key as keyof T] = updates[key as keyof T];
      }
    });
    return cleanedUpdates;
  }
}
