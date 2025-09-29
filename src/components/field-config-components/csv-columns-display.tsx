'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSVColumn {
  name: string;
  sampleData?: string;
  source?: 'CSV' | 'MANUAL';
  csvImportId?: string;
}

interface CSVColumnsDisplayProps {
  csvColumns: CSVColumn[];
  manualColumns?: CSVColumn[];
  selectedColumns: Set<string>;
  onColumnClick: (columnName: string) => void;
  title?: string;
  description?: string;
}

export function CSVColumnsDisplay({
  csvColumns,
  manualColumns = [],
  selectedColumns,
  onColumnClick,
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
                  {csvColumns.map((column) => {
                    const isSelected = selectedColumns.has(column.name);
                    return (
                      <span
                        key={column.name}
                        onClick={() => onColumnClick(column.name)}
                        className={cn(
                          "px-3 py-1 text-sm border text-center truncate rounded-sm cursor-pointer transition-all duration-200 hover:scale-105",
                          isSelected
                            ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                            : "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                        )}
                        title={`${column.name} - Click to ${isSelected ? 'remove' : 'add'} to annotation fields`}
                      >
                        {column.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Manual Columns (non-clickable) */}
          {manualColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                Manual Columns ({manualColumns.length})
              </h4>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-10 gap-2 min-w-max">
                  {manualColumns.map((column) => {
                    const isSelected = selectedColumns.has(column.name);
                    return (
                      <span
                        key={column.name}
                        className={cn(
                          "px-3 py-1 text-sm border text-center truncate rounded-sm select-none",
                          isSelected
                            ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        )}
                      >
                        {column.name}
                      </span>
                    );
                  })}
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
