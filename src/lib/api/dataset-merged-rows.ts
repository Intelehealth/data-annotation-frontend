import { jsonApi } from '../api';

export interface DatasetMergedRow {
  rowIndex: number;
  data: Record<string, any>;
  processed: boolean;
  completed?: boolean;
  completedAt?: Date;
}

export interface CSVInfo {
  csvImportId: string;
  fileName: string;
  originalCsvRowIndex: number;
}

export interface RowWithCSVInfo {
  rowIndex: number;
  data: Record<string, any>;
  processed: boolean;
  completed?: boolean;
  completedAt?: Date;
  csvInfo?: CSVInfo | null;
}

export interface DatasetRowsResponse {
  rows: RowWithCSVInfo[];
  totalRows: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

export interface AnnotationProgress {
  totalRows: number;
  completedRows: number;
  pendingRows: number;
  progressPercentage: number;
  csvBreakdown: {
    fileName: string;
    totalRows: number;
    completedRows: number;
    progressPercentage: number;
  }[];
}

export interface DatasetMergedRowsData {
  _id: string;
  datasetId: string;
  userId: string;
  mergedRows: DatasetMergedRow[];
  csvImports: {
    csvImportId: string;
    fileName: string;
    totalRows: number;
    startRowIndex: number;
    endRowIndex: number;
    uploadedAt: string;
  }[];
  totalRows: number;
  totalCSVFiles: number;
  lastRowIndex: number;
  status: string;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatchRowDataRequest {
  data: Record<string, any>;
}

export interface PatchRowDataResponse {
  success: boolean;
  data: any;
  updatedFields: number;
  changedFields: string[];
  updatedAt: string;
}

export interface MarkRowCompletedRequest {
  datasetId: string;
  rowIndex: number;
}

export class DatasetMergedRowsAPI {
  /**
   * Get dataset merged rows data
   */
  static async getDatasetData(datasetId: string): Promise<DatasetMergedRowsData> {
    try {
      console.log(`Getting dataset data for ${datasetId}`);
      const response = await jsonApi.get(`/dataset-merged-rows/dataset/${datasetId}/debug`);
      console.log('Dataset data response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting dataset data:', error);
      throw error;
    }
  }

