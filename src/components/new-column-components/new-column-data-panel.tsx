'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Undo, Redo, FileText } from 'lucide-react';
import { AnnotationField, AnnotationConfig } from '@/lib/api/csv-imports';

interface NewColumnData {
  [fieldName: string]: string;
}

interface NewColumnDataPanelProps {
  annotationConfig: AnnotationConfig | null;
  newColumnData: NewColumnData;
  onNewColumnChange: (fieldName: string, value: string) => void;
  onSaveAllNewColumnData: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportCSV: () => void;
  historyIndex: number;
  historyLength: number;
  autoSaveEnabled: boolean;
  isSaving: boolean;
  lastSavedTime: Date | null;
}

export function NewColumnDataPanel({
  annotationConfig,
  newColumnData,
  onNewColumnChange,
  onSaveAllNewColumnData,
  onUndo,
  onRedo,
  onExportCSV,
  historyIndex,
  historyLength,
  autoSaveEnabled,
  isSaving,
  lastSavedTime,
}: NewColumnDataPanelProps) {
  const annotationFields = annotationConfig?.annotationFields.filter(
    (field) => field.isNewColumn || field.isAnnotationField
  ) || [];

  return (
    <div className="w-1/2 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          New Column Data
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter annotation values for the new columns
        </p>
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={historyIndex >= historyLength - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onSaveAllNewColumnData}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save New Column Data'}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Auto-save: {autoSaveEnabled ? 'On (5s)' : 'Off'}</span>
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Saving...</span>
              </div>
            ) : lastSavedTime ? (
              <span className="text-green-600">
                Last saved: {lastSavedTime.toLocaleTimeString()}
              </span>
            ) : (
              <span>Not saved yet</span>
            )}
          </div>
        </div>

        {/* Export CSV Button */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            size="sm"
            onClick={onExportCSV}
            variant="outline"
            className="w-full border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
