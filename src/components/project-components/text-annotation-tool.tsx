"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Type,
  Tag,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextAnnotator } from "react-text-annotate";

interface TextAnnotation {
  id: string;
  start: number;
  end: number;
  text: string;
  label: string;
  color: string;
  confidence?: number;
  attributes?: Record<string, any>;
}

interface TextAnnotationToolProps {
  taskId: string;
  filePath: string;
  labelSchema: any[];
  annotations: TextAnnotation[];
  onAnnotationsChange: (annotations: TextAnnotation[]) => void;
}

export function TextAnnotationTool({ 
  taskId, 
  filePath, 
  labelSchema, 
  annotations, 
  onAnnotationsChange 
}: TextAnnotationToolProps) {
  const [textContent, setTextContent] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [activeLabel, setActiveLabel] = useState<string>("");

  // Mock text content - replace with actual file loading
  useEffect(() => {
    const mockText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;
    
    setTextContent(mockText);
  }, [filePath]);

  // Convert annotations to react-text-annotate format
  const getAnnotateValue = useCallback(() => {
    return annotations.map(annotation => ({
      start: annotation.start,
      end: annotation.end,
      text: annotation.text,
      tag: annotation.label,
      color: annotation.color
    }));
  }, [annotations]);

  // Handle annotation changes from react-text-annotate
  const handleAnnotationChange = useCallback((newAnnotations: Array<{start: number, end: number, text: string, tag: string, color: string}>) => {
    const convertedAnnotations: TextAnnotation[] = newAnnotations.map((ann, index) => ({
      id: Date.now().toString() + index,
      start: ann.start,
      end: ann.end,
      text: ann.text,
      label: ann.tag,
      color: ann.color || '#3b82f6'
    }));
    
    onAnnotationsChange(convertedAnnotations);
  }, [onAnnotationsChange]);

  // Remove annotation
  const removeAnnotation = useCallback((annotationId: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== annotationId));
  }, [annotations, onAnnotationsChange]);

  // Get label color
  const getLabelColor = useCallback((labelName: string) => {
    const label = labelSchema.find(l => l.name === labelName);
    return label?.color || '#3b82f6';
  }, [labelSchema]);

  return (
    <div className="flex h-full">
      {/* Main text area */}
      <div className="flex-1 p-6">
        <div className="h-full flex flex-col">
          {/* Text content */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
            {showLabels ? (
              <TextAnnotator
                value={getAnnotateValue()}
                onChange={handleAnnotationChange as any}
                content={textContent}
                style={{
                  lineHeight: '1.6',
                  fontSize: '16px',
                  fontFamily: 'inherit'
                }}
                getSpan={(span: any) => ({
                  ...span,
                  style: {
                    backgroundColor: `${span.color}20`,
                    borderBottom: `2px solid ${span.color}`,
                    padding: '2px 4px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }
                })}
              />
            ) : (
              <div className="text-base leading-relaxed whitespace-pre-wrap">
                {textContent}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel - Labels and annotations */}
      <div className="w-80 border-l border-gray-200 bg-gray-50">
        <div className="p-4 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className="h-8 w-8 p-0"
              >
                {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Label schema */}
          <div className="space-y-2">
            {labelSchema.map((label, index) => (
              <div
                key={label.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  activeLabel === label.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                )}
                onClick={() => setActiveLabel(label.id)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {label.name}
                    </span>
                    {label.hotkey && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">
                        {label.hotkey}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {annotations.filter(a => a.label === label.name).length}
                </span>
              </div>
            ))}
          </div>

          {/* Current annotations */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Annotations ({annotations.length})
            </h4>
            
            {annotations.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No annotations yet. Select text to start annotating.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-2 bg-white border border-gray-200 rounded text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {annotation.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnnotation(annotation.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-gray-600 truncate">
                      "{annotation.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Quick Tips
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Click and drag to select text</li>
                <li>• Choose a label from the right panel</li>
                <li>• Click on annotations to remove them</li>
                <li>• Toggle labels visibility with the eye icon</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
