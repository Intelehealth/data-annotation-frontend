'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  X,
  CloudUpload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface CSVUploadComponentProps {
  projectId: string;
  selectedDatasetId: string;
  onCSVUploaded?: (
    csvImportId: string,
    fileName: string,
    totalRows: number,
  ) => void;
  className?: string;
}

export function CSVUploadComponent({
  projectId,
  selectedDatasetId,
  onCSVUploaded,
  className,
}: CSVUploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvPreview, setCSVPreview] = useState<{
    columns: string[];
    sampleRows: Record<string, any>[];
    totalRows: number;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setCSVPreview(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setCSVPreview(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setCSVPreview(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedDatasetId) {
      alert('Please select a dataset first');
      return;
    }

    if (!selectedFile) {
      alert('Please select a CSV file to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId);

      const response = await api.post(
        `/csv-processing/upload/${selectedDatasetId}`,
        formData,
      );

      const result = response.data;

      setUploadStatus('success');
      setUploadProgress(100);

      // Call callback with upload result
      if (onCSVUploaded) {
        onCSVUploaded(result.csvImportId, result.fileName, result.totalRows);
      }

      // Show success message
      alert(`CSV uploaded successfully! ${result.totalRows} rows processed.`);

      // Reset form after successful upload
      setTimeout(() => {
        removeFile();
      }, 2000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const previewCSV = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const columns = lines[0]?.split(',').map((col) => col.trim()) || [];
      const sampleRows = lines.slice(1, 6).map((line) => {
        const values = line.split(',').map((val) => val.trim());
        const row: Record<string, any> = {};
        columns.forEach((col, index) => {
          row[col] = values[index] || '';
        });
        return row;
      });

      setCSVPreview({
        columns,
        sampleRows,
        totalRows: lines.length - 1,
      });
    };
    reader.readAsText(selectedFile);
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'idle':
        return <div className="h-3 w-3 rounded-full bg-gray-300" />;
      case 'uploading':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50',
        )}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('csvFileInput')?.click()}
      >
        <div className="flex flex-col items-center space-y-3">
          <div
            className={cn(
              'p-3 rounded-full transition-colors',
              isDragOver ? 'bg-blue-100' : 'bg-gray-100',
            )}
          >
            <CloudUpload
              className={cn(
                'h-8 w-8 transition-colors',
                isDragOver ? 'text-blue-600' : 'text-gray-500',
              )}
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-medium text-gray-900">
              {isDragOver
                ? 'Drop CSV file here'
                : 'Click to upload or drag & drop CSV file'}
            </h3>
            <p className="text-sm text-gray-500">
              Support for CSV files with metadata columns
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('csvFileInput')?.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select CSV File
          </Button>
        </div>

        <input
          id="csvFileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Selected CSV File
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate max-w-48">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <Button
                variant="outline"
                size="sm"
                onClick={previewCSV}
                className="h-7 px-2"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            </div>
          </div>

          {/* CSV Preview */}
          {csvPreview && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  CSV Preview
                </h4>
                <span className="text-xs text-gray-500">
                  {csvPreview.totalRows} total rows
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {csvPreview.columns.map((column, index) => (
                        <th
                          key={index}
                          className="text-left py-2 px-2 font-medium text-gray-700"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {csvPreview.columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="py-1 px-2 text-gray-600"
                          >
                            {row[column] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              className="w-full"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || !selectedDatasetId}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Supported CSV Formats
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div>• CSV files (.csv)</div>
          <div>• Excel files (.xlsx, .xls)</div>
          <div>• UTF-8 encoding</div>
          <div>• Max Size: 50MB</div>
        </div>
      </div>
    </div>
  );
}
