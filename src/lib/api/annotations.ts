import { jsonApi } from '../api';

// ============================================
// INTERFACES
// ============================================

export interface ImageMetadata {
  url: string;
  caption?: string;
  isSelected: boolean;
  order: number;
}

export interface SaveImageMetadataRequest {
  datasetId: string;
  rowIndex: number;
  fieldName: string;
  images: ImageMetadata[];
  isAiGenerated?: boolean;
}

export interface AnnotationResponse {
  _id: string;
  datasetId: string;
  rowIndex: number;
  fieldName: string;
  images: ImageMetadata[];
  userId?: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationStats {
  totalAnnotations: number;
  annotatedRows: number;
  annotationsByField: Record<string, number>;
  selectedImagesCount: number;
}

// ============================================
// ANNOTATIONS API
// ============================================

export class AnnotationsAPI {
  /**
   * Save or update image metadata annotations for a specific row and field
   */
  static async saveImageMetadata(
    data: SaveImageMetadataRequest
  ): Promise<AnnotationResponse> {
    try {
      const response = await jsonApi.post('/annotations/image-metadata', data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to save image metadata:', error);
      throw error;
    }
  }

  /**
   * Get all image metadata annotations for a dataset
   */
  static async getDatasetAnnotations(
    datasetId: string
  ): Promise<AnnotationResponse[]> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get dataset annotations:', error);
      throw error;
    }
  }

  /**
   * Get image metadata annotations for a specific field in a dataset
   */
  static async getFieldAnnotations(
    datasetId: string,
    fieldName: string
  ): Promise<AnnotationResponse[]> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}/field/${fieldName}`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get field annotations:', error);
      throw error;
    }
  }

  /**
   * Get image metadata annotations for a specific row in a dataset
   */
  static async getRowAnnotations(
    datasetId: string,
    rowIndex: number
  ): Promise<AnnotationResponse[]> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}/row/${rowIndex}`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get row annotations:', error);
      throw error;
    }
  }

  /**
   * Get image metadata annotation for a specific row and field
   */
  static async getRowFieldAnnotation(
    datasetId: string,
    rowIndex: number,
    fieldName: string
  ): Promise<AnnotationResponse | null> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}/row/${rowIndex}/field/${fieldName}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No annotation found
      }
      console.error('❌ Failed to get row field annotation:', error);
      throw error;
    }
  }

  /**
   * Delete image metadata annotation for a specific row and field
   */
  static async deleteAnnotation(
    datasetId: string,
    rowIndex: number,
    fieldName: string
  ): Promise<void> {
    try {
      await jsonApi.delete(
        `/annotations/image-metadata/dataset/${datasetId}/row/${rowIndex}/field/${fieldName}`
      );
    } catch (error) {
      console.error('❌ Failed to delete annotation:', error);
      throw error;
    }
  }

  /**
   * Get annotation statistics for a dataset
   */
  static async getDatasetStats(datasetId: string): Promise<AnnotationStats> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get dataset stats:', error);
      throw error;
    }
  }

  /**
   * Bulk save annotations for multiple rows
   */
  static async bulkSaveAnnotations(
    annotations: SaveImageMetadataRequest[]
  ): Promise<AnnotationResponse[]> {
    try {
      const response = await jsonApi.post(
        '/annotations/image-metadata/bulk',
        { annotations }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to bulk save annotations:', error);
      throw error;
    }
  }

  /**
   * Check if annotation exists for a specific row and field
   */
  static async hasAnnotation(
    datasetId: string,
    rowIndex: number,
    fieldName: string
  ): Promise<boolean> {
    try {
      const annotation = await this.getRowFieldAnnotation(
        datasetId,
        rowIndex,
        fieldName
      );
      return annotation !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get annotations progress for dataset
   */
  static async getAnnotationProgress(datasetId: string): Promise<{
    totalRows: number;
    annotatedRows: number;
    progressPercentage: number;
    fieldProgress: Record<string, { annotated: number; total: number }>;
  }> {
    try {
      const response = await jsonApi.get(
        `/annotations/image-metadata/dataset/${datasetId}/progress`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get annotation progress:', error);
      throw error;
    }
  }
}

