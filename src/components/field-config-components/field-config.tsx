'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fieldSelectionAPI } from '@/lib/api/field-config';
import { datasetsAPI } from '@/lib/api/datasets';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSVColumnsDisplay } from './csv-columns-display';
import { useToast } from '@/components/ui/toast';

interface NewColumn {
  id: string;
  columnName: string; // e.g., "Review Notes", "Quality Score"
  columnType: 'text' | 'number' | 'select' | 'textarea' | 'rating';
  isRequired: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface AnnotationField {
  id: string;
  csvColumnName: string;
  fieldName: string;
  fieldType: 'text' | 'image' | 'audio';
  isRequired: boolean;
  // true if it needs annotation (shown on right), false if metadata (left)
  isAnnotationField: boolean;
  // exactly one field across config can be the primary key
  isPrimaryKey?: boolean;
  options?: string[];
  isNewColumn?: boolean; // true if this is a new column, not from CSV
  newColumnId?: string; // Reference to NewColumn if isNewColumn is true
}


interface CSVColumn {
  name: string;
  sampleData: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

interface FieldConfigProps {
  datasetId: string;
  csvImportId?: string;
  onNavigateToUpload?: () => void;
  onNavigateToOverview?: () => void;
}


export function FieldConfig({
  datasetId,
  csvImportId,
  onNavigateToUpload,
  onNavigateToOverview,
}: FieldConfigProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [availableColumns, setAvailableColumns] = useState<{
    csvColumns: { name: string; source: 'CSV'; csvImportId?: string }[];
    manualColumns: { name: string; source: 'MANUAL' }[];
  }>({ csvColumns: [], manualColumns: [] });
  const [annotationFields, setAnnotationFields] = useState<AnnotationField[]>(
    [],
  );
  const [newColumns, setNewColumns] = useState<NewColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [datasetLoadingError, setDatasetLoadingError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'fields'>('fields');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [columnValidationErrors, setColumnValidationErrors] = useState<Record<string, string>>({});
  const [datasetInfo, setDatasetInfo] = useState<{ name: string; description: string } | null>(null);

  // Load dataset columns and existing field configuration
  useEffect(() => {
    console.log('FieldConfig useEffect triggered');
    console.log('datasetId:', datasetId);

    // Load dataset available columns and existing field configuration
    loadDatasetColumns();
    loadExistingFieldConfig();
    loadDatasetInfo();
  }, [datasetId]);

  const loadDatasetColumns = async () => {
    try {
      setLoading(true);
      setDatasetLoadingError(null);
      console.log('Loading dataset columns for dataset:', datasetId);

      const dataset = await datasetsAPI.getById(datasetId);
      console.log('Dataset response:', dataset);

      if (dataset && (dataset as any).availableColumns) {
        const availableColumns = (dataset as any).availableColumns;
        const csvColumns = availableColumns.filter(
          (col: any) => col.source === 'CSV',
        );
        const manualColumns = availableColumns.filter(
          (col: any) => col.source === 'MANUAL',
        );

        console.log('CSV columns:', csvColumns);
        console.log('Manual columns:', manualColumns);

        setAvailableColumns({
          csvColumns: csvColumns.map((col: any) => ({
            name: col.name,
            source: 'CSV' as const,
            csvImportId: col.csvImportId,
          })),
          manualColumns: manualColumns.map((col: any) => ({
            name: col.name,
            source: 'MANUAL' as const,
          })),
        });
      } else {
        console.log('No available columns found in dataset');
        setAvailableColumns({ csvColumns: [], manualColumns: [] });
      }
    } catch (error: any) {
      console.error('Error loading dataset columns:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setDatasetLoadingError(
        'Failed to load dataset columns. Please try again.',
      );
      setAvailableColumns({ csvColumns: [], manualColumns: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFieldConfig = async () => {
    if (!datasetId) return;

    try {
      const config = await fieldSelectionAPI.getDatasetFieldConfig(datasetId);
      if (config) {
        // Clean normalization - create completely new objects
        const cleanFields = (config.annotationFields || []).map(
          (field: any, index: number) => {
            const cleanField = {
              id: field.id || `field-${index}`,
              csvColumnName: field.csvColumnName || '',
              fieldName: field.fieldName || '',
              fieldType: field.fieldType || 'text',
              isRequired: Boolean(field.isRequired),
              // prefer explicit isAnnotationField, fallback to inverse of legacy isMetadataField
              isAnnotationField: typeof field.isAnnotationField === 'boolean'
                ? Boolean(field.isAnnotationField)
                : !Boolean(field.isMetadataField),
              isPrimaryKey: Boolean(field.isPrimaryKey),
              options: field.options || [],
              isNewColumn: Boolean(field.isNewColumn),
              newColumnId: field.newColumnId || undefined,
            } as AnnotationField;
            // Enforce invariant: primary key cannot be an annotation field
            if (cleanField.isPrimaryKey) {
              cleanField.isAnnotationField = false;
            }
            return cleanField;
          },
        );

        setAnnotationFields(cleanFields);
        setNewColumns(config.newColumns || []);
        
        // Update selected columns based on existing annotation fields
        const existingColumnNames = cleanFields
          .filter((field: AnnotationField) => !field.isNewColumn)
          .map((field: AnnotationField) => field.csvColumnName);
        setSelectedColumns(new Set(existingColumnNames));
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading field config:', error);
    }
  };

  const loadDatasetInfo = async () => {
    try {
      console.log('Loading dataset info for header...');
      const dataset = await datasetsAPI.getById(datasetId);
      console.log('Dataset info loaded:', dataset);
      setDatasetInfo({
        name: dataset.name,
        description: dataset.description || ''
      });
    } catch (err: any) {
      console.error('Error loading dataset info:', err);
      setDatasetInfo(null);
    }
  };

  const updateAnnotationField = (
    id: string,
    updates: Partial<AnnotationField>,
  ) => {
    setAnnotationFields((currentFields) => {
      const newFields = currentFields.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, ...updates };
          return updatedField;
        }
        return { ...field }; // Create new object to avoid reference issues
      });
      return newFields;
    });
    setHasChanges(true);
  };


  // Toggle primary key ensuring exclusivity
  const togglePrimaryKey = (fieldId: string, makePrimary: boolean) => {
    setAnnotationFields((currentFields) => {
      const newFields = currentFields.map((field) => {
        const updated = { ...field } as AnnotationField;
        if (field.id === fieldId) {
          updated.isPrimaryKey = makePrimary;
          // If becoming primary, it cannot be annotated
          if (makePrimary) {
            updated.isAnnotationField = false;
          }
        } else if (makePrimary) {
          // Only one primary key allowed
          updated.isPrimaryKey = false;
        }
        return updated;
      });
      return newFields;
    });
    setHasChanges(true);
  };

  const removeAnnotationField = (id: string) => {
    setAnnotationFields((fields) => fields.filter((field) => field.id !== id));
    setHasChanges(true);
  };


  // New Column Management
  const addNewColumn = () => {
    const newColumn: NewColumn = {
      id: Date.now().toString(),
      columnName: '',
      columnType: 'text',
      isRequired: false,
      defaultValue: '',
      placeholder: '',
      validation: {},
    };
    
    // Add to newColumns array
    setNewColumns([...newColumns, newColumn]);
    
    // Also add as an annotation field
    const newField: AnnotationField = {
      id: Date.now().toString() + '_field',
      csvColumnName: '',
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      isAnnotationField: true,
      isPrimaryKey: false,
      options: [],
      isNewColumn: true,
      newColumnId: newColumn.id,
    };
    setAnnotationFields([...annotationFields, newField]);
    setHasChanges(true);
  };

  const updateNewColumn = (id: string, updates: Partial<NewColumn>) => {
    setNewColumns((columns) =>
      columns.map((column) =>
        column.id === id ? { ...column, ...updates } : column,
      ),
    );
    setHasChanges(true);
  };

  // Validation function to check for duplicate column names
  const validateColumnName = useCallback((columnName: string, excludeId?: string): { isValid: boolean; error?: string } => {
    if (!columnName || columnName.trim() === '') {
      return { isValid: false, error: 'Column name is required' };
    }

    const trimmedName = columnName.trim();
    
    // Debug logging
    console.log('Validating column name:', trimmedName);
    console.log('Available CSV columns (first 10):', availableColumns.csvColumns.slice(0, 10).map(col => col.name));
    console.log('New columns:', newColumns.map(col => col.columnName));
    console.log('Annotation fields:', annotationFields.map(field => field.csvColumnName));
    
    // Check if the exact name exists
    const exactMatch = availableColumns.csvColumns.find(col => col.name.toLowerCase() === trimmedName.toLowerCase());
    if (exactMatch) {
      console.log('EXACT MATCH FOUND:', exactMatch.name);
    }
    
    // Check for duplicates in new columns
    const duplicateNewColumn = newColumns.find(col => 
      col.id !== excludeId && col.columnName.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (duplicateNewColumn) {
      return { isValid: false, error: `Column name "${trimmedName}" already exists in new columns` };
    }

    // Check for duplicates in existing CSV columns
    const duplicateCSVColumn = availableColumns.csvColumns.find(col => 
      col.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (duplicateCSVColumn) {
      return { isValid: false, error: `Column name "${trimmedName}" already exists in CSV` };
    }

    // Check for duplicates in annotation fields (for new columns)
    const duplicateAnnotationField = annotationFields.find(field => 
      !field.isNewColumn && field.csvColumnName.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (duplicateAnnotationField) {
      return { isValid: false, error: `Column name "${trimmedName}" already exists in annotation fields` };
    }

    return { isValid: true };
  }, [newColumns, availableColumns.csvColumns, annotationFields]);

  // Removed debounced validation to prevent stale error states. We rely on immediate validation only.

  const removeNewColumn = (id: string) => {
    setNewColumns((columns) => columns.filter((column) => column.id !== id));
    // Also remove any annotation fields that reference this new column
    setAnnotationFields((fields) =>
      fields.filter((field) => field.newColumnId !== id),
    );
    // Clear validation errors for this column
    setColumnValidationErrors((errors) => {
      const newErrors = { ...errors };
      delete newErrors[id];
      return newErrors;
    });
    setHasChanges(true);
  };

  const addNewColumnAsAnnotationField = (newColumnId: string) => {
    const newColumn = newColumns.find((col) => col.id === newColumnId);
    if (!newColumn) return;

    const newField: AnnotationField = {
      id: Date.now().toString(),
      csvColumnName: newColumn.columnName,
      fieldName: newColumn.columnName,
      fieldType: 'text', // Default to text for new columns
      isRequired: newColumn.isRequired,
      isAnnotationField: true,
      isPrimaryKey: false,
      options: [],
      isNewColumn: true,
      newColumnId: newColumnId,
    };
    setAnnotationFields([...annotationFields, newField]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!datasetId) {
      showToast({
        title: 'Error',
        description: 'Dataset ID is required',
        type: 'error',
      });
      return;
    }

    // Validate that at least one field is configured
    if (annotationFields.length === 0) {
      showToast({
        title: 'Validation Error',
        description:
          'Please add at least one field before saving.',
        type: 'error',
      });
      return;
    }

    // Ensure exactly one Primary Key is selected
    const primaryCount = annotationFields.filter(f => f.isPrimaryKey).length;
    if (primaryCount !== 1) {
      showToast({
        title: 'Validation Error',
        description: 'Please select exactly one Primary Key field.',
        type: 'error',
      });
      return;
    }

    // Check for validation errors
    if (Object.keys(columnValidationErrors).length > 0) {
      showToast({
        title: 'Validation Error',
        description: 'Please fix column name validation errors before saving.',
        type: 'error',
      });
      return;
    }

    // Validate all new column names before saving
    const validationErrors: string[] = [];
    newColumns.forEach(column => {
      const validation = validateColumnName(column.columnName, column.id);
      if (!validation.isValid) {
        validationErrors.push(`${column.columnName}: ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      showToast({
        title: 'Validation Error',
        description: `Please fix the following errors:\n${validationErrors.join('\n')}`,
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Saving field configuration for dataset:', datasetId);
      console.log('Annotation fields:', annotationFields);

      await fieldSelectionAPI.saveDatasetFieldConfig({
        datasetId,
        annotationFields: annotationFields.map((field) => ({
          csvColumnName: field.csvColumnName,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isAnnotationField: field.isAnnotationField,
          isPrimaryKey: field.isPrimaryKey,
          options: field.options,
          isNewColumn: field.isNewColumn,
          newColumnId: field.newColumnId,
        })),
        annotationLabels: [], // Empty array since we removed annotation labels
        newColumns: newColumns.map((column) => ({
          id: column.id,
          columnName: column.columnName,
          columnType: column.columnType,
          isRequired: column.isRequired,
          defaultValue: column.defaultValue,
          options: column.options,
          placeholder: column.placeholder,
          validation: column.validation,
        })),
      });

      setHasChanges(false);
      showToast({
        title: 'Success',
        description: 'Field configuration saved successfully!',
        type: 'success',
      });
      console.log('Field configuration saved successfully');

      // Dispatch event to notify other components that field config was saved
      window.dispatchEvent(
        new CustomEvent('fieldConfigSaved', {
          detail: { datasetId },
        }),
      );

      // Redirect to data overview tab after successful save
      if (onNavigateToOverview) {
        onNavigateToOverview();
      } else {
        router.push(`/dataset/${datasetId}`);
      }
    } catch (error: any) {
      console.error('Error saving field configuration:', error);
      
      // Extract validation errors from backend response
      let errorMessage = 'Failed to save field configuration. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If it's a validation error, parse and show specific errors
      if (errorMessage.includes('Validation errors:')) {
        const validationErrors = errorMessage.split('\n').slice(1); // Remove "Validation errors:" header
        showToast({
          title: 'Validation Error',
          description: validationErrors.join('\n'),
          type: 'error',
        });
      } else {
        showToast({
          title: 'Error',
          description: errorMessage,
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedFieldName = (csvColumnName: string) => {
    const suggestions: Record<string, string> = {
      customer_name: 'Customer Name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
      rating: 'Rating',
      timestamp: 'Timestamp',
      sentiment: 'Sentiment',
      category: 'Category',
      priority: 'Priority',
      status: 'Status',
    };
    return (
      suggestions[csvColumnName] ||
      csvColumnName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Get all available column names from dataset schema
  const getAllAvailableColumnNames = useCallback(() => {
    const csvColumnNames = availableColumns.csvColumns.map(col => col.name.toLowerCase());
    const manualColumnNames = availableColumns.manualColumns.map(col => col.name.toLowerCase());
    return [...csvColumnNames, ...manualColumnNames];
  }, [availableColumns]);

  // Check if a column name is available in the dataset
  const isColumnNameAvailable = useCallback((columnName: string) => {
    const availableNames = getAllAvailableColumnNames();
    return !availableNames.includes(columnName.toLowerCase());
  }, [getAllAvailableColumnNames]);

  // Handle column selection from CSV display
  const handleColumnClick = (columnName: string) => {
    // Check if column is already selected
    if (selectedColumns.has(columnName)) {
      // Remove from selection and annotation fields
      setSelectedColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnName);
        return newSet;
      });
      
      // Remove from annotation fields
      setAnnotationFields(prev => 
        prev.filter(field => field.csvColumnName !== columnName)
      );
    } else {
      // Add to selection
      setSelectedColumns(prev => new Set([...prev, columnName]));
      
      // Add to annotation fields
      const newField: AnnotationField = {
        id: Date.now().toString(),
        csvColumnName: columnName,
        fieldName: getSuggestedFieldName(columnName),
        fieldType: 'text',
        isRequired: false,
        isAnnotationField: false,
        isPrimaryKey: false,
        options: [],
      };
      
      setAnnotationFields(prev => [...prev, newField]);
    }
    
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {datasetInfo?.name || 'Field Configuration'}
        </h1>
        <p className="text-gray-600 mt-1">
          {'Configure CSV annotation fields and data mapping'}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dataset columns...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {datasetLoadingError && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-300" />
              <p className="text-lg font-medium mb-2">
                Error Loading Dataset Columns
              </p>
              <p className="text-sm mb-4">{datasetLoadingError}</p>
              <Button
                onClick={loadDatasetColumns}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Columns State */}
      {!loading &&
        !datasetLoadingError &&
        availableColumns.csvColumns.length === 0 &&
        availableColumns.manualColumns.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No columns found</p>
                <p className="text-sm mb-4">
                  Please upload a CSV file first to configure annotation fields
                </p>
                <Button
                  onClick={() => {
                    if (onNavigateToUpload) {
                      onNavigateToUpload();
                    } else {
                      router.push(`/dataset/${datasetId}`);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Available Columns Display */}
      {(availableColumns.csvColumns.length > 0 ||
        availableColumns.manualColumns.length > 0) && (
        <CSVColumnsDisplay
          csvColumns={availableColumns.csvColumns}
          manualColumns={availableColumns.manualColumns}
          selectedColumns={selectedColumns}
          onColumnClick={handleColumnClick}
          title="Select Columns"
          description="Click on columns below to add them to annotation fields"
        />
      )}


      {/* Configuration Tabs */}
      {(availableColumns.csvColumns.length > 0 ||
        availableColumns.manualColumns.length > 0) && (
        <div className="space-y-6">

          {/* Annotation Fields Configuration */}
          <Card>
              <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="flex items-center space-x-2">
                       <Database className="h-5 w-5 text-blue-600" />
                       <span>Select Field Types</span>
                     </CardTitle>
                     <CardDescription>
                       Configure the type of each field for annotation
                     </CardDescription>
                   </div>
                 </div>
              </CardHeader>
               <CardContent className="p-3">
                 {annotationFields.length > 0 ? (
                   <div className="space-y-2">
                     {/* Header Row */}
                    <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-gray-50 rounded-md font-medium text-sm text-gray-600">
                      <div className="col-span-7">CSV Column</div>
                      <div className="col-span-3">Type</div>
                      <div className="col-span-1 text-center">Primary</div>
                      <div className="col-span-1 text-center">Actions</div>
                     </div>


                     {/* Field Rows */}
                     {annotationFields.map((field) => {
                       const newColumn = field.isNewColumn ? newColumns.find(col => col.id === field.newColumnId) : null;
                       return (
                         <div
                           key={field.id}
                          className={cn(
                            "grid grid-cols-12 gap-3 items-start p-3 rounded-md border border-gray-200",
                             field.isNewColumn ? "bg-gray-200" : "bg-gray-50"
                           )}
                         >
                             <div className="col-span-7">
                               {field.isNewColumn ? (
                                 <div>
                                   <div className="space-y-1">
                                     <Input
                                       placeholder="Column name"
                                       value={newColumn?.columnName || ''}
                                        onChange={(e) => {
                                          const columnName = e.target.value;
                                          
                                          // Update the column immediately for responsive UI
                                          updateNewColumn(field.newColumnId!, {
                                            columnName: columnName,
                                          });
                                          updateAnnotationField(field.id, {
                                            csvColumnName: columnName,
                                            fieldName: columnName,
                                          });

                                          // Clear validation errors if field is empty
                                          if (columnName.trim() === '') {
                                            setColumnValidationErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors[field.newColumnId!];
                                              return newErrors;
                                            });
                                            return;
                                          }

                                          // Validate with debounce
                                          const validation = validateColumnName(columnName, field.newColumnId);
                                          
                                          // Update validation errors
                                          if (!validation.isValid) {
                                            setColumnValidationErrors(prev => ({
                                              ...prev,
                                              [field.newColumnId!]: validation.error || ''
                                            }));
                                          } else {
                                            setColumnValidationErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors[field.newColumnId!];
                                              return newErrors;
                                            });
                                          }
                                        }}
                                       onBlur={(e) => {
                                         // Final validation on blur
                                         const columnName = e.target.value;
                                         
                                         // Clear validation errors if field is empty
                                         if (columnName.trim() === '') {
                                           setColumnValidationErrors(prev => {
                                             const newErrors = { ...prev };
                                             delete newErrors[field.newColumnId!];
                                             return newErrors;
                                           });
                                           return;
                                         }
                                         
                                         const validation = validateColumnName(columnName, field.newColumnId);
                                         
                                         if (!validation.isValid) {
                                           setColumnValidationErrors(prev => ({
                                             ...prev,
                                             [field.newColumnId!]: validation.error || ''
                                           }));
                                         } else {
                                           setColumnValidationErrors(prev => {
                                             const newErrors = { ...prev };
                                             delete newErrors[field.newColumnId!];
                                             return newErrors;
                                           });
                                         }
                                       }}
                                       className={cn(
                                         "h-8 text-sm bg-white transition-colors",
                                         columnValidationErrors[field.newColumnId!] 
                                           ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                                           : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                       )}
                                     />
                                    {columnValidationErrors[field.newColumnId!] && (
                                       <div className="flex items-center space-x-1">
                                         <AlertCircle className="h-3 w-3 text-red-500" />
                                         <p className="text-xs text-red-500">
                                          {columnValidationErrors[field.newColumnId!]}
                                         </p>
                                       </div>
                                     )}
                                    {!columnValidationErrors[field.newColumnId!] && newColumn?.columnName && (
                                       <div className="flex items-center space-x-1">
                                         <CheckCircle className="h-3 w-3 text-green-500" />
                                         <p className="text-xs text-green-600">
                                           Column name is available
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               ) : (
                                 <div className="flex items-center h-8 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                   {field.csvColumnName}
                                 </div>
                               )}
                             </div>

                           <div className="col-span-3">
                             {field.isNewColumn ? (
                               <div className="flex items-center h-8 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                 Text
                               </div>
                             ) : (
                               <select
                                 value={field.fieldType}
                                 onChange={(e) =>
                                   updateAnnotationField(field.id, {
                                     fieldType: e.target.value as any,
                                   })
                                 }
                                 className="w-full h-8 px-2 py-1 border border-gray-300 bg-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               >
                                 <option value="text">Text</option>
                                 <option value="image">Image</option>
                                 <option value="audio">Audio</option>
                               </select>
                             )}
                           </div>

                           {/* Primary Key checkbox */}
                           <div className="col-span-1 flex items-center justify-center">
                             <input
                               type="checkbox"
                               checked={Boolean(field.isPrimaryKey)}
                               onChange={(e) => togglePrimaryKey(field.id, e.target.checked)}
                               disabled={field.isNewColumn}
                             />
                           </div>

                           <div className="col-span-1 flex items-center justify-center">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 if (field.isNewColumn) {
                                   removeNewColumn(field.newColumnId!);
                                 }
                                 removeAnnotationField(field.id);
                               }}
                               className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </div>
                         </div>
                       );
                     })}
                  </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                     <p className="text-base font-medium mb-1">
                       Please select columns from above
                     </p>
                     <p className="text-sm">
                       Click on columns in the "Select Columns" section to add them here
                     </p>
                   </div>
                 )}
              </CardContent>
              
               {/* Fixed Footer with Save Button */}
               <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                 <div className="flex justify-between">
                   <Button
                     onClick={addNewColumn}
                     size="sm"
                     className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm"
                   >
                     <Plus className="h-3.5 w-3.5 mr-1.5" />
                     Add New Field
                   </Button>
                   <Button
                     variant="outline"
                     onClick={handleSave}
                     disabled={!hasChanges || loading}
                     className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 h-8 px-3 text-sm"
                   >
                     <Save className="h-3.5 w-3.5 mr-1.5" />
                     Save Configuration
                   </Button>
                 </div>
               </div>
            </Card>
        </div>
      )}

      {/* Status and Progress */}
      {(availableColumns.csvColumns.length > 0 ||
        availableColumns.manualColumns.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Configuration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {annotationFields.length}
                </div>
                <div className="text-sm text-gray-600">Fields Configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {availableColumns.csvColumns.length +
                    availableColumns.manualColumns.length}
                </div>
                <div className="text-sm text-gray-600">Available Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {newColumns.length}
                </div>
                <div className="text-sm text-gray-600">New Columns</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
