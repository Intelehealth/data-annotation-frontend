'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, GripVertical } from 'lucide-react';
import { AnnotationConfig } from '@/lib/api/dataset-annotation-types';
import { ExportDropdown, ExportOption } from '@/components/ui/export-dropdown';
import { ImageThumbnails } from '@/components/annotation-components/image-thumbnails';
import { MarkdownField } from '@/components/annotation-components/markdown-field';
import { NumberField } from '@/components/annotation-components/number-field';
import { cn } from '@/lib/utils';
import { DragDropHelper } from '@/lib/drag-drop-helper';
import { NewColumnInput } from './new-column-input';

interface NewColumnData {
  [fieldName: string]: string;
}

interface NewColumnDataPanelProps {
  annotationConfig: AnnotationConfig | null;
  newColumnData: NewColumnData;
  newColumns?: any[]; // Array of new column definitions
  onNewColumnChange: (fieldName: string, value: string) => void;
  onSaveAllNewColumnData: () => void;
  onExportSelectedColumns: () => void;
  onExportAllColumns: () => void;
  isSaving: boolean;
  datasetId?: string;
  rowIndex?: number;
  imageAuthConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  };
  // Progress tracking props removed as they were unused
  onPanelDragOver?: (e: React.DragEvent) => void;
  onDropFromMetadata?: () => void;
  draggedField?: string | null;
  onAnnotationFieldDragStart?: (e: React.DragEvent, fieldName: string) => void;
  onAnnotationFieldDragOver?: (e: React.DragEvent) => void;
  onAnnotationFieldDrop?: (e: React.DragEvent, targetFieldName: string) => void;
}

