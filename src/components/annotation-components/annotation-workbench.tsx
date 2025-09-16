'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Image as ImageIcon,
  AudioLines,
  Loader2,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AnnotationsAPI, Annotation } from '@/lib/api/annotations';
import {
  CSVImport,
  AnnotationConfig,
  AnnotationField,
} from '@/lib/api/csv-imports';
import { fieldSelectionAPI } from '@/lib/api/field-config';
import { csvProcessingAPI } from '@/lib/api/csv-processing';
import { RowFooter, NewColumnDataPanel } from '@/components/new-column-components';
import { MetadataDisplay } from './metadata-display';
import { ImageOverlay, AudioOverlay } from './media-overlays';

interface Task {
  id: string;
  rowIndex: number;
  fileName: string;
  fileType: 'text' | 'image' | 'audio';
  filePath: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
  assignedTo?: string;
  metadata?: Record<string, any>;
  annotations?: Annotation[];
  createdAt: Date;
  updatedAt: Date;
}

interface NewColumnData {
  [fieldName: string]: string;
}

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

interface AnnotationWorkbenchProps {
  csvImportId: string;
  datasetId: string;
}

export function AnnotationWorkbench({
  csvImportId,
  datasetId,
}: AnnotationWorkbenchProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newColumnData, setNewColumnData] = useState<NewColumnData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotationConfig, setAnnotationConfig] =
    useState<AnnotationConfig | null>(null);
  const [csvImport, setCsvImport] = useState<CSVImport | null>(null);
  const [orderedMetadataFields, setOrderedMetadataFields] = useState<AnnotationField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedTextFields, setExpandedTextFields] = useState<Set<string>>(new Set());
  const [imageOverlay, setImageOverlay] = useState<ImageOverlay>({
    isOpen: false,
    imageUrl: '',
    imageUrls: [],
    currentIndex: 0,
  });
  const [audioOverlay, setAudioOverlay] = useState<AudioOverlay>({
    isOpen: false,
    audioUrl: '',
  });
  const [draggedField, setDraggedField] = useState<string | null>(null);

  // Initialize ordered metadata fields when annotation config changes
  useEffect(() => {
    if (annotationConfig) {
      // Metadata fields are existing CSV columns that are NOT new columns
      const metadataFields = annotationConfig.annotationFields.filter(
        (field) => field.isMetadataField && !field.isNewColumn
      );
      console.log('Metadata fields (existing CSV columns only):', metadataFields.map(f => ({
        csvColumnName: f.csvColumnName,
        fieldName: f.fieldName,
        isMetadataField: f.isMetadataField,
        isNewColumn: f.isNewColumn,
        isAnnotationField: f.isAnnotationField
      })));
      setOrderedMetadataFields(metadataFields);
    }
  }, [annotationConfig]);

  // Load CSV import data and annotation config
  useEffect(() => {
    console.log('AnnotationWorkbench useEffect triggered');
    console.log('csvImportId:', csvImportId);
    console.log('datasetId:', datasetId);
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading data for csvImportId:', csvImportId);

        // Load CSV import data using csv-processing API
        console.log('Loading CSV import data...');
        const csvData = await csvProcessingAPI.getCSVData(csvImportId);
        console.log('CSV import data loaded:', csvData);
        setCsvImport(csvData);

        // Load annotation config using datasetId
        console.log('Loading annotation config for dataset:', datasetId);
        try {
          console.log(
            'Making API call to fieldSelectionAPI.getDatasetFieldConfig...',
          );
          const config = await fieldSelectionAPI.getDatasetFieldConfig(
            datasetId,
          );
          console.log('API call completed successfully');
          console.log('Dataset field config loaded:', config);
          console.log('Config annotationFields:', config?.annotationFields);
          console.log('Config annotationLabels:', config?.annotationLabels);
          if (config) {
            // Transform the dataset config to match the expected AnnotationConfig format
            const annotationConfig: AnnotationConfig = {
              _id: config._id || '',
              csvImportId: csvImportId,
              userId: user?._id,
              annotationFields: config.annotationFields || [],
              annotationLabels: config.annotationLabels || [],
              rowAnnotations: [],
              totalRows: csvData.totalRows,
              completedRows: 0,
              status: 'active',
              createdAt: config.createdAt || new Date().toISOString(),
              updatedAt: config.updatedAt || new Date().toISOString(),
            };
            console.log('Transformed annotation config:', annotationConfig);
            console.log(
              'Annotation fields count:',
              annotationConfig.annotationFields.length,
            );
            console.log(
              'Annotation labels count:',
              annotationConfig.annotationLabels?.length || 0,
            );
            console.log(
              'All annotation fields:',
              annotationConfig.annotationFields.map((f) => ({
                csvColumnName: f.csvColumnName,
                fieldName: f.fieldName,
                isAnnotationField: f.isAnnotationField,
                isMetadataField: f.isMetadataField,
              })),
            );
            setAnnotationConfig(annotationConfig);
          } else {
            throw new Error('No field configuration found');
          }
        } catch (configError) {
          console.log('Error loading annotation config:', configError);
          console.log(
            'Config error details:',
            configError instanceof Error
              ? configError.message
              : String(configError),
          );
          console.log('No annotation config found, creating default config...');
          // If no annotation config exists, create a default one
          const defaultConfig: AnnotationConfig = {
            _id: '',
            csvImportId,
            userId: user?._id,
            annotationFields: [],
            rowAnnotations: [],
            totalRows: csvData.totalRows,
            completedRows: 0,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setAnnotationConfig(defaultConfig);
        }

        // Convert CSV rows to tasks
        console.log('CSV data structure:', {
          hasRowData: !!csvData.rowData,
          rowDataLength: csvData.rowData?.length,
          totalRows: csvData.totalRows,
        });

        let taskData: Task[] = [];

        if (csvData.rowData && Array.isArray(csvData.rowData)) {
          taskData = csvData.rowData.map((row: any) => ({
            id: `row-${row.rowIndex}`,
            rowIndex: row.rowIndex,
            fileName: `Row ${row.rowIndex}`,
            fileType: 'text', // Default to text, will be determined by annotation fields
            filePath: `/csv/${csvImportId}/row/${row.rowIndex}`,
            status: 'pending',
            metadata: row.data || {},
            annotations: [],
            createdAt: new Date(csvData.createdAt),
            updatedAt: new Date(csvData.updatedAt),
          }));
        } else {
          // If no rowData, create tasks based on totalRows
          console.log(
            'No rowData found, creating tasks based on totalRows:',
            csvData.totalRows,
          );
          taskData = Array.from({ length: csvData.totalRows }, (_, index) => ({
            id: `row-${index + 1}`,
            rowIndex: index + 1,
            fileName: `Row ${index + 1}`,
            fileType: 'text',
            filePath: `/csv/${csvImportId}/row/${index + 1}`,
            status: 'pending',
            metadata: {},
            annotations: [],
            createdAt: new Date(csvData.createdAt),
            updatedAt: new Date(csvData.updatedAt),
          }));
        }

        // Initialize metadata with actual CSV data
        if (
          taskData.length > 0 &&
          csvData.rowData &&
          csvData.rowData.length > 0
        ) {
          const firstRowData = csvData.rowData[0].data;
          console.log('Initializing metadata with CSV data:', firstRowData);
          setMetadata(firstRowData);
        }

        console.log('Tasks created:', taskData.length, 'tasks');
        setTasks(taskData);

        // Initialize new column data for annotation fields
        if (annotationConfig && annotationConfig.annotationFields.length > 0) {
          const annotationFields = annotationConfig.annotationFields.filter(
            (field) => field.isNewColumn || field.isAnnotationField
          );
          console.log('Annotation fields (new columns):', annotationFields.map(f => ({
            csvColumnName: f.csvColumnName,
            fieldName: f.fieldName,
            isMetadataField: f.isMetadataField,
            isAnnotationField: f.isAnnotationField,
            isNewColumn: f.isNewColumn
          })));
          const initialNewColumnData: NewColumnData = {};
          annotationFields.forEach((field) => {
            initialNewColumnData[field.fieldName] = '';
          });
          setNewColumnData(initialNewColumnData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(
          `Failed to load annotation data: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    if (csvImportId) {
      loadData();
    }
  }, [csvImportId, datasetId]);

  const currentTask = tasks[currentTaskIndex];

  // Load annotations for current task
  useEffect(() => {
    const loadAnnotations = async () => {
      if (!currentTask || !csvImportId) return;

      try {
        const rowAnnotations = await AnnotationsAPI.findByCSVRow(
          csvImportId,
          currentTask.rowIndex,
        );
        setAnnotations(rowAnnotations);
      } catch (err) {
        console.error('Error loading annotations:', err);
      }
    };

    loadAnnotations();
  }, [currentTask, csvImportId]);

  // Determine file type based on annotation fields
  const getFileTypeForTask = (task: Task): 'text' | 'image' | 'audio' => {
    if (!annotationConfig) return 'text';

    const annotationFields = annotationConfig.annotationFields.filter(
      (field) => field.isAnnotationField,
    );
    if (annotationFields.length === 0) return 'text';

    // Check if any field is image or audio type
    const hasImageField = annotationFields.some(
      (field) => field.fieldType === 'image',
    );
    const hasAudioField = annotationFields.some(
      (field) => field.fieldType === 'audio',
    );

    if (hasImageField) return 'image';
    if (hasAudioField) return 'audio';
    return 'text';
  };

  // Get metadata fields (existing CSV columns that are NOT new columns)
  const getMetadataFields = (): AnnotationField[] => {
    if (!annotationConfig) return [];
    return annotationConfig.annotationFields.filter(
      (field) => field.isMetadataField && !field.isNewColumn,
    );
  };

  // Get annotation fields (new columns that need annotation)
  const getAnnotationFields = (): AnnotationField[] => {
    if (!annotationConfig) return [];
    return annotationConfig.annotationFields.filter(
      (field) => field.isNewColumn || field.isAnnotationField,
    );
  };

  // Export annotations to CSV
  const exportAnnotationsToCSV = useCallback(async () => {
    if (!csvImport) {
      console.log('Cannot export: missing CSV data');
      return;
    }

    try {
      console.log('Exporting annotations to CSV...');

      // Get all rows with their annotations
      const allRows = csvImport.rowData || [];
      const exportedRows: any[] = [];

      for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
        const row = allRows[rowIndex];
        const rowAnnotations = annotations.filter(
          (ann) => ann.csvRowIndex === rowIndex,
        );

        // Start with original CSV data
        const exportedRow = { ...row.data };

        // Add new column data for each annotation field
        const annotationFields = annotationConfig?.annotationFields.filter(
          (field) => field.isAnnotationField
        ) || [];

        annotationFields.forEach((field) => {
          const fieldAnnotation = rowAnnotations.find(
            (ann) => ann.fieldName === field.fieldName,
          );

          if (fieldAnnotation && fieldAnnotation.data?.value) {
            exportedRow[field.fieldName] = fieldAnnotation.data.value;
          } else {
            exportedRow[field.fieldName] = '';
          }
        });

        exportedRows.push(exportedRow);
      }

      // Convert to CSV
      const headers = Object.keys(exportedRows[0]);
      const csvContent = [
        headers.join(','),
        ...exportedRows.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle structured data with newlines
              let stringValue = '';
              if (value === null || value === undefined) {
                stringValue = '';
              } else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                  stringValue = value.join('\n');
                } else {
                  // Try to extract meaningful data from objects
                  const urlKeys = ['url', 'href', 'src', 'link', 'value'];
                  let found = false;
                  for (const key of urlKeys) {
                    if (value[key] && typeof value[key] === 'string') {
                      stringValue = value[key];
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    stringValue = JSON.stringify(value, null, 2);
                  }
                }
              } else {
                stringValue = String(value);
              }

              // Escape commas, quotes, and newlines in CSV
              if (
                typeof stringValue === 'string' &&
                (stringValue.includes(',') ||
                  stringValue.includes('"') ||
                  stringValue.includes('\n'))
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue || '';
            })
            .join(','),
        ),
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `annotated_${csvImport.fileName || 'data'}.csv`,
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV');
    }
  }, [csvImport, annotations, annotationConfig]);

  // Autosave functionality
  const saveProgress = useCallback(async () => {
    if (!currentTask || !csvImportId) return;

    setIsSaving(true);
    try {
      // Save new column data as annotations
      const annotationFields = annotationConfig?.annotationFields.filter(
        (field) => field.isNewColumn || field.isAnnotationField
      ) || [];

      for (const field of annotationFields) {
        const fieldValue = newColumnData[field.fieldName];
        if (fieldValue && fieldValue.trim()) {
          // Check if annotation already exists for this field
          const existingAnnotation = annotations.find(
            (ann) => ann.fieldName === field.fieldName
          );

          const annotationData = {
            csvImportId,
            csvRowIndex: currentTask.rowIndex,
            fieldName: field.fieldName,
            type: 'CLASSIFICATION' as any,
            label: field.fieldName,
            data: { value: fieldValue },
            isAiGenerated: false,
            confidenceScore: 1.0,
            metadata: {},
          };

          if (existingAnnotation && existingAnnotation._id && 
              /^[0-9a-fA-F]{24}$/.test(existingAnnotation._id)) {
            // Update existing annotation
            await AnnotationsAPI.update(existingAnnotation._id, annotationData);
          } else {
          // Create new annotation
          const newAnnotation = await AnnotationsAPI.create(annotationData);
          // Update the annotation in state
          setAnnotations((prev) => [
            ...prev.filter((a) => a.fieldName !== field.fieldName),
            { 
              ...annotationData, 
              _id: newAnnotation._id,
              ...(user?._id && { userId: user._id }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Annotation,
          ]);
          }
        }
      }

      // Update task status based on whether new column data exists
      const hasNewColumnData = Object.values(newColumnData).some(value => value && value.trim());
      const updatedStatus: 'pending' | 'in_progress' | 'completed' | 'needs_review' = hasNewColumnData ? 'completed' : 'pending';

      const updatedTask: Task = {
        ...currentTask,
        metadata,
        annotations,
        status: updatedStatus,
        updatedAt: new Date(),
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === currentTask.id ? updatedTask : task)),
      );

      // Update last saved time
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setIsSaving(false);
    }
  }, [currentTask, metadata, annotations, newColumnData, csvImportId, annotationConfig]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(saveProgress, 5000);
    return () => clearInterval(interval);
  }, [saveProgress, autoSaveEnabled]);

  // Undo/Redo functionality
  const addToHistory = useCallback(
    (state: any) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(state);
        return newHistory.slice(-20); // Keep last 20 states
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 19));
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setMetadata(prevState.metadata);
      setAnnotations(prevState.annotations);
      setNewColumnData(prevState.newColumnData);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMetadata(nextState.metadata);
      setAnnotations(nextState.annotations);
      setNewColumnData(nextState.newColumnData);
      setHistoryIndex((prev) => prev + 1);
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
      setCurrentTaskIndex((prev) => prev - 1);
    } else if (direction === 'next' && currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  };

  const jumpToRow = (rowIndex: number) => {
    const taskIndex = tasks.findIndex(task => task.rowIndex === rowIndex);
    if (taskIndex !== -1) {
      setCurrentTaskIndex(taskIndex);
    }
  };

  // Drag and drop handlers for metadata field reordering
  const handleDragStart = (e: React.DragEvent, fieldName: string) => {
    setDraggedField(fieldName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFieldName: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetFieldName) return;

    const newOrder = [...orderedMetadataFields];
    const draggedIndex = newOrder.findIndex(field => field.csvColumnName === draggedField);
    const targetIndex = newOrder.findIndex(field => field.csvColumnName === targetFieldName);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const draggedFieldData = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedFieldData);
      setOrderedMetadataFields(newOrder);
    }

    setDraggedField(null);
  };

  // Field editing handlers
  const handleEditField = (fieldName: string) => {
    setEditingField(fieldName);
  };

  const handleSaveField = (fieldName: string, newValue: string) => {
    setMetadata(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  // Text expansion handlers
  const toggleTextExpansion = (fieldName: string) => {
    setExpandedTextFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  // Image overlay handlers
  const openImageOverlay = (imageUrls: string[], startIndex: number = 0) => {
    setImageOverlay({
      isOpen: true,
      imageUrl: imageUrls[startIndex] || '',
      imageUrls,
      currentIndex: startIndex,
    });
  };

  const closeImageOverlay = () => {
    setImageOverlay({
      isOpen: false,
      imageUrl: '',
      imageUrls: [],
      currentIndex: 0,
    });
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const { imageUrls, currentIndex } = imageOverlay;
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < imageUrls.length - 1) {
      newIndex = currentIndex + 1;
    }

    setImageOverlay(prev => ({
      ...prev,
      currentIndex: newIndex,
      imageUrl: imageUrls[newIndex] || '',
    }));
  };

  // Audio overlay handlers
  const openAudioOverlay = (audioUrl: string) => {
    setAudioOverlay({
      isOpen: true,
      audioUrl,
    });
  };

  const closeAudioOverlay = () => {
    setAudioOverlay({
      isOpen: false,
      audioUrl: '',
    });
  };

  // New column data handlers
  const handleNewColumnChange = (fieldName: string, value: string) => {
    setNewColumnData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const annotatedTasks = tasks.filter(
    (task) => task.status === 'completed',
  );
  const unannotatedTasks = tasks.filter(
    (task) => task.status !== 'completed',
  );

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


  // Load new column data when task changes
  useEffect(() => {
    if (!currentTask || !annotationConfig) return;

    const annotationFields = annotationConfig.annotationFields.filter(
      (field) => field.isNewColumn || field.isAnnotationField
    );

    // Load existing annotations for this row
    const loadRowData = async () => {
      try {
        const rowAnnotations = await AnnotationsAPI.findByCSVRow(
          csvImportId,
          currentTask.rowIndex,
        );

        const newColumnData: NewColumnData = {};
        annotationFields.forEach((field) => {
          const fieldAnnotation = rowAnnotations.find(
            (ann) => ann.fieldName === field.fieldName
          );
          newColumnData[field.fieldName] = fieldAnnotation?.data?.value || '';
        });

        setNewColumnData(newColumnData);
        setAnnotations(rowAnnotations);
      } catch (err) {
        console.error('Error loading row data:', err);
      }
    };

    loadRowData();
  }, [currentTask, csvImportId, annotationConfig]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading annotation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Metadata Display */}
        <MetadataDisplay
          metadata={{ ...metadata, rowIndex: currentTask?.rowIndex }}
          orderedMetadataFields={orderedMetadataFields}
          draggedField={draggedField}
          editingField={editingField}
          expandedTextFields={expandedTextFields}
          imageOverlay={imageOverlay}
          audioOverlay={audioOverlay}
          onMetadataChange={setMetadata}
          onDragStart={handleDragStart}
                onDragOver={handleDragOver}
          onDrop={handleDrop}
          onEditField={handleEditField}
          onSaveField={handleSaveField}
          onCancelEdit={handleCancelEdit}
          onToggleTextExpansion={toggleTextExpansion}
          onOpenImageOverlay={openImageOverlay}
          onOpenAudioOverlay={openAudioOverlay}
        />

        {/* Right Panel: New Column Data Entry */}
        <NewColumnDataPanel
          annotationConfig={annotationConfig}
          newColumnData={newColumnData}
          onNewColumnChange={handleNewColumnChange}
          onSaveProgress={saveProgress}
          onUndo={undo}
          onRedo={redo}
          onExportCSV={exportAnnotationsToCSV}
          historyIndex={historyIndex}
          historyLength={history.length}
          autoSaveEnabled={autoSaveEnabled}
          isSaving={isSaving}
          lastSavedTime={lastSavedTime}
        />
              </div>

      {/* Fixed Footer: Row Navigation */}
      <RowFooter
        tasks={tasks}
        currentTaskIndex={currentTaskIndex}
        onNavigateTask={navigateTask}
        onJumpToRow={jumpToRow}
      />

      {/* Image Overlay */}
      <ImageOverlay
        isOpen={imageOverlay.isOpen}
        imageUrl={imageOverlay.imageUrl}
        imageUrls={imageOverlay.imageUrls}
        currentIndex={imageOverlay.currentIndex}
        onClose={closeImageOverlay}
        onNavigate={navigateImage}
      />

      {/* Audio Overlay */}
      <AudioOverlay
        isOpen={audioOverlay.isOpen}
        audioUrl={audioOverlay.audioUrl}
        onClose={closeAudioOverlay}
      />
    </div>
  );
}
