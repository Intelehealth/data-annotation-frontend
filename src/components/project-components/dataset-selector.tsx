'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Database, Loader2 } from 'lucide-react';
import { datasetsAPI, DatasetResponse } from '@/lib/api/datasets';
import { DatasetCreationModal } from './dataset-creation-modal';

interface DatasetSelectorProps {
  projectId: string;
  selectedDatasetId: string;
  onDatasetChange: (datasetId: string) => void;
  className?: string;
}

export function DatasetSelector({
  projectId,
  selectedDatasetId,
  onDatasetChange,
  className = '',
}: DatasetSelectorProps) {
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

      // Auto-select first dataset if none selected
      if (data.length > 0 && !selectedDatasetId) {
        onDatasetChange(data[0]._id);
      }
    } catch (err: any) {
      setError('Failed to fetch datasets');
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetCreated = (datasetId: string) => {
    // Refresh datasets and select the new one
    fetchDatasets().then(() => {
      onDatasetChange(datasetId);
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading datasets...</span>
      </div>
    );
  }

  if (error) {
    return <div className={`text-sm text-red-600 ${className}`}>{error}</div>;
  }

  if (datasets.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">
            No datasets found for this project
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Dataset
          </Button>
        </div>

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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="dataset-select" className="text-sm font-medium">
          Select Dataset
        </Label>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Dataset
        </Button>
      </div>

      <Select value={selectedDatasetId} onValueChange={onDatasetChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a dataset" />
        </SelectTrigger>
        <SelectContent>
          {datasets.map((dataset) => (
            <SelectItem key={dataset._id} value={dataset._id}>
              <div className="flex flex-col">
                <span className="font-medium">{dataset.name}</span>
                {dataset.description && (
                  <span className="text-xs text-gray-500 truncate">
                    {dataset.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DatasetCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onDatasetCreated={handleDatasetCreated}
      />
    </div>
  );
}
