'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, CheckCircle } from 'lucide-react';
import { AnnotationField, AnnotationConfig } from '@/lib/api/csv-imports';
import { ExportDropdown, ExportOption } from '@/components/ui/export-dropdown';

interface NewColumnData {
  [fieldName: string]: string;
}

interface NewColumnDataPanelProps {
  annotationConfig: AnnotationConfig | null;
  newColumnData: NewColumnData;
  onNewColumnChange: (fieldName: string, value: string) => void;
  onSaveAllNewColumnData: () => void;
  onExportSelectedColumns: () => void;
  onExportAllColumns: () => void;
  isSaving: boolean;
  completedCount: number;
  pendingCount: number;
}

export function NewColumnDataPanel({
  annotationConfig,
  newColumnData,
  onNewColumnChange,
  onSaveAllNewColumnData,
  onExportSelectedColumns,
  onExportAllColumns,
  isSaving,
  completedCount,
  pendingCount,
}: NewColumnDataPanelProps) {
  const annotationFields = annotationConfig?.annotationFields.filter(
    (field) => field.isNewColumn || field.isAnnotationField
  ) || [];

  // Create export options
  const exportOptions: ExportOption[] = [
    {
      id: 'selected-columns',
      label: 'Export Selected Columns',
      description: 'Export only configured fields and new annotation columns',
      action: onExportSelectedColumns,
    },
    {
      id: 'all-columns',
      label: 'Export All Columns',
      description: 'Export all original CSV columns plus new annotation columns',
      action: onExportAllColumns,
    },
  ];

  const totalCount = completedCount + pendingCount;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-1/2 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              New Column Data
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter annotation values for the new columns
            </p>
          </div>
          <div className="flex items-center space-x-4">
             {/* Progress Indicator (clean bar + counts) */}
             <div className="flex items-center space-x-3">
               <span className="text-xs text-gray-500">Progress</span>
               <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
                 <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionPercent}%` }}></div>
               </div>
               <span className="text-sm font-medium text-gray-700">{completionPercent}%</span>
               <span className="text-xs text-gray-500">({completedCount}/{totalCount})</span>
             </div>

            <ExportDropdown 
              options={exportOptions}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {annotationFields.map((field) => (
          <div key={field.fieldName} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.fieldName}
              {field.isRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Textarea
              value={newColumnData[field.fieldName] || ''}
              onChange={(e) => onNewColumnChange(field.fieldName, e.target.value)}
              placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
              className="min-h-[100px]"
            />
          </div>
        ))}

        {annotationFields.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">✏️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No Annotation Fields</h3>
            <p className="text-sm">
              Configure annotation fields in the field configuration to start annotating.
            </p>
          </div>
        )}
      </div>

      {/* Save Controls */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onSaveAllNewColumnData}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSaving ? 'Completing...' : 'Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
