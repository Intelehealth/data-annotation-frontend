'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fieldSelectionAPI } from '@/lib/api';
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
  Tag,
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
  isMetadataField: boolean; // true if it's metadata, false if it needs annotation
  isAnnotationField: boolean; // true if it needs to be annotated
  options?: string[];
  isNewColumn?: boolean; // true if this is a new column, not from CSV
  newColumnId?: string; // Reference to NewColumn if isNewColumn is true
}

interface AnnotationLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  hotkey?: string;
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

const predefinedColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#0f172a',
];

export function FieldConfig({
  datasetId,
  csvImportId,
  onNavigateToUpload,
  onNavigateToOverview,
}: FieldConfigProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [annotationFields, setAnnotationFields] = useState<AnnotationField[]>(
    [],
  );
  const [annotationLabels, setAnnotationLabels] = useState<AnnotationLabel[]>(
    [],
  );
  const [newColumns, setNewColumns] = useState<NewColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [csvImportIdState, setCsvImportIdState] = useState<string | undefined>(
    csvImportId,
  );
  const [availableCSVImports, setAvailableCSVImports] = useState<any[]>([]);
  const [csvLoadingError, setCsvLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'fields' | 'labels' | 'newColumns'
  >('fields');

  // Load CSV columns and existing field configuration
  useEffect(() => {
    console.log('FieldConfig useEffect triggered');
    console.log('datasetId:', datasetId);
    console.log('csvImportId:', csvImportId);

    // Always load existing field configuration first
    loadExistingFieldConfig();

    if (csvImportId) {
      // If csvImportId is provided as prop, use it directly
      setCsvImportIdState(csvImportId);
      // Load CSV columns after a short delay to ensure state is updated
      setTimeout(() => {
        loadRealCSVColumns();
      }, 200);
    } else {
      // Automatically load the first CSV import for this dataset
      loadAvailableCSVImports();
    }
  }, [datasetId, csvImportId]);

  const loadAvailableCSVImports = async () => {
    try {
      setLoading(true);
      setCsvLoadingError(null);
      console.log('Loading CSV imports for dataset:', datasetId);

      const csvImports = await fieldSelectionAPI.getDatasetCSVImports(
        datasetId,
      );

      console.log('Available CSV imports:', csvImports);
      setAvailableCSVImports(csvImports);

      // Automatically select the first CSV import if available
      if (csvImports.length > 0) {
        const firstCsvImport = csvImports[0];
        console.log('Auto-selecting first CSV import:', firstCsvImport);
        console.log('First CSV import columns:', firstCsvImport.columns);

        setCsvImportIdState(firstCsvImport._id);

        // If the CSV import already has columns, use them directly
        if (
          firstCsvImport.columns &&
          Array.isArray(firstCsvImport.columns) &&
          firstCsvImport.columns.length > 0
        ) {
          console.log('Using columns from CSV import response directly');
          const directColumns: CSVColumn[] = firstCsvImport.columns.map(
            (columnName: string, index: number) => ({
              name: columnName,
              sampleData: `Sample ${index + 1}`,
              dataType: 'string' as const,
            }),
          );
          setCsvColumns(directColumns);
        } else {
          console.log('No columns in CSV import response, trying API call');
          // Load columns for the first CSV import (field config already loaded)
          setTimeout(() => {
            loadRealCSVColumns();
          }, 100);
        }
      } else {
        console.log('No CSV imports found for dataset');
      }
    } catch (error: any) {
      console.error('Error loading CSV imports:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setCsvLoadingError('Failed to load CSV imports. Please try again.');
      setAvailableCSVImports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFieldConfig = async () => {
    if (!datasetId) return;

    try {
      setLoading(true);
      console.log('Loading existing field config for dataset:', datasetId);
      const config = await fieldSelectionAPI.getDatasetFieldConfig(datasetId);
      console.log('Loaded field config:', config);
      if (config) {
        setAnnotationFields(config.annotationFields || []);
        setAnnotationLabels(config.annotationLabels || []);
        setNewColumns(config.newColumns || []);
        console.log('Set annotation fields:', config.annotationFields);
        console.log('Set annotation labels:', config.annotationLabels);
        console.log('Set new columns:', config.newColumns);
      } else {
        console.log('No existing field config found');
      }
      setHasChanges(false);
      if (csvImportIdState) {
        // Load CSV columns after loading field config
        setTimeout(() => {
          loadRealCSVColumns();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading field config:', error);
      if (csvImportIdState) {
        loadMockCSVColumns();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRealCSVColumns = async () => {
    if (!csvImportIdState) return;

    try {
      console.log('Loading CSV columns for csvImportId:', csvImportIdState);
      console.log(
        'Making API call to:',
        `/csv-processing/columns/${csvImportIdState}`,
      );

      const csvColumnsData = await fieldSelectionAPI.getCSVColumns(
        csvImportIdState,
      );

      console.log('Raw API Response:', csvColumnsData);

      if (
        csvColumnsData &&
        csvColumnsData.columns &&
        Array.isArray(csvColumnsData.columns)
      ) {
        const realColumns: CSVColumn[] = csvColumnsData.columns.map(
          (columnName: string, index: number) => ({
            name: columnName,
            sampleData: `Sample ${index + 1}`,
            dataType: 'string' as const,
          }),
        );
        console.log('Processed columns:', realColumns);
        setCsvColumns(realColumns);
      } else {
        console.log('No columns found in response, using mock data');
        console.log('Response structure:', {
          hasColumns: !!csvColumnsData?.columns,
          columnsType: typeof csvColumnsData?.columns,
          isArray: Array.isArray(csvColumnsData?.columns),
          columnsLength: csvColumnsData?.columns?.length,
        });
        loadMockCSVColumns();
      }
    } catch (error: any) {
      console.error('Error loading real CSV columns:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      loadMockCSVColumns();
    }
  };

  const loadMockCSVColumns = () => {
    const mockColumns: CSVColumn[] = [
      { name: 'customer_name', sampleData: 'John Doe', dataType: 'string' },
      { name: 'email', sampleData: 'john@email.com', dataType: 'string' },
      { name: 'phone', sampleData: '123-456-7890', dataType: 'string' },
      {
        name: 'message',
        sampleData: 'Great service experience',
        dataType: 'string',
      },
      { name: 'rating', sampleData: '5', dataType: 'number' },
      { name: 'timestamp', sampleData: '2024-01-15', dataType: 'date' },
    ];
    setCsvColumns(mockColumns);
  };

  // Annotation Field Management
  const addAnnotationField = () => {
    const newField: AnnotationField = {
      id: Date.now().toString(),
      csvColumnName: '',
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      isMetadataField: false,
      isAnnotationField: true,
      options: [],
    };
    setAnnotationFields([...annotationFields, newField]);
    setHasChanges(true);
  };

  const updateAnnotationField = (
    id: string,
    updates: Partial<AnnotationField>,
  ) => {
    setAnnotationFields((fields) =>
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    );
    setHasChanges(true);
  };

  const removeAnnotationField = (id: string) => {
    setAnnotationFields((fields) => fields.filter((field) => field.id !== id));
    setHasChanges(true);
  };

  // Annotation Label Management
  const addAnnotationLabel = () => {
    const newLabel: AnnotationLabel = {
      id: Date.now().toString(),
      name: '',
      color:
        predefinedColors[annotationLabels.length % predefinedColors.length],
      description: '',
      hotkey: '',
    };
    setAnnotationLabels([...annotationLabels, newLabel]);
    setHasChanges(true);
  };

  const updateAnnotationLabel = (
    id: string,
    updates: Partial<AnnotationLabel>,
  ) => {
    setAnnotationLabels((labels) =>
      labels.map((label) =>
        label.id === id ? { ...label, ...updates } : label,
      ),
    );
    setHasChanges(true);
  };

  const removeAnnotationLabel = (id: string) => {
    setAnnotationLabels((labels) => labels.filter((label) => label.id !== id));
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
    setNewColumns([...newColumns, newColumn]);
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

  const removeNewColumn = (id: string) => {
    setNewColumns((columns) => columns.filter((column) => column.id !== id));
    // Also remove any annotation fields that reference this new column
    setAnnotationFields((fields) =>
      fields.filter((field) => field.newColumnId !== id),
    );
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
      isMetadataField: false,
      isAnnotationField: true,
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

    setLoading(true);
    try {
      console.log('Saving field configuration for dataset:', datasetId);
      console.log('Annotation fields:', annotationFields);
      console.log('Annotation labels:', annotationLabels);

      await fieldSelectionAPI.saveDatasetFieldConfig({
        datasetId,
        annotationFields: annotationFields.map((field) => ({
          csvColumnName: field.csvColumnName,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isMetadataField: field.isMetadataField,
          isAnnotationField: field.isAnnotationField,
          options: field.options,
          isNewColumn: field.isNewColumn,
          newColumnId: field.newColumnId,
        })),
        annotationLabels: annotationLabels.map((label) => ({
          name: label.name,
          color: label.color,
          description: label.description,
          hotkey: label.hotkey,
        })),
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

      // Redirect to data overview tab after successful save
      if (onNavigateToOverview) {
        onNavigateToOverview();
      } else {
        router.push(`/dataset/${datasetId}?tab=overview`);
      }
    } catch (error) {
      console.error('Error saving field configuration:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save field configuration. Please try again.',
        type: 'error',
      });
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

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      {csvImportIdState && (
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && !csvImportIdState && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading CSV imports...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {csvLoadingError && !csvImportIdState && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-300" />
              <p className="text-lg font-medium mb-2">
                Error Loading CSV Imports
              </p>
              <p className="text-sm mb-4">{csvLoadingError}</p>
              <Button
                onClick={loadAvailableCSVImports}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No CSV Imports State */}
      {!loading &&
        !csvLoadingError &&
        availableCSVImports.length === 0 &&
        !csvImportIdState && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No CSV imports found</p>
                <p className="text-sm mb-4">
                  Please upload a CSV file first to configure annotation fields
                </p>
                <Button
                  onClick={() => {
                    if (onNavigateToUpload) {
                      onNavigateToUpload();
                    } else {
                      router.push(`/dataset/${datasetId}?tab=upload`);
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

      {/* CSV Import Selector */}
      {csvImportIdState && availableCSVImports.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>CSV Import</span>
            </CardTitle>
            <CardDescription>
              Select which CSV import to configure fields for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="csv-import-select">Current CSV Import</Label>
              <select
                id="csv-import-select"
                value={csvImportIdState}
                onChange={(e) => {
                  setCsvImportIdState(e.target.value);
                  // Load CSV columns for the selected import
                  setTimeout(() => {
                    loadRealCSVColumns();
                  }, 100);
                }}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableCSVImports.map((csvImport) => (
                  <option key={csvImport._id} value={csvImport._id}>
                    {csvImport.originalFileName} ({csvImport.totalRows} rows,{' '}
                    {csvImport.columns.length} columns)
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Columns Display */}
      {csvImportIdState && csvColumns.length > 0 && (
        <CSVColumnsDisplay
          columns={csvColumns}
          title="Available CSV Columns"
          description="Columns from the uploaded CSV file that can be configured for annotation"
        />
      )}

      {/* Configuration Tabs */}
      {csvImportIdState && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('fields')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'fields'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              <Database className="h-4 w-4 mr-2 inline" />
              Annotation Fields
            </button>
            <button
              onClick={() => setActiveTab('labels')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'labels'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              <Tag className="h-4 w-4 mr-2 inline" />
              Annotation Labels
            </button>
            <button
              onClick={() => setActiveTab('newColumns')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === 'newColumns'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              New Columns
            </button>
          </div>

          {/* Annotation Fields Configuration */}
          {activeTab === 'fields' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span>Annotation Fields</span>
                    </CardTitle>
                    <CardDescription>
                      Configure which fields need annotation and how they should
                      be labeled
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={addAnnotationField}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                    <Button
                      onClick={() => setActiveTab('newColumns')}
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Column
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {annotationFields.length > 0 ? (
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-14 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                      <div className="col-span-2">CSV Column</div>
                      <div className="col-span-2">Field Name</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Required</div>
                      <div className="col-span-2">Metadata</div>
                      <div className="col-span-2">Annotation</div>
                      <div className="col-span-2">Actions</div>
                    </div>

                    {/* Field Rows */}
                    {annotationFields.map((field) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-14 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="col-span-2">
                          <select
                            value={
                              field.isNewColumn
                                ? `new-${field.newColumnId}`
                                : field.csvColumnName
                            }
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              if (selectedValue.startsWith('new-')) {
                                const newColumnId = selectedValue.replace(
                                  'new-',
                                  '',
                                );
                                const newColumn = newColumns.find(
                                  (col) => col.id === newColumnId,
                                );
                                updateAnnotationField(field.id, {
                                  csvColumnName: newColumn?.columnName || '',
                                  fieldName: newColumn?.columnName || '',
                                  isNewColumn: true,
                                  newColumnId: newColumnId,
                                });
                              } else {
                                updateAnnotationField(field.id, {
                                  csvColumnName: selectedValue,
                                  fieldName:
                                    getSuggestedFieldName(selectedValue),
                                  isNewColumn: false,
                                  newColumnId: undefined,
                                });
                              }
                            }}
                            className="w-full h-9 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select CSV Column</option>
                            {csvColumns.length > 0 ? (
                              csvColumns.map((column) => (
                                <option key={column.name} value={column.name}>
                                  {column.name}
                                </option>
                              ))
                            ) : (

                              <option disabled>No CSV columns available</option>
                            )}
                            {newColumns.length > 0 && (
                              <>
                                <option disabled>--- New Columns ---</option>
                                {newColumns.map((column) => (
                                  <option
                                    key={`new-${column.id}`}
                                    value={`new-${column.id}`}
                                  >
                                    {column.columnName} (New Column)
                                  </option>
                                ))}
                              </>

                            )}
                          </select>
                          {csvColumns.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                              No CSV columns loaded. Check console for errors.
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <Input
                            placeholder="Field Name"
                            value={field.fieldName}
                            onChange={(e) =>
                              updateAnnotationField(field.id, {
                                fieldName: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2">
                          <select
                            value={field.fieldType}
                            onChange={(e) =>
                              updateAnnotationField(field.id, {
                                fieldType: e.target.value as any,
                              })
                            }
                            className="w-full h-9 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="audio">Audio</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateAnnotationField(field.id, {
                                isRequired: !field.isRequired,
                              })
                            }
                            className={cn(
                              'h-8 px-3 text-xs',
                              field.isRequired
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-600',
                            )}
                          >
                            {field.isRequired ? 'Required' : 'Optional'}
                          </Button>
                        </div>

                        <div className="col-span-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isMetadataField}
                              onChange={(e) =>
                                updateAnnotationField(field.id, {
                                  isMetadataField: e.target.checked,
                                  isAnnotationField: !e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              Metadata
                            </span>
                          </label>
                        </div>

                        <div className="col-span-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isAnnotationField}
                              onChange={(e) =>
                                updateAnnotationField(field.id, {
                                  isAnnotationField: e.target.checked,
                                  isMetadataField: !e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              Annotation
                            </span>
                          </label>
                        </div>

                        <div className="col-span-2 flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnnotationField(field.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      No annotation fields configured yet
                    </p>
                    <p className="text-sm">
                      Add fields to define what needs to be annotated
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Annotation Labels Configuration */}
          {activeTab === 'labels' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-green-600" />
                      <span>Annotation Labels</span>
                    </CardTitle>
                    <CardDescription>
                      Define the labels that annotators will use to tag the data
                    </CardDescription>
                  </div>
                  <Button
                    onClick={addAnnotationLabel}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Label
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {annotationLabels.length > 0 ? (
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                      <div className="col-span-3">Label Name</div>
                      <div className="col-span-2">Color</div>
                      <div className="col-span-1">Hotkey</div>
                      <div className="col-span-5">Description</div>
                      <div className="col-span-1">Actions</div>
                    </div>

                    {/* Label Rows */}
                    {annotationLabels.map((label) => (
                      <div
                        key={label.id}
                        className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="col-span-3">
                          <Input
                            placeholder="Label name"
                            value={label.name}
                            onChange={(e) =>
                              updateAnnotationLabel(label.id, {
                                name: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={label.color}
                              onChange={(e) =>
                                updateAnnotationLabel(label.id, {
                                  color: e.target.value,
                                })
                              }
                              className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">
                              {label.color}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-1">
                          <Input
                            placeholder="K"
                            maxLength={1}
                            value={label.hotkey || ''}
                            onChange={(e) =>
                              updateAnnotationLabel(label.id, {
                                hotkey: e.target.value.toUpperCase(),
                              })
                            }
                            className="h-9 text-center"
                          />
                        </div>

                        <div className="col-span-5">
                          <Input
                            placeholder="Label description"
                            value={label.description || ''}
                            onChange={(e) =>
                              updateAnnotationLabel(label.id, {
                                description: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnnotationLabel(label.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      No annotation labels defined yet
                    </p>
                    <p className="text-sm">
                      Add labels to define what annotators will tag
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* New Columns Configuration */}
          {activeTab === 'newColumns' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      <span>New Columns</span>
                    </CardTitle>
                    <CardDescription>
                      Create custom columns that will be added to the exported
                      CSV
                    </CardDescription>
                  </div>
                  <Button
                    onClick={addNewColumn}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {newColumns.length > 0 ? (
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                      <div className="col-span-3">Column Name</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-1">Required</div>
                      <div className="col-span-2">Default Value</div>
                      <div className="col-span-2">Placeholder</div>
                      <div className="col-span-2">Actions</div>
                    </div>

                    {/* Column Rows */}
                    {newColumns.map((column) => (
                      <div
                        key={column.id}
                        className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="col-span-3">
                          <Input
                            placeholder="Column name"
                            value={column.columnName}
                            onChange={(e) =>
                              updateNewColumn(column.id, {
                                columnName: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2">
                          <select
                            value={column.columnType}
                            onChange={(e) =>
                              updateNewColumn(column.id, {
                                columnType: e.target.value as any,
                              })
                            }
                            className="w-full h-9 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="select">Select</option>
                            <option value="textarea">Textarea</option>
                            <option value="rating">Rating</option>
                          </select>
                        </div>

                        <div className="col-span-1">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.isRequired}
                              onChange={(e) =>
                                updateNewColumn(column.id, {
                                  isRequired: e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              Required
                            </span>
                          </label>
                        </div>

                        <div className="col-span-2">
                          <Input
                            placeholder="Default value"
                            value={column.defaultValue || ''}
                            onChange={(e) =>
                              updateNewColumn(column.id, {
                                defaultValue: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2">
                          <Input
                            placeholder="Placeholder text"
                            value={column.placeholder || ''}
                            onChange={(e) =>
                              updateNewColumn(column.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewColumn(column.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Additional Options for Select Type */}
                        {column.columnType === 'select' && (
                          <div className="col-span-12 mt-3">
                            <Label className="text-sm font-medium text-gray-700">
                              Select Options (one per line)
                            </Label>
                            <textarea
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              value={column.options?.join('\n') || ''}
                              onChange={(e) =>
                                updateNewColumn(column.id, {
                                  options: e.target.value
                                    .split('\n')
                                    .filter((opt) => opt.trim()),
                                })
                              }
                              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      No new columns defined yet
                    </p>
                    <p className="text-sm">
                      Add custom columns to be included in the exported CSV
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Status and Progress */}
      {csvImportIdState && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Configuration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {annotationFields.length}
                </div>
                <div className="text-sm text-gray-600">Fields Configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {annotationFields.filter((f) => f.isRequired).length}
                </div>
                <div className="text-sm text-gray-600">Required Fields</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {annotationFields.filter((f) => f.isMetadataField).length}
                </div>
                <div className="text-sm text-gray-600">Metadata Fields</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {annotationFields.filter((f) => f.isAnnotationField).length}
                </div>
                <div className="text-sm text-gray-600">Annotation Fields</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {annotationLabels.length}
                </div>
                <div className="text-sm text-gray-600">Labels Defined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {csvColumns.length}
                </div>
                <div className="text-sm text-gray-600">Total CSV Columns</div>
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
