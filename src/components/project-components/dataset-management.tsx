'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Grid3X3,
  List,
  Plus,
  Database,
  FileText,
  Image,
  AudioLines,
  FolderOpen,
} from 'lucide-react';
import { datasetsAPI, DatasetResponse } from '@/lib/api/datasets';
import { DatasetCreationModal } from './dataset-creation-modal';

interface DatasetManagementProps {
  projectId: string;
  onNavigateToUpload: () => void;
}

export function DatasetManagement({
  projectId,
  onNavigateToUpload,
}: DatasetManagementProps) {
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, [projectId]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await datasetsAPI.getByProject(projectId);
      setDatasets(data);
    } catch (err: any) {
      setError('Failed to fetch datasets');
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetCreated = (datasetId: string) => {
    // Refresh datasets and select the new one
    fetchDatasets();
  };

  const getDatasetIcon = (dataset: DatasetResponse) => {
    // You can customize this based on dataset type or content
    return <Database className="h-8 w-8 text-blue-600" />;
  };

  const getDatasetStats = (dataset: DatasetResponse) => {
    // Mock stats - you can replace with actual asset counts
    return {
      totalFiles: 0,
      annotatedFiles: 0,
      pendingFiles: 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Datasets
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchDatasets} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dataset</h1>
            <p className="text-gray-600 mt-1">
              Manage and organize your project files
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="text-center text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="h-20 w-20 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-3">
                No datasets created yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first dataset to start organizing and managing your
                project files. You can then upload assets and begin the
                annotation process.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button onClick={() => setShowCreateModal(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Dataset
                </Button>
                <Button
                  onClick={onNavigateToUpload}
                  variant="outline"
                  size="lg"
                >
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Upload Files
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DatasetCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onDatasetCreated={handleDatasetCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dataset</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your project files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
          <div className="flex items-center space-x-1 bg-white border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => {
            const stats = getDatasetStats(dataset);
            return (
              <Card
                key={dataset._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getDatasetIcon(dataset)}
                      <div>
                        <CardTitle className="text-lg">
                          {dataset.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {dataset.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Dataset Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-lg font-semibold text-blue-600">
                          {stats.totalFiles}
                        </div>
                        <div className="text-xs text-blue-600">Total Files</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-lg font-semibold text-green-600">
                          {stats.annotatedFiles}
                        </div>
                        <div className="text-xs text-green-600">Annotated</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="text-lg font-semibold text-orange-600">
                          {stats.pendingFiles}
                        </div>
                        <div className="text-xs text-orange-600">Pending</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={onNavigateToUpload}
                        className="flex-1"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                      <Button variant="outline" size="sm" className="px-3">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 text-center">
                      Created {new Date(dataset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((dataset) => {
            const stats = getDatasetStats(dataset);
            return (
              <Card
                key={dataset._id}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getDatasetIcon(dataset)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {dataset.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {dataset.description || 'No description'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{stats.totalFiles} files</span>
                          <span>•</span>
                          <span>
                            Created{' '}
                            {new Date(dataset.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button onClick={onNavigateToUpload} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DatasetCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onDatasetCreated={handleDatasetCreated}
      />
    </div>
  );
}
