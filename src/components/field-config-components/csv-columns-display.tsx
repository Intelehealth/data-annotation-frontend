'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Plus } from 'lucide-react';

interface CSVColumn {
  name: string;
  sampleData?: string;
  source?: 'CSV' | 'MANUAL';
  csvImportId?: string;
}

interface CSVColumnsDisplayProps {
  csvColumns: CSVColumn[];
  manualColumns?: CSVColumn[];
  title?: string;
  description?: string;
}

export function CSVColumnsDisplay({
  csvColumns,
  manualColumns = [],
  title = 'Available Columns',
  description = 'Columns available for annotation configuration',
}: CSVColumnsDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-600" />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {csvColumns.length + manualColumns.length} columns
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* CSV Columns */}
          {csvColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                CSV Columns ({csvColumns.length})
              </h4>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-10 gap-2 min-w-max">
                  {csvColumns.map((column) => (
                    <span
                      key={column.name}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm border border-blue-200 text-center truncate rounded-sm"
                      title={column.name}
                    >
                      {column.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Manual Columns */}
          {manualColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                Manual Columns ({manualColumns.length})
              </h4>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-10 gap-2 min-w-max">
                  {manualColumns.map((column) => (
                    <span
                      key={column.name}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm border border-green-200 text-center truncate rounded-sm"
                      title={column.name}
                    >
                      {column.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Columns State */}
          {csvColumns.length === 0 && manualColumns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No columns available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
