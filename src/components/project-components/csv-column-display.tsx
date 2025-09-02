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
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { fieldSelectionAPI } from '@/lib/api';

interface CSVColumn {
  name: string;
  sampleData: string;
  dataType: string;
}

interface CSVColumnDisplayProps {
  csvImportId: string;
  projectId: string;
}

export function CSVColumnDisplay({
  csvImportId,
  projectId,
}: CSVColumnDisplayProps) {
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (csvImportId) {
      loadCSVColumns();
    }
  }, [csvImportId]);

  const loadCSVColumns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use fieldSelectionAPI to get CSV columns
      const csvData = await fieldSelectionAPI.getCSVColumns(csvImportId);

      if (csvData.columns && Array.isArray(csvData.columns)) {
        // Convert backend columns to component format
        const columns: CSVColumn[] = csvData.columns.map(
          (columnName: string, index: number) => ({
            name: columnName,
            sampleData: `Column ${index + 1}`,
            dataType: 'string', // Default type
          }),
        );

        setCsvColumns(columns);
      } else {
        throw new Error('No columns found in CSV data');
      }
    } catch (err) {
      console.error('Error loading CSV columns:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load CSV columns',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Loading CSV Columns...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading CSV data from server...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Error Loading CSV</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-300" />
            <p className="text-lg font-medium mb-2">Failed to Load CSV Data</p>
            <p className="text-sm mb-4">{error}</p>
            <Button
              onClick={loadCSVColumns}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Available CSV Columns ({csvColumns.length})</span>
        </CardTitle>
        <CardDescription>
          These are the columns available in your uploaded CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {csvColumns.map((column) => (
            <div
              key={column.name}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-900">
                  {column.name}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                  {column.dataType}
                </span>
              </div>
              <p className="text-xs text-gray-600 truncate">
                Sample: {column.sampleData}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
