'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { datasetsAPI, DatasetResponse } from '@/lib/api/datasets';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DataOverview } from '@/components/dataset-components/data-overview';
import { DatasetSidebar } from '@/components/dataset-components/dataset-sidebar';
import { DatasetUploadComponent } from '@/components/upload-components/dataset-upload-component';
import { FieldConfig } from '@/components/field-config-components/field-config';
import { Sidebar } from '@/components/sidebar';
import {
  ArrowLeft,
  Database,
  Calendar,
  FileText,
  Image,
  AudioLines,
  Loader2,
  Upload,
} from 'lucide-react';

const datasetTypeIcons = {
  text: FileText,
  image: Image,
  audio: AudioLines,
  multimodal: Database,
};

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const datasetId = params.datasetId as string;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (datasetId && isAuthenticated) {
      loadDataset();
    }
  }, [datasetId, isAuthenticated]);

  const loadDataset = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await datasetsAPI.getById(datasetId);
      setDataset(data);
    } catch (err) {
      setError('Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContent = () => {
    if (!dataset) {
      return (
        <div className="space-y-6">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">⚠️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Dataset not found</h3>
            <p className="mb-4">Unable to load dataset details</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <DataOverview
            key={refreshTrigger} // This will force re-render when refreshTrigger changes
            datasetId={datasetId}
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToFieldConfig={() => setActiveTab('field-configuration')}
          />
        );

      case 'upload':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Upload Data
                </h1>
                <p className="text-gray-600 mt-1">
                  Add new files to your dataset
                </p>
              </div>
            </div>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span>Upload Files</span>
                </CardTitle>
                <CardDescription>
                  Upload CSV files or other data formats to your dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DatasetUploadComponent
                  datasetId={datasetId}
                  onFilesSelected={(files) => {
                    console.log('Files selected:', files);
                  }}
                  onUploadComplete={(assets) => {
                    console.log('Upload complete:', assets);
                    // Refresh the data overview to show new uploads
                    setRefreshTrigger((prev) => prev + 1);
                    // Optionally switch back to overview to see the new upload
                    setTimeout(() => setActiveTab('overview'), 1000);
                  }}
                  onCSVUploaded={(csvImportId, fileName, totalRows) => {
                    console.log('CSV uploaded:', {
                      csvImportId,
                      fileName,
                      totalRows,
                    });
                    // Refresh the data overview to show new uploads
                    setRefreshTrigger((prev) => prev + 1);
                    // Optionally switch back to overview to see the new upload
                    setTimeout(() => setActiveTab('overview'), 1000);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'field-configuration':
        return (
          <FieldConfig
            datasetId={datasetId}
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToOverview={() => setActiveTab('overview')}
          />
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {dataset.name}
              </h1>
              <p className="text-gray-600 mt-1">{dataset.description}</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">🚀</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Feature Coming Soon
                  </h3>
                  <p className="mb-4">
                    This feature is under development and will be available
                    soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDataset} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dataset not found
          </h3>
          <p className="text-gray-600 mb-4">
            The dataset you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/dataset')}>
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Sidebar - Force collapsed state for dataset detail pages */}
      <Sidebar forceCollapsed={true} />

      {/* Dataset Sidebar */}
      <DatasetSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        datasetId={datasetId}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
