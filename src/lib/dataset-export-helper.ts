/**
 * Dataset Export Helper Functions
 * Handles dataset-level CSV exports with proper data validation and debugging
 */

import { ExportData, generateCsvContent, downloadCsv } from './csv-export-helper';
import { DatasetMergedRowsAPI, DatasetMergedRowsData } from './api/dataset-merged-rows';
import { datasetsAPI } from './api/datasets';

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
}

export interface AnnotationConfig {
  annotationFields: AnnotationField[];
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
  console.log('🔍 [Dataset Export] Starting selected columns export...');
  console.log('📊 [Dataset Export] Dataset data:', {
    totalRows: datasetData.totalRows,
    mergedRowsLength: datasetData.mergedRows?.length,
    csvImportsCount: datasetData.csvImports?.length
  });

  if (!datasetData) {
    console.error('❌ [Dataset Export] Cannot export: missing dataset data');
    return;
  }

  try {
    // Get all rows with their data
    const allRows = datasetData.mergedRows || [];
    console.log('📋 [Dataset Export] All rows for export:', allRows.length);

    // Validate row count
    if (allRows.length !== datasetData.totalRows) {
      console.warn('⚠️ [Dataset Export] Row count mismatch:', {
        mergedRowsLength: allRows.length,
        totalRows: datasetData.totalRows
      });
    }

    // Get selected fields (metadata fields + annotation fields)
  const selectedFields = annotationConfig?.annotationFields.filter(
      (field) => !field.isAnnotationField || field.isAnnotationField || field.isNewColumn
    ) || [];

    console.log('🏷️ [Dataset Export] Selected fields:', selectedFields.map(f => ({
      csvColumnName: f.csvColumnName,
      fieldName: f.fieldName,
      isAnnotationField: f.isAnnotationField,
      isNewColumn: f.isNewColumn
    })));

    console.log('🔍 [Dataset Export] Selected fields count:', selectedFields.length);
    console.log('🔍 [Dataset Export] Selected fields details:', {
      metadataFields: selectedFields.filter(f => !f.isAnnotationField && !f.isNewColumn).length,
      annotationFields: selectedFields.filter(f => f.isAnnotationField || f.isNewColumn).length,
      totalSelected: selectedFields.length
    });

    // Prepare export data
    const exportRows: Record<string, any>[] = [];
    const headers: string[] = [];

    // Build headers from selected fields
    selectedFields.forEach((field) => {
      if (!field.isAnnotationField && !field.isNewColumn) {
        headers.push(field.csvColumnName);
      } else if (field.isAnnotationField || field.isNewColumn) {
        headers.push(field.fieldName);
      }
    });

    console.log('📝 [Dataset Export] Headers:', headers);

    // Build rows with detailed logging
    console.log('🔄 [Dataset Export] Building export rows...');
    for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      const row = allRows[rowIndex];
      const exportedRow: Record<string, any> = {};

      if (rowIndex < 3) {
        console.log(`📄 [Dataset Export] Processing row ${rowIndex}:`, {
          rowIndex: row.rowIndex,
          dataKeys: Object.keys(row.data || {}),
          dataSample: Object.keys(row.data || {}).slice(0, 5)
        });
      }

      // Add selected fields
      selectedFields.forEach((field) => {
        if (!field.isAnnotationField && !field.isNewColumn) {
          // Original CSV column - check if it exists in stored data
          if (row.data && row.data.hasOwnProperty(field.csvColumnName)) {
            exportedRow[field.csvColumnName] = row.data[field.csvColumnName] || '';
          } else {
            // Column was filtered out during processing, include as empty
            exportedRow[field.csvColumnName] = '';
          }
        } else if (field.isAnnotationField || field.isNewColumn) {
          // New annotation column
          if (row.data && row.data.hasOwnProperty(field.fieldName)) {
            exportedRow[field.fieldName] = row.data[field.fieldName] || '';
          } else {
            exportedRow[field.fieldName] = '';
          }
        }
      });

      exportRows.push(exportedRow);
    }

    console.log('✅ [Dataset Export] Export rows built:', {
      totalExportRows: exportRows.length,
      expectedRows: allRows.length,
      headersCount: headers.length
    });

    const exportData: ExportData = {
      headers,
      rows: exportRows,
    };

    // Generate clean filename with IST timestamp
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
    
    // Fetch dataset name from dataset API
    let datasetName = 'dataset';
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      datasetName = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (error) {
      console.warn('Could not fetch dataset name, using fallback:', error);
    }
    
    const cleanFileName = `selected_columns_${datasetName}_${istTime}.csv`;

    console.log('💾 [Dataset Export] Exporting to file:', cleanFileName);

