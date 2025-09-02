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
  Play,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSVColumnDisplay } from './csv-column-display';

interface AnnotationField {
  id: string;
  csvColumnName: string;
  fieldName: string;
  fieldType: 'text' | 'image' | 'audio';
  isRequired: boolean;
  isMetadataField: boolean; // true if it's metadata, false if it needs annotation
  isAnnotationField: boolean; // true if it needs to be annotated
  options?: string[];
  instructions?: string;
}

interface CSVColumn {
  name: string;
  sampleData: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

interface FieldSelectionProps {
  projectId: string;
  csvImportId?: string;
}

export function FieldSelection({
  projectId,
  csvImportId,
}: FieldSelectionProps) {
  const router = useRouter();
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [annotationFields, setAnnotationFields] = useState<AnnotationField[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [csvImportIdState, setCsvImportIdState] = useState<string | undefined>(
    csvImportId,
  );
  const [availableCSVImports, setAvailableCSVImports] = useState<any[]>([]);
  const [csvLoadingError, setCsvLoadingError] = useState<string | null>(null);

  // Load CSV columns and existing field selection
  useEffect(() => {
    if (csvImportIdState) {
      loadExistingFieldSelection();
      // Also load CSV columns immediately for new selections
      loadRealCSVColumns();
    } else {
      // Load available CSV imports for this project
      loadAvailableCSVImports();
    }
  }, [csvImportIdState, projectId]);

  const loadAvailableCSVImports = async () => {
    try {
      setLoading(true);
      setCsvLoadingError(null);
      const csvImports = await fieldSelectionAPI.getProjectCSVImports(
        projectId,
      );
      setAvailableCSVImports(csvImports);
    } catch (error) {
      console.error('Error loading CSV imports:', error);
      setCsvLoadingError('Failed to load CSV imports. Please try again.');
      setAvailableCSVImports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFieldSelection = async () => {
    if (!csvImportIdState) return;

    try {
      setLoading(true);
      const config = await fieldSelectionAPI.getFieldSelection(
        csvImportIdState,
      );
      setAnnotationFields(config.annotationFields);
      setHasChanges(false);

      // TODO: Load actual CSV columns from CSV import
      loadRealCSVColumns();
    } catch (error) {
      console.error('Error loading field selection:', error);
      // Fallback to mock data
      loadMockCSVColumns();
    } finally {
      setLoading(false);
    }
  };

  const loadRealCSVColumns = async () => {
    console.log(
      'loadRealCSVColumns called with csvImportIdState:',
      csvImportIdState,
    ); // Debug log

    if (!csvImportIdState) {
      console.log('No csvImportIdState, returning early'); // Debug log
      return;
    }

    try {
      console.log('Making API call to getCSVImportStatus...'); // Debug log
      // Use the status endpoint which includes columns
      const csvStatusData = await fieldSelectionAPI.getCSVImportStatus(
        csvImportIdState,
      );

      console.log('CSV Status Data:', csvStatusData); // Debug log

      if (
        csvStatusData &&
        csvStatusData.columns &&
        Array.isArray(csvStatusData.columns)
      ) {
        // Convert actual CSV columns to the format expected by the component
        const realColumns: CSVColumn[] = csvStatusData.columns.map(
          (columnName: string, index: number) => ({
            name: columnName,
            sampleData: `Column ${index + 1}`, // We'll get real sample data later
            dataType: 'string' as const, // Default type, can be enhanced later
          }),
        );
        console.log('Real Columns:', realColumns); // Debug log
        setCsvColumns(realColumns);
      } else {
        console.log('No columns found in status data, using mock data'); // Debug log
        loadMockCSVColumns();
      }
    } catch (error) {
      console.error('Error loading real CSV columns:', error);
      // Fallback to mock data
      loadMockCSVColumns();
    }
  };

  const loadMockCSVColumns = () => {
    // Simulate loading CSV columns - replace with actual API call
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
      instructions: '',
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

  const handleSave = async () => {
    if (!csvImportIdState) {
      alert('Please select a CSV import first');
      return;
    }

    setLoading(true);
    try {
      await fieldSelectionAPI.saveFieldSelection({
        csvImportId: csvImportIdState,
        annotationFields: annotationFields.map((field) => ({
          csvColumnName: field.csvColumnName,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isMetadataField: field.isMetadataField,
          isAnnotationField: field.isAnnotationField,
          options: field.options,
          instructions: field.instructions,
        })),
      });

      setHasChanges(false);
      alert('Field selection saved successfully!');
    } catch (error) {
      console.error('Error saving field selection:', error);
      alert('Failed to save field selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnnotation = async () => {
    if (!csvImportIdState) {
      alert('Please select a CSV import first');
      return;
    }

    if (annotationFields.length === 0) {
      alert('Please add at least one annotation field');
      return;
    }

    setLoading(true);
    try {
      await fieldSelectionAPI.startAnnotation(csvImportIdState);
      alert('Annotation process started successfully!');

      // Navigate to annotation workbench
      router.push(
        `/project/${projectId}/annotation?csvImportId=${csvImportIdState}`,
      );
    } catch (error) {
      console.error('Error starting annotation:', error);
      alert('Failed to start annotation. Please try again.');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Selection</h1>
          <p className="text-gray-600 mt-1">
            Configure which CSV columns need annotation and how they should be
            labeled
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!hasChanges || loading || !csvImportIdState}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
          <Button
            onClick={handleStartAnnotation}
            disabled={
              annotationFields.length === 0 || loading || !csvImportIdState
            }
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Annotation
          </Button>
        </div>
      </div>

      {/* CSV Import Selection */}
      {!csvImportIdState && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Select CSV Import</span>
            </CardTitle>
            <CardDescription>
              Choose a CSV import to configure annotation fields for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading CSV imports...</p>
              </div>
            ) : csvLoadingError ? (
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
            ) : availableCSVImports.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select a CSV import to configure annotation fields:
                </p>
                {availableCSVImports.map((csvImport) => (
                  <div
                    key={csvImport._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    onClick={() => {
                      setCsvImportIdState(csvImport._id);
                      // Load the CSV columns immediately when selected
                      setTimeout(() => loadRealCSVColumns(), 100);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {csvImport.originalFileName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {csvImport.totalRows} rows •{' '}
                          {csvImport.columns.length} columns
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded{' '}
                          {new Date(csvImport.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            csvImport.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {csvImport.status}
                        </span>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No CSV imports found</p>
                <p className="text-sm mb-4">
                  Please upload a CSV file first to configure annotation fields
                </p>
                <Button
                  onClick={() =>
                    router.push(`/project/${projectId}?tab=upload`)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Upload
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Columns Overview */}
      {csvImportIdState && (
        <CSVColumnDisplay
          csvImportId={csvImportIdState}
          projectId={projectId}
        />
      )}

      {/* Annotation Fields Configuration */}
      {csvImportIdState && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Annotation Fields</span>
                </CardTitle>
                <CardDescription>
                  Configure which fields need annotation and how they should be
                  labeled
                </CardDescription>
              </div>
              <Button
                onClick={addAnnotationField}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
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
                        value={field.csvColumnName}
                        onChange={(e) => {
                          updateAnnotationField(field.id, {
                            csvColumnName: e.target.value,
                            fieldName: getSuggestedFieldName(e.target.value),
                          });
                        }}
                        className="w-full h-9 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select CSV Column</option>
                        {csvColumns.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name}
                          </option>
                        ))}
                      </select>
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
                              // If it's metadata, it's not an annotation field
                              isAnnotationField: !e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Metadata</span>
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
                              // If it's annotation field, it's not metadata
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

                    {/* Instructions Field */}
                    <div className="col-span-12 mt-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Instructions for Annotators
                      </Label>
                      <Input
                        placeholder="e.g., Please label the sentiment of this customer feedback"
                        value={field.instructions || ''}
                        onChange={(e) =>
                          updateAnnotationField(field.id, {
                            instructions: e.target.value,
                          })
                        }
                        className="h-9 mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
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

      {/* Status and Progress */}
      {csvImportIdState && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Configuration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
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
                <div className="text-2xl font-bold text-gray-600">
                  {csvColumns.length}
                </div>
                <div className="text-sm text-gray-600">Total CSV Columns</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
