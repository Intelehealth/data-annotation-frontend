"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Square,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  MousePointer,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  confidence?: number;
  attributes?: Record<string, any>;
}

interface ImageAnnotationToolProps {
  taskId: string;
  filePath: string;
  labelSchema: any[];
  annotations: BoundingBox[];
  onAnnotationsChange: (annotations: BoundingBox[]) => void;
}

export function ImageAnnotationTool({ 
  taskId, 
  filePath, 
  labelSchema, 
  annotations, 
  onAnnotationsChange 
}: ImageAnnotationToolProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'bbox'>('select');
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<Partial<BoundingBox> | null>(null);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock image - replace with actual file loading
  useEffect(() => {
    // For demo purposes, using a placeholder image
    const mockImageUrl = "https://via.placeholder.com/800x600/f0f0f0/333333?text=Sample+Image";
    setImageUrl(mockImageUrl);
  }, [filePath]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  }, []);

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const x = ((screenX - rect.left) / zoom - pan.x) * (imageDimensions.width / canvas.width);
    const y = ((screenY - rect.top) / zoom - pan.y) * (imageDimensions.height / canvas.height);
    
    return { x: Math.max(0, Math.min(imageDimensions.width, x)), y: Math.max(0, Math.min(imageDimensions.height, y)) };
  }, [zoom, pan, imageDimensions]);

  // Convert image coordinates to screen coordinates
  const imageToScreen = useCallback((imageX: number, imageY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const x = (imageX * canvas.width / imageDimensions.width + pan.x) * zoom;
    const y = (imageY * canvas.height / imageDimensions.height + pan.y) * zoom;
    
    return { x, y };
  }, [zoom, pan, imageDimensions]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || tool !== 'bbox' || !activeLabel) return;
    
    const { x, y } = screenToImage(e.clientX, e.clientY);
    setIsDrawing(true);
    setCurrentBox({
      x,
      y,
      width: 0,
      height: 0,
      label: labelSchema.find(l => l.id === activeLabel)?.name || '',
      color: labelSchema.find(l => l.id === activeLabel)?.color || '#3b82f6'
    });
  }, [tool, activeLabel, labelSchema, screenToImage]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentBox || !canvasRef.current) return;
    
    const { x, y } = screenToImage(e.clientX, e.clientY);
    setCurrentBox(prev => ({
      ...prev!,
      width: x - prev!.x!,
      height: y - prev!.y!
    }));
  }, [isDrawing, currentBox, screenToImage]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentBox) return;
    
    // Only add box if it has meaningful dimensions
    if (Math.abs(currentBox.width!) > 10 && Math.abs(currentBox.height!) > 10) {
      const newBox: BoundingBox = {
        id: Date.now().toString(),
        x: currentBox.x!,
        y: currentBox.y!,
        width: Math.abs(currentBox.width!),
        height: Math.abs(currentBox.height!),
        label: currentBox.label!,
        color: currentBox.color!
      };
      
      // Normalize negative dimensions
      if (currentBox.width! < 0) {
        newBox.x = currentBox.x! + currentBox.width!;
      }
      if (currentBox.height! < 0) {
        newBox.y = currentBox.y! + currentBox.height!;
      }
      
      onAnnotationsChange([...annotations, newBox]);
    }
    
    setIsDrawing(false);
    setCurrentBox(null);
  }, [isDrawing, currentBox, annotations, onAnnotationsChange]);

  // Remove annotation
  const removeAnnotation = useCallback((annotationId: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== annotationId));
    setSelectedBox(null);
  }, [annotations, onAnnotationsChange]);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageDimensions.width) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width / zoom, canvas.height / zoom);
    
    // Draw bounding boxes
    if (showLabels) {
      annotations.forEach(box => {
        const scaleX = canvas.width / zoom / imageDimensions.width;
        const scaleY = canvas.height / zoom / imageDimensions.height;
        
        ctx.strokeStyle = box.color;
        ctx.fillStyle = box.color + '20';
        ctx.lineWidth = 2 / zoom;
        
        const x = box.x * scaleX;
        const y = box.y * scaleY;
        const width = box.width * scaleX;
        const height = box.height * scaleY;
        
        // Fill box
        ctx.fillRect(x, y, width, height);
        
        // Stroke box
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        ctx.fillStyle = box.color;
        ctx.font = `${12 / zoom}px sans-serif`;
        ctx.fillText(box.label, x, y - 5 / zoom);
      });
    }
    
    // Draw current box being drawn
    if (currentBox && currentBox.width && currentBox.height) {
      const scaleX = canvas.width / zoom / imageDimensions.width;
      const scaleY = canvas.height / zoom / imageDimensions.height;
      
      ctx.strokeStyle = currentBox.color!;
      ctx.fillStyle = currentBox.color! + '20';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      
      const x = currentBox.x! * scaleX;
      const y = currentBox.y! * scaleY;
      const width = currentBox.width * scaleX;
      const height = currentBox.height * scaleY;
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      ctx.setLineDash([]);
    }
    
    // Restore context
    ctx.restore();
  }, [imageDimensions, zoom, pan, annotations, currentBox, showLabels]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys for label selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= labelSchema.length) {
        setActiveLabel(labelSchema[num - 1].id);
        setTool('bbox');
      }
      
      // Tool shortcuts
      switch (e.key) {
        case 'v':
          setTool('select');
          break;
        case 'b':
          setTool('bbox');
          break;
        case 'r':
          resetView();
          break;
        case 'Delete':
          if (selectedBox) {
            removeAnnotation(selectedBox);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [labelSchema, selectedBox, removeAnnotation, resetView]);

  return (
    <div className="flex h-full">
      {/* Main image area */}
      <div className="flex-1 p-4">
        <div className="h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                Select (V)
              </Button>
              <Button
                variant={tool === 'bbox' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('bbox')}
                disabled={!activeLabel}
              >
                <Square className="h-4 w-4 mr-2" />
                Bbox (B)
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(-0.2)}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(0.2)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
              >
                {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Image canvas */}
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-gray-100 rounded-lg border border-gray-200"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Annotation target"
              className="hidden"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="absolute inset-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        </div>
      </div>

      {/* Right panel - Labels and annotations */}
      <div className="w-80 border-l border-gray-200 bg-gray-50">
        <div className="p-4 space-y-4">
          {/* Active label indicator */}
          {activeLabel && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: labelSchema.find(l => l.id === activeLabel)?.color }}
                  />
                  <span className="text-sm font-medium text-blue-900">
                    Active: {labelSchema.find(l => l.id === activeLabel)?.name}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {tool === 'bbox' ? 'Click and drag to create bounding box' : 'Select a tool to start annotating'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Label schema */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
            {labelSchema.map((label, index) => (
              <div
                key={label.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  activeLabel === label.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                )}
                onClick={() => {
                  setActiveLabel(label.id);
                  setTool('bbox');
                }}
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
                No annotations yet. Select a label and draw bounding boxes.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={cn(
                      "p-2 bg-white border rounded text-sm cursor-pointer transition-colors",
                      selectedBox === annotation.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedBox(annotation.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="font-medium text-gray-900">
                          {annotation.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(annotation.id);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {Math.round(annotation.width)} × {Math.round(annotation.height)}px
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
                <li>• Use number keys 1-9 to select labels</li>
                <li>• Press V for select tool, B for bbox tool</li>
                <li>• Click and drag to create bounding boxes</li>
                <li>• Press R to reset zoom and pan</li>
                <li>• Delete key to remove selected annotation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
