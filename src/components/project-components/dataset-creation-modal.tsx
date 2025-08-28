'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Database } from 'lucide-react';
import { datasetsAPI, CreateDatasetDto } from '@/lib/api/datasets';

interface DatasetCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onDatasetCreated: (datasetId: string) => void;
}

export function DatasetCreationModal({
  isOpen,
  onClose,
  projectId,
  onDatasetCreated,
}: DatasetCreationModalProps) {
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datasetName.trim()) {
      setError('Dataset name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const datasetData: CreateDatasetDto = {
        projectId,
        name: datasetName.trim(),
        description: datasetDescription.trim(),
      };

      const response = await datasetsAPI.create(datasetData);
      onDatasetCreated(response._id);
      onClose();

      // Reset form
      setDatasetName('');
      setDatasetDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Create New Dataset</span>
          </DialogTitle>
          <DialogDescription>
            Create a new dataset to organize your project files. You can upload
            assets to this dataset once it's created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datasetName">Dataset Name *</Label>
            <Input
              id="datasetName"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="Enter dataset name"
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="datasetDescription">Description</Label>
            <Textarea
              id="datasetDescription"
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              placeholder="Describe your dataset (optional)"
              disabled={isLoading}
              rows={3}
              className="w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Dataset'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