  /**
   * Get paginated dataset rows
   */
  static async getDatasetRows(
    datasetId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<DatasetRowsResponse> {
    const response = await jsonApi.get(
      `/dataset-merged-rows/dataset/${datasetId}/rows?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Get specific row by index
   */
  static async getRowByIndex(
    datasetId: string,
    rowIndex: number
  ): Promise<RowWithCSVInfo | null> {
    const response = await jsonApi.get(
      `/dataset-merged-rows/dataset/${datasetId}/row/${rowIndex}`
    );
    return response.data;
  }

  /**
   * Get annotation progress for dataset
   */
  static async getAnnotationProgress(datasetId: string): Promise<AnnotationProgress> {
    const response = await jsonApi.get(
      `/dataset-merged-rows/dataset/${datasetId}/progress`
    );
    return response.data;
  }

  /**
   * Mark row as completed
   */
  static async markRowCompleted(
    datasetId: string,
    rowIndex: number
  ): Promise<void> {
    try {
      console.log(`Marking row ${rowIndex} as completed for dataset ${datasetId}`);
      await jsonApi.patch('/dataset-merged-rows/mark-completed', {
        datasetId,
        rowIndex,
      });
      console.log('Row marked as completed successfully');
    } catch (error) {
      console.error('Error marking row as completed:', error);
      throw error;
    }
  }

  /**
   * Update row data (for new column values)
   */
  static async patchRowData(
    datasetId: string,
    rowIndex: number,
    data: Record<string, any>
  ): Promise<PatchRowDataResponse> {
    try {
      console.log(`Patching row data for dataset ${datasetId}, row ${rowIndex}:`, data);
      const response = await jsonApi.patch(
        `/dataset-merged-rows/dataset/${datasetId}/row/${rowIndex}`,
        { data }
      );
      console.log('Patch response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching row data:', error);
      throw error;
    }
  }

  /**
   * Check if dataset has merged rows
   */
  static async hasMergedRows(datasetId: string): Promise<boolean> {
    try {
      const data = await this.getDatasetData(datasetId);
      return data.totalRows > 0;
    } catch (error) {
      console.error('Error checking merged rows:', error);
      return false;
    }
  }

  /**
   * Get detailed progress with row completion statuses
   */
  static async getDetailedProgress(datasetId: string): Promise<{
    totalRows: number;
    completedRows: number;
    pendingRows: number;
    progressPercentage: number;
    lastViewedRow: number;
    rowStatuses: {
      rowIndex: number;
      completed: boolean;
      completedAt?: string;
    }[];
  }> {
    try {
      // Get progress from field-selection API
      const progressResponse = await jsonApi.get(`/field-selection/dataset/${datasetId}/progress`);
      const progress = progressResponse.data;
      
      // Get dataset data for row statuses
      const datasetData = await this.getDatasetData(datasetId);
      
      // Create row statuses from merged rows
      const rowStatuses = datasetData.mergedRows.map(row => ({
        rowIndex: row.rowIndex,
        completed: row.completed || false,
        completedAt: row.completedAt ? (
          row.completedAt instanceof Date 
            ? row.completedAt.toISOString() 
            : row.completedAt
        ) : undefined,
      }));

      return {
        totalRows: progress.totalRows || datasetData.totalRows,
        completedRows: progress.completedRows || 0,
        pendingRows: progress.pendingRows || datasetData.totalRows,
        progressPercentage: progress.totalRows > 0 ? (progress.completedRows / progress.totalRows) * 100 : 0,
        lastViewedRow: progress.lastViewedRow || 0,
        rowStatuses,
      };
    } catch (error) {
      console.error('Error getting detailed progress:', error);
      throw error;
    }
  }

  /**
   * Check if annotation can be resumed
   */
  static async canResumeAnnotation(datasetId: string): Promise<{
    canResume: boolean;
    lastViewedRow: number;
    completedRows: number;
    totalRows: number;
    progressPercentage: number;
  }> {
    try {
      const progress = await this.getDetailedProgress(datasetId);
      return {
        canResume: progress.completedRows > 0,
        lastViewedRow: progress.lastViewedRow,
        completedRows: progress.completedRows,
        totalRows: progress.totalRows,
        progressPercentage: progress.progressPercentage,
      };
    } catch (error) {
      console.error('Error checking resume capability:', error);
      return {
        canResume: false,
        lastViewedRow: 0,
        completedRows: 0,
        totalRows: 0,
        progressPercentage: 0,
      };
    }
  }

  /**
   * Update annotation progress (last viewed row + completed count)
   */
  static async updateAnnotationProgress(
    datasetId: string,
    lastViewedRow: number,
    completedRows: number
  ): Promise<void> {
    try {
      const response = await jsonApi.patch(`/field-selection/dataset/${datasetId}/progress`, {
        lastViewedRow,
        completedRows,
      });
      console.log('Dataset annotation progress updated:', response.data);
    } catch (error) {
      console.error('Error updating dataset annotation progress:', error);
      throw error;
    }
  }

  /**
   * Check if all rows are completed for a dataset
   */
  static async checkAllRowsCompleted(datasetId: string): Promise<{
    allCompleted: boolean;
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
  }> {
    try {
      const response = await jsonApi.get(
        `/dataset-merged-rows/dataset/${datasetId}/completion-status`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking completion status:', error);
      throw error;
    }
  }

  /**
   * Utility method to create partial update objects
   */
  static createPartialUpdate<T extends Record<string, any>>(updates: Partial<T>): Partial<T> {
    const cleanedUpdates: Partial<T> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof T] !== undefined) {
        cleanedUpdates[key as keyof T] = updates[key as keyof T];
      }
    });
    return cleanedUpdates;
  }
}