    // Generate CSV content directly
    const csvContent = generateCsvContent(exportData, { cleanHtml: options.cleanHtml ?? true });
    
    // Download CSV with correct row count
    downloadCsv(csvContent, cleanFileName, {
      showSuccess: options.showSuccess ?? true,
      onSuccess: (message) => {
        console.log('🎉 [Dataset Export] Selected columns CSV exported successfully');
        if (options.onSuccess) {
          options.onSuccess(message);
        }
      },
      onError: (error) => {
        console.error('❌ [Dataset Export] Error exporting selected columns CSV:', error);
        if (options.onError) {
          options.onError(error);
        }
      },
      actualRowCount: exportRows.length, // Pass the actual row count
    });
  } catch (error) {
    console.error('❌ [Dataset Export] Error exporting selected columns CSV:', error);
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
  console.log('🔍 [Dataset Export] Starting all columns export...');
  console.log('📊 [Dataset Export] Dataset data:', {
    totalRows: datasetData.totalRows,
    mergedRowsLength: datasetData.mergedRows?.length,
    csvImportsCount: datasetData.csvImports?.length
  });

  if (!datasetData) {
    console.error('❌ [Dataset Export] Cannot export: missing dataset data');
    return;
  }

  try {
    // Get all rows with their data
    const allRows = datasetData.mergedRows || [];
    console.log('📋 [Dataset Export] All rows for export:', allRows.length);

    // Validate row count
    if (allRows.length !== datasetData.totalRows) {
      console.warn('⚠️ [Dataset Export] Row count mismatch:', {
        mergedRowsLength: allRows.length,
        totalRows: datasetData.totalRows
      });
    }

    // Get all columns from dataset.schema.ts availableColumns
    let allColumns: string[] = [];
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      if (dataset && (dataset as any).availableColumns) {
        allColumns = (dataset as any).availableColumns.map((col: any) => col.name);
      }
    } catch (error) {
      console.warn('Could not fetch dataset availableColumns, falling back to row data:', error);
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

    console.log('🏷️ [Dataset Export] All columns from dataset.schema.ts:', allColumns);

    // Prepare export data - use columns exactly as they exist in the schema
    const exportRows: Record<string, any>[] = [];
    const headers: string[] = [...allColumns];

    console.log('📝 [Dataset Export] Headers:', headers);

    // Build rows with detailed logging
    console.log('🔄 [Dataset Export] Building export rows...');
    for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      const row = allRows[rowIndex];
      const exportedRow: Record<string, any> = {};
      
      if (rowIndex < 3) {
        console.log(`📄 [Dataset Export] Processing row ${rowIndex}:`, {
          rowIndex: row.rowIndex,
          dataKeys: Object.keys(row.data || {}),
          dataSample: Object.keys(row.data || {}).slice(0, 5)
        });
      }

      // Add all columns (original + annotation) without duplication
      headers.forEach((columnName) => {
        if (row.data && row.data.hasOwnProperty(columnName)) {
          exportedRow[columnName] = row.data[columnName] || '';
        } else {
          exportedRow[columnName] = '';
        }
      });

      exportRows.push(exportedRow);
    }

    console.log('✅ [Dataset Export] Export rows built:', {
      totalExportRows: exportRows.length,
      expectedRows: allRows.length,
      headersCount: headers.length
    });

    const exportData: ExportData = {
      headers,
      rows: exportRows,
    };

    // Generate clean filename with IST timestamp
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
    
    // Fetch dataset name from dataset API
    let datasetName = 'dataset';
    try {
      const dataset = await datasetsAPI.getById(datasetId);
      datasetName = dataset.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (error) {
      console.warn('Could not fetch dataset name, using fallback:', error);
    }
    
    const cleanFileName = `all_columns_${datasetName}_${istTime}.csv`;

    console.log('💾 [Dataset Export] Exporting to file:', cleanFileName);

    // Generate CSV content directly
    const csvContent = generateCsvContent(exportData, { cleanHtml: options.cleanHtml ?? true });
    
    // Download CSV with correct row count
    downloadCsv(csvContent, cleanFileName, {
      showSuccess: options.showSuccess ?? true,
      onSuccess: (message) => {
        console.log('🎉 [Dataset Export] All columns CSV exported successfully');
        if (options.onSuccess) {
          options.onSuccess(message);
        }
      },
      onError: (error) => {
        console.error('❌ [Dataset Export] Error exporting all columns CSV:', error);
        if (options.onError) {
          options.onError(error);
        }
      },
      actualRowCount: exportRows.length, // Pass the actual row count
    });
  } catch (error) {
    console.error('❌ [Dataset Export] Error exporting all columns CSV:', error);
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
