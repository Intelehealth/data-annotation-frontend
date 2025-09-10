'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  Database,
  FileText,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Settings,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSVImport, CSVImportsAPI } from '@/lib/api/csv-imports';
import { fieldSelectionAPI } from '@/lib/api/field-config';
import { useToast } from '@/components/ui/toast';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

interface DataOverviewProps {
  datasetId: string;
  onNavigateToUpload?: () => void;
  onNavigateToFieldConfig?: () => void;
  className?: string;
}

export function DataOverview({
  datasetId,
  onNavigateToUpload,
  onNavigateToFieldConfig,
  className,
}: DataOverviewProps) {
  const router = useRouter();
  const [csvImports, setCsvImports] = useState<CSVImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [csvToDelete, setCsvToDelete] = useState<CSVImport | null>(null);
  const [hasFieldConfig, setHasFieldConfig] = useState<boolean | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadCSVImports();
    checkFieldConfiguration();
  }, [datasetId]);

  const loadCSVImports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading CSV imports for dataset:', datasetId);

      const data = await CSVImportsAPI.getByDataset(datasetId);
      console.log('CSV imports loaded:', data);
      setCsvImports(data);
    } catch (err) {
      console.error('Error loading CSV imports:', err);
      setError('Failed to load CSV imports');
    } finally {
      setLoading(false);
    }
  };

  const checkFieldConfiguration = async () => {
    try {
      setCheckingConfig(true);
      console.log('Checking field configuration for dataset:', datasetId);
      const result = await fieldSelectionAPI.checkDatasetFieldConfig(datasetId);
      console.log('Field configuration check result:', result);
      setHasFieldConfig(result.hasConfig);
    } catch (err: any) {
      console.error('Error checking field configuration:', err);
      setHasFieldConfig(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  // Method to refresh field configuration status (can be called from parent)
  const refreshFieldConfiguration = () => {
    checkFieldConfiguration();
  };

  // Listen for field configuration saved events
  useEffect(() => {
    const handleFieldConfigSaved = (event: CustomEvent) => {
      // Only refresh if the event is for this dataset
      if (event.detail?.datasetId === datasetId) {
        console.log(
          'Field config saved event received for dataset:',
          datasetId,
        );
        refreshFieldConfiguration();
      }
    };

    window.addEventListener(
      'fieldConfigSaved',
      handleFieldConfigSaved as EventListener,
    );
    return () => {
      window.removeEventListener(
        'fieldConfigSaved',
        handleFieldConfigSaved as EventListener,
      );
    };
  }, [datasetId]);

  const handleStartAnnotation = async (csvImport: CSVImport) => {
    if (hasFieldConfig) {
      // Field configuration exists, redirect to annotation workbench
      router.push(
        `/dataset/${datasetId}/annotation?csvImportId=${csvImport._id}`,
      );
    } else {
      // No field configuration, navigate to field configuration tab
      if (onNavigateToFieldConfig) {
        onNavigateToFieldConfig();
      } else {
        router.push(`/dataset/${datasetId}?tab=field-configuration`);
      }
    }
  };

  const handleDeleteCSVImport = async (csvImportId: string) => {
    const csvImport = csvImports.find((imp) => imp._id === csvImportId);
    if (csvImport) {
      setCsvToDelete(csvImport);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!csvToDelete) return;

    try {
      setDeletingId(csvToDelete._id);
      const result = await CSVImportsAPI.deleteCSVImport(
        datasetId,
        csvToDelete._id,
      );

      if (result.success) {
        // Remove the deleted CSV import from the list
        setCsvImports((prev) =>
          prev.filter((imp) => imp._id !== csvToDelete._id),
        );
        showToast({
          type: 'success',
          title: 'File Deleted',
          description: result.message,
        });
      }
    } catch (err) {
      console.error('Error deleting CSV import:', err);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete CSV import. Please try again.',
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setCsvToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initial View (No Uploaded Data)
  if (!loading && csvImports.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header with Upload Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Overview</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your uploaded data files
            </p>
          </div>
          <Button
            onClick={onNavigateToUpload}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Data
          </Button>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Uploaded Yet
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Get started by uploading your CSV files or other data formats to
              begin the annotation process.
            </p>
            <Button onClick={onNavigateToUpload} size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Upload Your First File
            </Button>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  1. Upload Data
                </h4>
                <p className="text-sm text-gray-600">
                  Upload CSV files or other supported formats
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  2. Configure Fields
                </h4>
                <p className="text-sm text-gray-600">
                  Set up annotation fields and data mapping
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  3. Start Annotating
                </h4>
                <p className="text-sm text-gray-600">
                  Begin the annotation process
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Overview</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your uploaded data files
            </p>
          </div>
          <Button
            onClick={onNavigateToUpload}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Data
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Overview</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your uploaded data files
            </p>
          </div>
          <Button
            onClick={onNavigateToUpload}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Data
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Failed to Load Data
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button
                onClick={loadCSVImports}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View with Existing Data
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Overview</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your uploaded data files
          </p>
        </div>
        <Button
          onClick={onNavigateToUpload}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Data
        </Button>
      </div>

      {/* CSV Imports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Uploaded Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {csvImports.map((csvImport) => (
              <div
                key={csvImport._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {csvImport.originalFileName}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{csvImport.totalRows} rows</span>
                      <span>•</span>
                      <span>
                        {csvImport.metadata?.totalColumns || 0} columns
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(csvImport.fileSize)}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Uploaded {formatDate(csvImport.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-md disabled:opacity-50"
                      onClick={() => handleDeleteCSVImport(csvImport._id)}
                      disabled={deletingId === csvImport._id}
                      title="Delete file"
                    >
                      <Trash2
                        className={`h-4 w-4 text-red-500 hover:text-red-700 ${
                          deletingId === csvImport._id ? 'animate-pulse' : ''
                        }`}
                      />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleStartAnnotation(csvImport)}
                      disabled={checkingConfig}
                      className={cn(
                        hasFieldConfig
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700',
                      )}
                    >
                      {checkingConfig ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : hasFieldConfig ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Annotation
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Fields
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={csvToDelete?.originalFileName || ''}
        itemType="CSV file"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
