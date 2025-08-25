"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft,
  ChevronRight,
  Save,
  Undo,
  Redo,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  AudioLines
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import annotation components (make sure these files exist or adjust the import paths as needed)
import { TextAnnotationTool } from "@/components/project-components/text-annotation-tool";
import { ImageAnnotationTool } from "@/components/project-components/image-annotation-tool";
import { AudioAnnotationTool } from "@/components/project-components/audio-annotation-tool";

interface Task {
  id: string;
  fileName: string;
  fileType: 'text' | 'image' | 'audio';
  filePath: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
  assignedTo?: string;
  metadata?: Record<string, any>;
  annotations?: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationWorkbenchProps {
  projectId: string;
  projectSchema: {
    metadataFields: any[];
    labelSchema: any[];
  };
}

export function AnnotationWorkbench({ projectId, projectSchema }: AnnotationWorkbenchProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: "1",
        fileName: "document1.txt",
        fileType: "text",
        filePath: "/files/document1.txt",
        status: "pending",
        metadata: {},
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "2", 
        fileName: "image1.jpg",
        fileType: "image",
        filePath: "/files/image1.jpg",
        status: "in_progress",
        metadata: {},
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "3",
        fileName: "audio1.mp3",
        fileType: "audio", 
        filePath: "/files/audio1.mp3",
        status: "completed",
        metadata: {},
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "4",
        fileName: "document2.txt",
        fileType: "text",
        filePath: "/files/document2.txt",
        status: "completed",
        metadata: {},
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "5",
        fileName: "image2.jpg",
        fileType: "image",
        filePath: "/files/image2.jpg",
        status: "pending",
        metadata: {},
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setTasks(mockTasks);
  }, []);

  const currentTask = tasks[currentTaskIndex];

  // Autosave functionality
  const saveProgress = useCallback(() => {
    if (!currentTask) return;
    
    const updatedTask = {
      ...currentTask,
      metadata,
      annotations,
      updatedAt: new Date()
    };
    
    // Save to localStorage
    localStorage.setItem(`task_${currentTask.id}`, JSON.stringify(updatedTask));
    
    // Update tasks array
    setTasks(prev => prev.map(task => 
      task.id === currentTask.id ? updatedTask : task
    ));
  }, [currentTask, metadata, annotations]);

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const interval = setInterval(saveProgress, 3000);
    return () => clearInterval(interval);
  }, [saveProgress, autoSaveEnabled]);

  // Undo/Redo functionality
  const addToHistory = useCallback((state: any) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory.slice(-20); // Keep last 20 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setMetadata(prevState.metadata);
      setAnnotations(prevState.annotations);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMetadata(nextState.metadata);
      setAnnotations(nextState.annotations);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveProgress();
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            navigateTask('prev');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateTask('next');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProgress, undo, redo]);

  const navigateTask = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentTaskIndex > 0) {
      setCurrentTaskIndex(prev => prev - 1);
    } else if (direction === 'next' && currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const annotatedTasks = filteredTasks.filter(task => task.status === "completed");
  const unannotatedTasks = filteredTasks.filter(task => task.status !== "completed");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'needs_review':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'text':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case 'audio':
        return <AudioLines className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderAnnotationTool = () => {
    if (!currentTask) return null;

    switch (currentTask.fileType) {
      case 'text':
        return (
          <TextAnnotationTool
            taskId={currentTask.id}
            filePath={currentTask.filePath}
            labelSchema={projectSchema.labelSchema}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
          />
        );
      case 'image':
        return (
          <ImageAnnotationTool
            taskId={currentTask.id}
            filePath={currentTask.filePath}
            labelSchema={projectSchema.labelSchema}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
          />
        );
      case 'audio':
        return (
          <AudioAnnotationTool
            taskId={currentTask.id}
            filePath={currentTask.filePath}
            labelSchema={projectSchema.labelSchema}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
          />
        );
      default:
        return <div>Unsupported file type</div>;
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Column 1: File Grid with Two Sections */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Files</h2>
          
          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Files</option>
              <option value="pending">Unannotated</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Annotated</option>
            </select>
          </div>
        </div>

        {/* File Grid with Two Columns */}
        <div className="flex-1 overflow-y-auto">
          {/* Unannotated Files Section */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              Unannotated ({unannotatedTasks.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {unannotatedTasks.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  <p className="text-xs">No unannotated files</p>
                </div>
              ) : (
                unannotatedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setCurrentTaskIndex(tasks.indexOf(task))}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      currentTask?.id === task.id 
                        ? "border-blue-500 bg-blue-50 shadow-md" 
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFileIcon(task.fileType)}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {task.fileName}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          {getStatusIcon(task.status)}
                          <span className="text-xs text-gray-500 ml-1 capitalize">
                            {task.status === 'pending' ? 'Unannotated' : 
                             task.status === 'in_progress' ? 'In Progress' : task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Annotated Files Section */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Annotated ({annotatedTasks.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {annotatedTasks.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  <p className="text-xs">No annotated files</p>
                </div>
              ) : (
                annotatedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setCurrentTaskIndex(tasks.indexOf(task))}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      currentTask?.id === task.id 
                        ? "border-blue-500 bg-blue-50 shadow-md" 
                        : "border-green-200 bg-green-50 hover:border-green-300"
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        {getFileIcon(task.fileType)}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {task.fileName}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          {getStatusIcon(task.status)}
                          <span className="text-xs text-green-600 font-medium">
                            Annotated
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* File Count */}
        <div className="p-3 border-t border-gray-100">
          <div className="text-center">
            <span className="text-sm text-gray-600">
              {filteredTasks.length} file{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Column 2: Annotation Interface or File Info */}
      <div className="flex-1 bg-white">
        {currentTask ? (
          // Show three-column annotation interface when file is selected
          <div className="flex h-full">
            {/* Metadata Panel */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {projectSchema.metadataFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        value={metadata[field.name] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.defaultValue}
                        className="h-8"
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <select
                        value={metadata[field.name] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full h-8 px-3 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={metadata[field.name] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.defaultValue}
                        className="h-8"
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={metadata[field.name] || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="h-8"
                      />
                    )}
                    
                    {field.type === 'boolean' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={metadata[field.name] || false}
                          onChange={(e) => setMetadata(prev => ({ ...prev, [field.name]: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Yes</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Save Controls */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={saveProgress}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Auto-save: {autoSaveEnabled ? 'On' : 'Off'}</span>
                  <span>Last saved: Just now</span>
                </div>
              </div>
            </div>

            {/* Annotation Tools */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Annotating: {currentTask.fileName}
                  </h2>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      currentTask.status === 'completed' && "bg-green-100 text-green-800",
                      currentTask.status === 'in_progress' && "bg-blue-100 text-blue-800",
                      currentTask.status === 'pending' && "bg-gray-100 text-gray-800",
                      currentTask.status === 'needs_review' && "bg-orange-100 text-orange-800"
                    )}>
                      {currentTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {renderAnnotationTool()}
              </div>
            </div>
          </div>
        ) : (
          // Show welcome message when no file is selected
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-gray-400">📝</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Select a file to start annotating</h3>
              <p className="text-sm">Click on any file from the left panel to begin annotation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
