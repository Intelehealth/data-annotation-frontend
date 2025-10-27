/**
 * Dataset Export Helper Functions
 * Handles dataset-level CSV exports with proper data validation and debugging
 */

import { ExportData, generateCsvContent, downloadCsv } from './csv-export-helper';
import { DatasetMergedRowsData } from './api/dataset-merged-rows';
import { datasetsAPI } from './api/datasets';
import { AnnotationsAPI } from './api/annotations';

export interface DatasetExportOptions {
  cleanHtml?: boolean;
  showSuccess?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface AnnotationField {
  csvColumnName: string;
  fieldName: string;
  isAnnotationField: boolean;
  isNewColumn: boolean;
  fieldType?: string;
}

export interface AnnotationConfig {
  annotationFields: AnnotationField[];
}

/**
 * Fetch image metadata from annotations API and format as structured string
 * Returns format: "url1,caption1\nurl2,caption2\nurl3,caption3"
 * Only exports images where isSelected === true
 * Each image is on a new line with format: url,caption
 */
async function getImageMetadataFormatted(
  datasetId: string,
  rowIndex: number,
  fieldName: string
): Promise<string> {
  try {
    // Get all annotations for this specific row
    const annotations = await AnnotationsAPI.getRowAnnotations(datasetId, rowIndex);
    
    // Find the annotation for this specific field
    const imageAnnotation = annotations.find(ann => ann.fieldName === fieldName);
    
    if (!imageAnnotation || !imageAnnotation.images || imageAnnotation.images.length === 0) {
      return '';
    }
    
    // Filter only selected images and sort by order
    const selectedImages = imageAnnotation.images
      .filter(img => img.isSelected)
      .sort((a, b) => a.order - b.order);
    
    // Format each image as: "url,caption" and join with newline
    const formattedParts = selectedImages.map((img) => [
      img.url || '',
      (img.caption || '').replace(/,/g, '\\,').replace(/\n/g, '\\n') // Escape commas and newlines in captions
    ].join(','));
    
    return formattedParts.join('\n');
    
  } catch (error) {
    // If error is 404 or similar, just return empty string (no annotation exists yet)
    return '';
  }
}

/**
 * Export selected columns (metadata + annotation fields) to CSV
 */
export async function exportSelectedColumnsToCSV(
  datasetData: DatasetMergedRowsData,
  annotationConfig: AnnotationConfig,
  datasetId: string,
  options: DatasetExportOptions = {}
): Promise<void> {
  if (!datasetData) {
    return;
  }

  try {
    const allRows = datasetData.mergedRows || [];

    const selectedFields = annotationConfig?.annotationFields.filter(
      (field) => !field.isAnnotationField || field.isAnnotationField || field.isNewColumn
    ) || [];

    const exportRows: Record<string, any>[] = [];
    const headers: string[] = [];
    const metadataHeaders: string[] = [];

    // Build headers from selected fields
    selectedFields.forEach((field) => {
      // Check if this is an image field (regardless of annotation status)
      if (field.fieldType === 'image') {
        // Add original field name to main headers
        headers.push(field.csvColumnName || field.fieldName);
        // Add metadata column name to metadata headers (will be added at the end)
        metadataHeaders.push(`${field.fieldName}_metadata`);
      } else if (!field.isAnnotationField && !field.isNewColumn) {
        headers.push(field.csvColumnName);
      } else if (field.isAnnotationField || field.isNewColumn) {
        headers.push(field.fieldName);
      }
    });

    // Add metadata headers at the end
    headers.push(...metadataHeaders);

    // Build rows with annotation data
    for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      const row = allRows[rowIndex];
      const exportedRow: Record<string, any> = {};

      // Process each selected field
      for (const field of selectedFields) {
        // Check if this is an image field (regardless of annotation status)
        if (field.fieldType === 'image') {
          // Keep original data unchanged
          const originalColumnName = field.csvColumnName || field.fieldName;
          if (row.data && row.data.hasOwnProperty(originalColumnName)) {
            exportedRow[originalColumnName] = row.data[originalColumnName] || '';
          } else {
            exportedRow[originalColumnName] = '';
          }
          
          // Add separate metadata column with annotation data
          const imageMetadata = await getImageMetadataFormatted(datasetId, row.rowIndex, field.fieldName);
          exportedRow[`${field.fieldName}_metadata`] = imageMetadata;
        } else if (!field.isAnnotationField && !field.isNewColumn) {
          // Original CSV column
          if (row.data && row.data.hasOwnProperty(field.csvColumnName)) {
            exportedRow[field.csvColumnName] = row.data[field.csvColumnName] || '';
          } else {
            exportedRow[field.csvColumnName] = '';
          }
        } else if (field.isAnnotationField || field.isNewColumn) {
          // Regular annotation column
          if (row.data && row.data.hasOwnProperty(field.fieldName)) {
            exportedRow[field.fieldName] = row.data[field.fieldName] || '';
          } else {
            exportedRow[field.fieldName] = '';
          }
        }
      }

      exportRows.push(exportedRow);
    }

    const exportData: ExportData = {
      headers,
      rows: exportRows,
    };

    const istTime = new Date().toLocaleString('en-CA', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/[, ]/g, '_').replace(/:/g, '-');
    
    let datasetName = 'dataset';
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      datasetName = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (error) {
      // Using fallback dataset name - could notify via options.onError if needed
      if (options.onError) {
        options.onError('Using fallback dataset name for export');
      }
    }
    
    const cleanFileName = `selected_columns_${datasetName}_${istTime}.csv`;

    const csvContent = generateCsvContent(exportData, { cleanHtml: options.cleanHtml ?? true });
    
    downloadCsv(csvContent, cleanFileName, {
      showSuccess: options.showSuccess ?? true,
      onSuccess: (message) => {
        if (options.onSuccess) {
          options.onSuccess(message);
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
      },
      actualRowCount: exportRows.length,
    });
  } catch (error) {
    if (options.onError) {
      options.onError(`Failed to export selected columns CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Export all columns (original CSV + annotation fields) to CSV
 */
export async function exportAllColumnsToCSV(
  datasetData: DatasetMergedRowsData,
  annotationConfig: AnnotationConfig,
  datasetId: string,
  options: DatasetExportOptions = {}
): Promise<void> {
  if (!datasetData) {
    return;
  }

  try {
    const allRows = datasetData.mergedRows || [];

    // Get all columns from dataset schema or fallback to row data
    let allColumns: string[] = [];
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      if (dataset && (dataset as any).availableColumns) {
        allColumns = (dataset as any).availableColumns.map((col: any) => col.name);
      }
    } catch (error) {
      // Fallback: get columns from row data
      allRows.forEach(row => {
        if (row.data) {
          Object.keys(row.data).forEach(key => {
            if (!allColumns.includes(key)) {
              allColumns.push(key);
            }
          });
        }
      });
    }

    const exportRows: Record<string, any>[] = [];
    const headers: string[] = [];
    const metadataHeaders: string[] = [];

    // Build headers, expanding image fields
    for (const columnName of allColumns) {
      const isImageField = annotationConfig.annotationFields.some(f => 
        f.fieldName === columnName && f.fieldType === 'image'
      );
      
      if (isImageField) {
        // Add original column name to main headers
        headers.push(columnName);
        // Add metadata column name to metadata headers (will be added at the end)
        metadataHeaders.push(`${columnName}_metadata`);
      } else {
        headers.push(columnName);
      }
    }

    // Add metadata headers at the end
    headers.push(...metadataHeaders);

    // Build rows with annotation data
    for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      const row = allRows[rowIndex];
      const exportedRow: Record<string, any> = {};

      // Process all columns
      for (const columnName of allColumns) {
        // Check if this is an image field
        const isImageField = annotationConfig.annotationFields.some(f => 
          f.fieldName === columnName && f.fieldType === 'image'
        );
        
        if (isImageField) {
          // Keep original data unchanged
          if (row.data && row.data.hasOwnProperty(columnName)) {
            exportedRow[columnName] = row.data[columnName] || '';
          } else {
            exportedRow[columnName] = '';
          }
          
          // Add separate metadata column with annotation data
          const imageMetadata = await getImageMetadataFormatted(datasetId, row.rowIndex, columnName);
          exportedRow[`${columnName}_metadata`] = imageMetadata;
        } else {
          // Regular column
          if (row.data && row.data.hasOwnProperty(columnName)) {
            exportedRow[columnName] = row.data[columnName] || '';
          } else {
            exportedRow[columnName] = '';
          }
        }
      }

      exportRows.push(exportedRow);
    }

    const exportData: ExportData = {
      headers,
      rows: exportRows,
    };

    const istTime = new Date().toLocaleString('en-CA', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/[, ]/g, '_').replace(/:/g, '-');
    
    let datasetName = 'dataset';
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      datasetName = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (error) {
      // Using fallback dataset name - could notify via options.onError if needed
      if (options.onError) {
        options.onError('Using fallback dataset name for export');
      }
    }
    
    const cleanFileName = `all_columns_${datasetName}_${istTime}.csv`;

    const csvContent = generateCsvContent(exportData, { cleanHtml: options.cleanHtml ?? true });
    
    downloadCsv(csvContent, cleanFileName, {
      showSuccess: options.showSuccess ?? true,
      onSuccess: (message) => {
        if (options.onSuccess) {
          options.onSuccess(message);
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
      },
      actualRowCount: exportRows.length,
    });
  } catch (error) {
    if (options.onError) {
      options.onError(`Failed to export all columns CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Validate dataset data before export
 */
export function validateDatasetData(datasetData: DatasetMergedRowsData): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!datasetData) {
    issues.push('Dataset data is missing');
  } else {
    if (!datasetData.mergedRows || datasetData.mergedRows.length === 0) {
      issues.push('No merged rows found');
    }

    if (datasetData.totalRows !== datasetData.mergedRows?.length) {
      issues.push(`Row count mismatch: totalRows=${datasetData.totalRows}, mergedRows.length=${datasetData.mergedRows?.length}`);
    }

    if (!datasetData.csvImports || datasetData.csvImports.length === 0) {
      issues.push('No CSV imports found');
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
