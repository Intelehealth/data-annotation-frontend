'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit3,
  GripVertical,
  Eye,
  Volume2,
} from 'lucide-react';
import { ImageThumbnails } from './image-thumbnails';
import { cn } from '@/lib/utils';
import { AnnotationField } from '@/lib/api/csv-imports';

interface ImageOverlay {
  isOpen: boolean;
  imageUrl: string;
  imageUrls: string[];
  currentIndex: number;
}

interface AudioOverlay {
  isOpen: boolean;
  audioUrl: string;
}

interface MetadataDisplayProps {
  metadata: Record<string, any>;
  orderedMetadataFields: AnnotationField[];
  draggedField: string | null;
  editingField: string | null;
  expandedTextFields: Set<string>;
  imageOverlay: ImageOverlay;
  audioOverlay: AudioOverlay;
  onMetadataChange: (metadata: Record<string, any>) => void;
  onDragStart: (e: React.DragEvent, fieldName: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetFieldName: string) => void;
  onEditField: (fieldName: string) => void;
  onSaveField: (fieldName: string, newValue: string) => void;
  onCancelEdit: () => void;
  onToggleTextExpansion: (fieldName: string) => void;
  onOpenImageOverlay: (imageUrls: string[], startIndex?: number) => void;
  onOpenAudioOverlay: (audioUrl: string) => void;
}


// Helper function to format text content for display
const formatTextContent = (content: any, fieldName: string): string => {
  if (!content) return 'N/A';
  
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (typeof content === 'object') {
    if (Array.isArray(content)) {
      text = content.join('\n');
    } else {
      const urlKeys = ['url', 'href', 'src', 'link', 'value'];
      for (const key of urlKeys) {
        if (content[key] && typeof content[key] === 'string') {
          text = content[key];
          break;
        }
      }
      if (!text) {
        text = JSON.stringify(content, null, 2);
      }
    }
  } else {
    text = String(content);
  }
  
  return text;
};

export function MetadataDisplay({
  metadata,
  orderedMetadataFields,
  draggedField,
  editingField,
  expandedTextFields,
  imageOverlay,
  audioOverlay,
  onMetadataChange,
  onDragStart,
  onDragOver,
  onDrop,
  onEditField,
  onSaveField,
  onCancelEdit,
  onToggleTextExpansion,
  onOpenImageOverlay,
  onOpenAudioOverlay,
}: MetadataDisplayProps) {
  return (
    <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Metadata - Row {metadata.rowIndex || 'N/A'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Drag fields to reorder • Click edit to modify content
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orderedMetadataFields.map((field) => (
          <div
            key={field.csvColumnName}
            draggable
            onDragStart={(e) => onDragStart(e, field.csvColumnName)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, field.csvColumnName)}
            className={cn(
              'p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all',
              draggedField === field.csvColumnName && 'opacity-50',
              'hover:shadow-md cursor-move'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <Label className="text-sm font-medium text-gray-700">
                  {field.fieldName}
                  {field.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditField(field.csvColumnName)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>

            {/* Field Content Display */}
            <div className="space-y-2">
              {editingField === field.csvColumnName ? (
                <div className="space-y-2">
                  <Textarea
                    value={metadata[field.csvColumnName] || ''}
                    onChange={(e) => onMetadataChange({
                      ...metadata,
                      [field.csvColumnName]: e.target.value
                    })}
                    className="min-h-[100px]"
                    placeholder="Enter content..."
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onSaveField(field.csvColumnName, metadata[field.csvColumnName] || '')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Text Fields */}
                  {field.fieldType === 'text' && (
                    <div className="p-3 border border-gray-200 rounded-md bg-white">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {(() => {
                          const text = formatTextContent(metadata[field.csvColumnName], field.csvColumnName);
                          const isExpanded = expandedTextFields.has(field.csvColumnName);
                          const lines = text.split('\n');
                          const shouldTruncate = lines.length > 3 && !isExpanded;
                          
                          return (
                            <>
                              {shouldTruncate ? lines.slice(0, 3).join('\n') : text}
                              {lines.length > 3 && (
                                <button
                                  onClick={() => onToggleTextExpansion(field.csvColumnName)}
                                  className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                                >
                                  {isExpanded ? 'See Less' : 'See More'}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Image Fields */}
                  {field.fieldType === 'image' && (
                    <ImageThumbnails
                      imageUrls={metadata[field.csvColumnName] || ''}
                      columnName={field.fieldName}
                      onImageClick={onOpenImageOverlay}
                      maxDisplay={4}
                    />
                  )}

                  {/* Audio Fields */}
                  {field.fieldType === 'audio' && (
                    <div className="p-3 border border-gray-200 rounded-md bg-white">
                      {(() => {
                        const audioUrl = metadata[field.csvColumnName];
                        return audioUrl ? (
                          <div className="flex items-center space-x-3">
                            <Button
                              size="sm"
                              onClick={() => onOpenAudioOverlay(audioUrl)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Volume2 className="h-4 w-4 mr-2" />
                              Play Audio
                            </Button>
                            <span className="text-sm text-gray-600 truncate">
                              {audioUrl}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 text-center">
                            No audio found
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Default display for other field types */}
                  {!['text', 'image', 'audio'].includes(field.fieldType) && (
                    <div className="p-3 border border-gray-200 rounded-md bg-white text-sm text-gray-800 whitespace-pre-wrap">
                      {formatTextContent(metadata[field.csvColumnName], field.csvColumnName)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {orderedMetadataFields.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">📋</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No Metadata Fields</h3>
            <p className="text-sm">
              Configure metadata fields in the field configuration to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