export function NewColumnDataPanel({
  annotationConfig,
  newColumnData,
  newColumns = [],
  onNewColumnChange,
  onSaveAllNewColumnData,
  onExportSelectedColumns,
  onExportAllColumns,
  isSaving,
  datasetId,
  rowIndex,
  imageAuthConfig,
  // Progress tracking props removed
  onPanelDragOver,
  onDropFromMetadata,
  draggedField,
  onAnnotationFieldDragStart,
  onAnnotationFieldDragOver,
  onAnnotationFieldDrop,
}: NewColumnDataPanelProps) {
  // State for managing text expansion
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  // State for tracking which textarea is currently being edited
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Show only fields that require annotation
  const annotationFields = annotationConfig?.annotationFields.filter(
    (field) => field.isAnnotationField
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


  // Function to toggle text expansion
  const toggleTextExpansion = (fieldName: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  return (
    <div
      ref={panelRef}
      className="h-full bg-white flex flex-col"
      onDragOver={(e) => {
        if (onPanelDragOver) onPanelDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDropFromMetadata) onDropFromMetadata();
      }}
    >
      {/* Spacer to match left panel navigation button height */}
      <div className="p-4 pb-2">
        <div className="h-10"></div>
      </div>

      <div className="px-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900" data-testid="annotation-panel-title">
            Annotation
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter annotation values
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ExportDropdown 
              options={exportOptions}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {annotationFields.map((field) => {
          // Use DragDropHelper to determine if field can be dragged
          const dragValidation = DragDropHelper.canDragField(field, 'annotation');
          const isDraggable = dragValidation.canDrag;
          // Check drag restrictions for validation
          
          return (
             <div 
               key={field.fieldName} 
               data-testid={`annotation-field-${field.fieldName}`}
               className={cn(
                 "space-y-2 p-4 border border-gray-200 rounded-lg transition-all duration-200",
                 isDraggable ? "bg-gray-50 hover:bg-gray-100 hover:shadow-md cursor-move" : "bg-white",
                 (draggedField === field.csvColumnName || draggedField === field.fieldName) && "opacity-50 bg-blue-50 border-blue-300"
               )}
               draggable={isDraggable}
               onDragStart={isDraggable && onAnnotationFieldDragStart ? (e) => onAnnotationFieldDragStart(e, field.csvColumnName || field.fieldName) : undefined}
               onDragOver={onAnnotationFieldDragOver}
               onDrop={onAnnotationFieldDrop ? (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onAnnotationFieldDrop(e, field.csvColumnName || field.fieldName);
               } : undefined}
             >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {isDraggable && <GripVertical className="h-4 w-4 text-gray-400" />}
                  <Label className="text-sm font-medium text-gray-700">
                    {field.fieldName}
                    {field.isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                </div>
                {field.isNewColumn && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" data-testid={`annotation-field-new-column-${field.fieldName}`}>
                    New Column
                  </div>
                )}
              </div>
              
              {/* Content display with different field types */}
              {(() => {
                const content = newColumnData[field.fieldName] || '';
                
                // Handle image fields
                if (field.fieldType === 'image') {
                  return (
                    <ImageThumbnails
                      imageUrls={content}
                      columnName={field.fieldName}
                      maxDisplay={4}
                      datasetId={datasetId}
                      rowIndex={rowIndex}
                      fieldName={field.fieldName}
                      imageAuthConfig={imageAuthConfig}
                    />
                  );
                }

                // Handle audio fields
                if (field.fieldType === 'audio') {
                  return (
                    <div className="p-3 border border-gray-200 rounded-md bg-white">
                      {content ? (
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 truncate">
                            {content}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center">
                          No audio found
                        </div>
                      )}
                    </div>
                  );
                }

                // Handle markdown fields
                if (field.fieldType === 'markdown') {
                  return (
                    <MarkdownField
                      value={content}
                      onChange={(value) => onNewColumnChange(field.fieldName, value)}
                      placeholder={`Enter ${field.fieldName.toLowerCase()} in markdown...`}
                      fieldName={field.fieldName}
                      isEditing={focusedField === field.fieldName}
                      onEdit={() => setFocusedField(field.fieldName)}
                      onSave={() => setFocusedField(null)}
                      onCancel={() => setFocusedField(null)}
                    />
                  );
                }

                // Handle number fields
                if (field.fieldType === 'number') {
                  return (
                    <NumberField
                      value={content}
                      onChange={(value) => onNewColumnChange(field.fieldName, value)}
                      placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                      fieldName={field.fieldName}
                      isEditing={focusedField === field.fieldName}
                      onEdit={() => setFocusedField(field.fieldName)}
                      onSave={() => setFocusedField(null)}
                      onCancel={() => setFocusedField(null)}
                      allowDecimals={true}
                    />
                  );
                }

                // Handle new columns with special input types
                if (field.isNewColumn && field.newColumnId) {
                  const newColumn = newColumns.find(col => col.id === field.newColumnId);
                  if (newColumn) {
                    return (
                      <NewColumnInput
                        column={newColumn}
                        value={content}
                        onChange={(value) => onNewColumnChange(field.fieldName, value)}
                        placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                      />
                    );
                  }
                }

                // Handle regular text fields and other types
                const lines = content.split('\n');
                const isExpanded = expandedFields.has(field.fieldName);
                const shouldTruncate = lines.length > 6 && !isExpanded;
                const isCurrentlyEditing = focusedField === field.fieldName;
                
                return (
                  <div className="space-y-2">
                    <Textarea
                      value={content}
                      onChange={(e) => {
                        onNewColumnChange(field.fieldName, e.target.value);
                        // Auto-resize textarea - start from 100px, grow based on content
                        e.target.style.height = 'auto';
                        const contentHeight = e.target.scrollHeight;
                        const minHeight = 100;
                        const maxHeight = 400;
                        e.target.style.height = Math.min(Math.max(minHeight, contentHeight), maxHeight) + 'px';
                      }}
                      onFocus={() => setFocusedField(field.fieldName)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                      className="min-h-[100px] resize-y overflow-hidden"
                      style={{ 
                        height: (() => {
                          const charCount = content.length;
                          // If user is editing, use full content height
                          if (isCurrentlyEditing) {
                            if (charCount > 0) {
                              const estimatedHeight = Math.max(100, lines.length * 24 + 20);
                              return Math.min(estimatedHeight, 400) + 'px';
                            }
                            return '100px';
                          }
                          // If not editing, use truncated height when applicable
                          if (charCount > 0) {
                            const displayLines = shouldTruncate ? 6 : lines.length;
                            const estimatedHeight = Math.max(100, displayLines * 24 + 20);
                            return Math.min(estimatedHeight, 400) + 'px';
                          }
                          return '100px';
                        })()
                      }}
                    />
                    
                    {/* See More/Less button for long content - only show when NOT editing */}
                    {lines.length > 6 && !isCurrentlyEditing && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleTextExpansion(field.fieldName)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          {isExpanded ? 'See Less' : 'See More'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}

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
            data-testid="new-column-panel-save-button"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save and Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
