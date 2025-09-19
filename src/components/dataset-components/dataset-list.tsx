'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Search,
  Database,
  Calendar,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsAPI, DatasetResponse } from '@/lib/api/datasets';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { DatasetPagination } from './dataset-pagination';
import { useToast } from '@/components/ui/toast';

interface DatasetListProps {
  onAddDataset?: () => void;
  onEditDataset?: (dataset: DatasetResponse) => void;
  onDeleteDataset?: (dataset: DatasetResponse) => void;
  className?: string;
}

export function DatasetList({
  onAddDataset,
  onEditDataset,
  onDeleteDataset,
  className,
}: DatasetListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDatasets, setFilteredDatasets] = useState<DatasetResponse[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] =
    useState<DatasetResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDatasets(datasets);
    } else {
      // Use backend search API for better performance
      searchDatasets(searchQuery);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await datasetsAPI.getAll();
      setDatasets(data);
      setFilteredDatasets(data);
    } catch (err) {
      setError('Failed to load datasets');
      showToast({
        title: 'Error',
        description: 'Failed to load datasets',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchDatasets = async (query: string) => {
    try {
      const results = await datasetsAPI.search(query);
      setFilteredDatasets(results);
    } catch (err) {
      // Fallback to client-side search if API fails
      const filtered = datasets.filter(
        (dataset) =>
          dataset.name?.toLowerCase().includes(query.toLowerCase()) ||
          dataset.description?.toLowerCase().includes(query.toLowerCase()) ||
          dataset.datasetType?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredDatasets(filtered);
    }
  };

  const handleDeleteClick = (dataset: DatasetResponse) => {
    setDatasetToDelete(dataset);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!datasetToDelete) return;

    try {
      setIsDeleting(true);
      await datasetsAPI.delete(datasetToDelete._id);
      await loadDatasets(); // Reload the list
      onDeleteDataset?.(datasetToDelete);

      showToast({
        title: 'Dataset Deleted',
        description: `"${datasetToDelete.name}" has been deleted successfully.`,
        type: 'success',
      });
    } catch (err) {
      setError('Failed to delete dataset');
      showToast({
        title: 'Error',
        description: 'Failed to delete dataset',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDatasetToDelete(null);
    }
  };

  const handleCardClick = (dataset: DatasetResponse) => {
    router.push(`/dataset/${dataset._id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current page datasets
  const getCurrentPageDatasets = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDatasets.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDatasetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      image: 'bg-green-100 text-green-800',
      audio: 'bg-purple-100 text-purple-800',
      multimodal: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading datasets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadDatasets} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6 min-h-0', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-600 mt-1">
            Manage your data annotation datasets
          </p>
        </div>
        <Button onClick={onAddDataset} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Dataset
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Dataset Grid */}
      {filteredDatasets.length === 0 ? (
        <div className="text-center py-12">
          <Database className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No datasets found' : 'No datasets yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first dataset'}
          </p>
          {!searchQuery && (
            <Button onClick={onAddDataset}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dataset
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentPageDatasets().map((dataset) => (
            <Card
              key={dataset._id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardClick(dataset)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {dataset.name || 'Untitled Dataset'}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-600">
                      {dataset.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(dataset);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getDatasetTypeColor(dataset.datasetType),
                      )}
                    >
                      {dataset.datasetType?.replace('-', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(dataset.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
          
          {/* Pagination */}
          <DatasetPagination
            totalItems={filteredDatasets.length}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            className="mt-1"
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={datasetToDelete?.name || ''}
        itemType="dataset"
        isLoading={isDeleting}
      />
    </div>
  );
}
