import { jsonApi } from '../api';

export interface CSVRowData {
  rowIndex: number;
  data: Record<string, any>;
  processed: boolean;
  errors?: string[];
  // NEW: Progress tracking fields
  completed?: boolean;
  completedAt?: string; // ISO string date
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


  // Get CSV imports by dataset ID
  static async getByDataset(datasetId: string): Promise<CSVImport[]> {
    const response = await jsonApi.get(
      `/csv-processing/dataset/${datasetId}/imports`,
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

}
