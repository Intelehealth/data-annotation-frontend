'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';

interface CSVColumn {
  name: string;
  sampleData: string;
}

interface CSVColumnsDisplayProps {
  columns: CSVColumn[];
  title?: string;
  description?: string;
}

export function CSVColumnsDisplay({
  columns,
  title = 'CSV Columns',
  description = 'Columns available in the uploaded CSV file',
}: CSVColumnsDisplayProps) {
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Limit columns shown initially
  const columnsToShow = showAllColumns ? columns : columns.slice(0, 20);
  const hasMoreColumns = columns.length > 20;

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
            {columns.length} columns
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {columnsToShow.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No columns available</p>
          </div>
        ) : (
          <>
            {/* Compact Column Display */}
            <div className="flex flex-wrap gap-2">
              {columnsToShow.map((column) => (
                <div
                  key={column.name}
                  className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                  title={column.name}
                >
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {column.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hasMoreColumns && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllColumns(!showAllColumns)}
                  className="h-8 px-4 text-xs"
                >
                  {showAllColumns ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All {columns.length} Columns
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
