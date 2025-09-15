'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AudioLines,
  Loader2,
  Tag,
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

// Import annotation components
import { TextAnnotationTool } from '@/components/annotation-components/text-annotation-tool';
import { ImageAnnotationTool } from '@/components/annotation-components/image-annotation-tool';
import { AudioAnnotationTool } from '@/components/annotation-components/audio-annotation-tool';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [csvRowsCollapsed, setCsvRowsCollapsed] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const labelsModalRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        labelsModalRef.current &&
        !labelsModalRef.current.contains(event.target as Node)
      ) {
        setShowLabelsModal(false);
      }
    };

    if (showLabelsModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelsModal]);

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
              userId: user?._id || '',
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
            userId: user?._id || '',
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

        // Set the first non-metadata field as selected by default
        if (annotationConfig && annotationConfig.annotationFields.length > 0) {
          const annotationField = annotationConfig.annotationFields.find(
            (field: any) => !field.isMetadataField,
          );
          console.log(
            'Looking for annotation field in config:',
            annotationConfig.annotationFields,
          );
          console.log('Found annotation field:', annotationField);
          if (annotationField) {
            console.log(
              'Setting selected field ID to:',
              annotationField.csvColumnName,
            );
            setSelectedFieldId(annotationField.csvColumnName);
          } else {
            console.log(
              'No annotation field found (all fields are metadata)',
            );
          }
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

  // Get metadata fields (isMetadataField: true)
  const getMetadataFields = (): AnnotationField[] => {
    if (!annotationConfig) return [];
    return annotationConfig.annotationFields.filter(
      (field) => field.isMetadataField,
    );
  };

  // Get annotation fields (fields that are not metadata)
  const getAnnotationFields = (): AnnotationField[] => {
    if (!annotationConfig) return [];
    return annotationConfig.annotationFields.filter(
      (field) => !field.isMetadataField,
    );
  };

  // Export annotations to CSV
  const exportAnnotationsToCSV = useCallback(async () => {
    if (!csvImport || annotations.length === 0) {
      console.log('Cannot export: missing data or no annotations');
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

        // Add annotation columns for each annotation field
        const annotationFields = getAnnotationFields();
        annotationFields.forEach((field) => {
          const fieldAnnotations = rowAnnotations.filter(
            (ann) => ann.fieldName === field.fieldName && ann.type !== 'NEW_COLUMN_VALUE',
          );

          if (fieldAnnotations.length > 0) {
            // Create annotation column name
            const annotationColumnName = `${field.fieldName}_annotations`;

            // Format annotations based on type
            const formattedAnnotations = fieldAnnotations
              .map((ann) => {
                switch (ann.type) {
                  case 'TEXT_NER':
                    return `${ann.label}: "${ann.data.text}" (${ann.data.start}-${ann.data.end})`;
                  case 'BBOX':
                    const imageInfo = ann.data.imageUrl
                      ? ` on ${ann.data.imageUrl.split('/').pop()}`
                      : '';
                    return `${ann.label}: [${ann.data.x}, ${ann.data.y}, ${ann.data.width}, ${ann.data.height}]${imageInfo}`;
                  case 'AUDIO_TRANSCRIPTION':
                    return `${ann.label}: "${ann.data.transcription}" (${ann.data.startTime}s-${ann.data.endTime}s)`;
                  case 'CLASSIFICATION':
                    return `${ann.label}: ${ann.data.value}`;
                  default:
                    return `${ann.label}: ${JSON.stringify(ann.data)}`;
                }
              })
              .join('; ');

            exportedRow[annotationColumnName] = formattedAnnotations;
          } else {
            // No annotations for this field
            const annotationColumnName = `${field.fieldName}_annotations`;
            exportedRow[annotationColumnName] = '';
          }
        });

        // Add new column values
        const newColumnValues = rowAnnotations.filter(
          (ann) => ann.type === 'NEW_COLUMN_VALUE',
        );
        
        newColumnValues.forEach((newColumnValue) => {
          // Use the fieldName as the column name (this is the new column name)
          exportedRow[newColumnValue.fieldName] = newColumnValue.data.columnValue || '';
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
  }, [csvImport, annotations, getAnnotationFields]);

  // Autosave functionality
  const saveProgress = useCallback(async () => {
    if (!currentTask || !csvImportId) return;

    setIsSaving(true);
    try {
      // Save metadata changes
      // This would need to be implemented based on your metadata storage strategy

      // Save annotations
      for (const annotation of annotations) {
        // Check if this is an existing annotation (valid MongoDB ObjectId) or a new one (temporary ID)
        const isExistingAnnotation =
          annotation._id &&
          /^[0-9a-fA-F]{24}$/.test(annotation._id) &&
          !annotation._id.startsWith('temp_'); // MongoDB ObjectId pattern, not temporary

        if (isExistingAnnotation) {
          // Update existing annotation
          await AnnotationsAPI.update(annotation._id, {
            csvImportId,
            csvRowIndex: currentTask.rowIndex,
            fieldName: annotation.fieldName,
            type: annotation.type as any,
            label: annotation.label,
            data: annotation.data,
            isAiGenerated: annotation.isAiGenerated,
            confidenceScore: annotation.confidenceScore,
            metadata: annotation.metadata,
          });
        } else {
          // Create new annotation (either no ID or temporary ID)
          const newAnnotation = await AnnotationsAPI.create({
            csvImportId,
            csvRowIndex: currentTask.rowIndex,
            fieldName: annotation.fieldName,
            type: annotation.type as any,
            label: annotation.label,
            data: annotation.data,
            isAiGenerated: annotation.isAiGenerated,
            confidenceScore: annotation.confidenceScore,
            metadata: annotation.metadata,
          });

          // Update the annotation in state with the real ID from the backend
          annotation._id = newAnnotation._id;
        }
      }

      // Update task status
      const updatedTask = {
        ...currentTask,
        metadata,
        annotations,
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
  }, [currentTask, metadata, annotations, csvImportId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(saveProgress, 30000);
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
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMetadata(nextState.metadata);
      setAnnotations(nextState.annotations);
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
          case 'h':
            e.preventDefault();
            setCsvRowsCollapsed(!csvRowsCollapsed);
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

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const annotatedTasks = filteredTasks.filter(
    (task) => task.status === 'completed',
  );
  const unannotatedTasks = filteredTasks.filter(
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

  const renderAnnotationTool = () => {
    if (!currentTask || !annotationConfig) return null;

    const fileType = getFileTypeForTask(currentTask);
    const annotationFields = getAnnotationFields();

    // Get content from metadata based on field type
    const getContent = () => {
      if (fileType === 'text') {
        // For text, get the first text field content
        const textField = annotationFields.find(
          (field) => field.fieldType === 'text',
        );
        if (textField && currentTask.metadata) {
          return (
            currentTask.metadata[textField.csvColumnName] ||
            'No text content available'
          );
        }
        return 'No text content available';
      }
      return '';
    };

    const getImageUrl = () => {
      if (fileType === 'image') {
        const imageField = annotationFields.find(
          (field) => field.fieldType === 'image',
        );
        if (imageField && currentTask.metadata) {
          const imageData =
            currentTask.metadata[imageField.csvColumnName] || '';

          // Also check for related fields that might contain additional image URLs
          const relatedFields = [
            'text',
            'hyperlink',
            'url',
            'image_url',
            'imageUrl',
          ];
          let allImageUrls: string[] = [];

          // Get URLs from the main image field
          if (typeof imageData === 'string' && imageData.trim()) {
            const urls = imageData
              .split(/[,\n]/) // Handle both comma and newline separators
              .map((url) => url.trim())
              .filter((url) => url && url.startsWith('http'));
            allImageUrls.push(...urls);
          }

          // Get URLs from related fields
          relatedFields.forEach((fieldName) => {
            if (
              fieldName !== imageField.csvColumnName &&
              currentTask.metadata &&
              currentTask.metadata[fieldName]
            ) {
              const fieldData = currentTask.metadata[fieldName];
              if (typeof fieldData === 'string' && fieldData.trim()) {
                const urls = fieldData
                  .split(/[,\n]/) // Handle both comma and newline separators
                  .map((url) => url.trim())
                  .filter((url) => url && url.startsWith('http'));
                allImageUrls.push(...urls);
              }
            }
          });

          // Remove duplicates and filter out invalid URLs
          const uniqueUrls = [...new Set(allImageUrls)].filter(
            (url) =>
              url &&
              url !== '[object Object]' &&
              (url.startsWith('http') || url.startsWith('https')),
          );

          console.log('Combined image URLs:', uniqueUrls);
          console.log('Image field:', imageField.csvColumnName);
          console.log(
            'All metadata fields:',
            Object.keys(currentTask.metadata || {}),
          );
          console.log('Text field data:', currentTask.metadata?.text);
          console.log('Hyperlink field data:', currentTask.metadata?.hyperlink);
          console.log('Raw URLs before cleaning:', allImageUrls);
          console.log('URLs after cleaning:', uniqueUrls);
          return uniqueUrls.join('\n');
        }
      }
      return '';
    };

    const getAudioUrl = () => {
      if (fileType === 'audio') {
        const audioField = annotationFields.find(
          (field) => field.fieldType === 'audio',
        );
        if (audioField && currentTask.metadata) {
          return currentTask.metadata[audioField.csvColumnName] || '';
        }
      }
      return '';
    };

    // Get available labels from annotation config
    const labels: string[] =
      annotationConfig?.annotationLabels?.map((label) => label.name) || [];

    // Render annotation tools based on field types
    const textFields = annotationFields.filter(
      (field) => field.fieldType === 'text',
    );
    const imageFields = annotationFields.filter(
      (field) => field.fieldType === 'image',
    );
    const audioFields = annotationFields.filter(
      (field) => field.fieldType === 'audio',
    );

    // Find the selected field
    const selectedField = annotationFields.find(
      (field) => field.csvColumnName === selectedFieldId,
    );

    // Auto-select the single annotation field
    if (!selectedField && annotationFields.length > 0) {
      const firstField = annotationFields[0];
      setSelectedFieldId(firstField.csvColumnName);
      return null; // Will re-render with selected field
    }

    if (!selectedField) {
      return (
        <div className="p-6">
          <div className="text-center text-gray-500">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-gray-400">📝</span>
            </div>
            <h3 className="text-xl font-medium mb-2">
              No Annotation Fields Available
            </h3>
            <p className="text-sm">
              Please configure annotation fields in the field configuration.
            </p>
          </div>
        </div>
      );
    }

    // Render only the selected annotation field
    const fieldAnnotations = annotations.filter(
      (ann) => ann.fieldName === selectedField.fieldName,
    );

    return (
      <div className="h-full">
        <div
          key={selectedField.csvColumnName}
          id={`annotation-field-${selectedField.csvColumnName}`}
          className="h-full"
        >
          {/* Text Annotation Tool */}
          {selectedField.fieldType === 'text' && (
            <TextAnnotationTool
              content={
                currentTask.metadata?.[selectedField.csvColumnName] ||
                'No text content available'
              }
              annotations={fieldAnnotations.map((ann) => ({
                id: ann._id || '',
                start: ann.data.start || 0,
                end: ann.data.end || 0,
                text: ann.data.text || '',
                label: ann.label,
              }))}
              labels={labels}
              annotationLabels={annotationConfig?.annotationLabels || []}
              selectedLabel={selectedLabel}
              onAnnotationChange={(newAnnotations) => {
                const updatedAnnotations = newAnnotations.map((ann) => ({
                  _id: ann.id,
                  csvImportId,
                  userId: user?._id || '',
                  csvRowIndex: currentTask.rowIndex,
                  fieldName: selectedField.fieldName,
                  type: 'TEXT_NER' as any,
                  label: ann.label,
                  data: { start: ann.start, end: ann.end, text: ann.text },
                  isAiGenerated: false,
                  metadata: {},
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }));

                setAnnotations((prev) => [
                  ...prev.filter(
                    (a) => a.fieldName !== selectedField.fieldName,
                  ),
                  ...updatedAnnotations,
                ]);
              }}
              disabled={false}
            />
          )}

          {/* Image Annotation Tool */}
          {selectedField.fieldType === 'image' && (
            <ImageAnnotationTool
              imageUrl={
                currentTask.metadata?.[selectedField.csvColumnName] || ''
              }
              annotations={fieldAnnotations.map((ann) => ({
                id: ann._id || '',
                x: ann.data.x || 0,
                y: ann.data.y || 0,
                width: ann.data.width || 0,
                height: ann.data.height || 0,
                label: ann.label,
                imageUrl: ann.data.imageUrl || '', // Add imageUrl from annotation data
              }))}
              labels={labels}
              annotationLabels={annotationConfig?.annotationLabels || []}
              selectedLabel={selectedLabel}
              columnName={selectedField.csvColumnName}
              onAnnotationChange={(newAnnotations) => {
                const updatedAnnotations = newAnnotations.map((ann) => ({
                  _id: ann.id,
                  csvImportId,
                  userId: user?._id || '',
                  csvRowIndex: currentTask.rowIndex,
                  fieldName: selectedField.fieldName,
                  type: 'BBOX' as any,
                  label: ann.label,
                  data: {
                    x: ann.x,
                    y: ann.y,
                    width: ann.width,
                    height: ann.height,
                    imageUrl: ann.imageUrl, // Include imageUrl in annotation data
                  },
                  isAiGenerated: false,
                  metadata: {},
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }));

                setAnnotations((prev) => [
                  ...prev.filter(
                    (a) => a.fieldName !== selectedField.fieldName,
                  ),
                  ...updatedAnnotations,
                ]);
              }}
              disabled={false}
            />
          )}

          {/* Audio Annotation Tool */}
          {selectedField.fieldType === 'audio' && (
            <AudioAnnotationTool
              audioUrl={
                currentTask.metadata?.[selectedField.csvColumnName] || ''
              }
              annotations={fieldAnnotations.map((ann) => ({
                id: ann._id || '',
                startTime: ann.data.startTime || 0,
                endTime: ann.data.endTime || 0,
                transcription: ann.data.transcription || '',
                label: ann.label,
              }))}
              labels={labels}
              annotationLabels={annotationConfig?.annotationLabels || []}
              selectedLabel={selectedLabel}
              onAnnotationChange={(newAnnotations) => {
                const updatedAnnotations = newAnnotations.map((ann) => ({
                  _id: ann.id,
                  csvImportId,
                  userId: user?._id || '',
                  csvRowIndex: currentTask.rowIndex,
                  fieldName: selectedField.fieldName,
                  type: 'AUDIO_TRANSCRIPTION' as any,
                  label: ann.label,
                  data: {
                    startTime: ann.startTime,
                    endTime: ann.endTime,
                    transcription: ann.transcription,
                  },
                  isAiGenerated: false,
                  metadata: {},
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }));

                setAnnotations((prev) => [
                  ...prev.filter(
                    (a) => a.fieldName !== selectedField.fieldName,
                  ),
                  ...updatedAnnotations,
                ]);
              }}
              disabled={false}
            />
          )}
        </div>
      </div>
    );
  };

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
    <div className="flex h-full bg-gray-50">
      {/* Column 1: File Grid with Two Sections */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
          csvRowsCollapsed ? 'w-16' : 'w-96',
        )}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2
              className={cn(
                'font-semibold text-gray-900 transition-opacity duration-200',
                csvRowsCollapsed
                  ? 'opacity-0 w-0 overflow-hidden'
                  : 'opacity-100',
              )}
            >
              CSV Rows
            </h2>
            <button
              onClick={() => setCsvRowsCollapsed(!csvRowsCollapsed)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              title={
                csvRowsCollapsed
                  ? 'Expand CSV Rows (Ctrl+H)'
                  : 'Collapse CSV Rows (Ctrl+H)'
              }
            >
              {csvRowsCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Search and Filter */}
          <div
            className={cn(
              'space-y-2 transition-all duration-200',
              csvRowsCollapsed
                ? 'opacity-0 h-0 overflow-hidden'
                : 'opacity-100',
            )}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rows..."
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
              <option value="all">All Rows</option>
              <option value="pending">Unannotated</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Annotated</option>
            </select>
          </div>
        </div>

        {/* File Grid with Two Columns */}
        <div
          className={cn(
            'flex-1 overflow-y-auto transition-all duration-200',
            csvRowsCollapsed ? 'opacity-0 overflow-hidden' : 'opacity-100',
          )}
        >
          {/* Collapsed State Indicator */}
          {csvRowsCollapsed && (
            <div className="flex flex-col items-center justify-center h-full p-2">
              <div className="text-center text-gray-500">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📊</span>
                </div>
                <p className="text-xs font-medium">CSV Rows</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filteredTasks.length} row
                  {filteredTasks.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400">
                  {unannotatedTasks.length} unannotated
                </p>
                <p className="text-xs text-gray-400">
                  {annotatedTasks.length} annotated
                </p>

                {/* Current Task Indicator */}
                {currentTask && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-700">
                      Current: Row {currentTask.rowIndex}
                    </p>
                    <div className="flex items-center justify-center mt-1">
                      {getFileIcon(getFileTypeForTask(currentTask))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unannotated Files Section */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              Unannotated ({unannotatedTasks.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {unannotatedTasks.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  <p className="text-xs">No unannotated rows</p>
                </div>
              ) : (
                unannotatedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setCurrentTaskIndex(tasks.indexOf(task))}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      currentTask?.id === task.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFileIcon(getFileTypeForTask(task))}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          Row {task.rowIndex}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          {getStatusIcon(task.status)}
                          <span className="text-xs text-gray-500 ml-1 capitalize">
                            {task.status === 'pending'
                              ? 'Unannotated'
                              : task.status === 'in_progress'
                              ? 'In Progress'
                              : task.status}
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
                  <p className="text-xs">No annotated rows</p>
                </div>
              ) : (
                annotatedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setCurrentTaskIndex(tasks.indexOf(task))}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      currentTask?.id === task.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-green-200 bg-green-50 hover:border-green-300',
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        {getFileIcon(getFileTypeForTask(task))}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          Row {task.rowIndex}
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
        <div
          className={cn(
            'p-3 border-t border-gray-100 transition-all duration-200',
            csvRowsCollapsed ? 'opacity-0 overflow-hidden' : 'opacity-100',
          )}
        >
          <div className="text-center">
            <span className="text-sm text-gray-600">
              {filteredTasks.length} row{filteredTasks.length !== 1 ? 's' : ''}
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
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Metadata
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {getMetadataFields().map((field) => (
                  <div key={field.csvColumnName} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {field.fieldName}
                      {field.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>

                    {/* Display metadata fields as structured text with preserved formatting */}
                    <div className="mt-1 p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800 text-sm whitespace-pre-wrap">
                      {(() => {
                        const value = metadata[field.csvColumnName];
                        if (!value) return 'N/A';

                        // If it's a string with newlines, preserve them
                        if (typeof value === 'string' && value.includes('\n')) {
                          return value;
                        }

                        // If it's an object, try to format it nicely
                        if (typeof value === 'object' && value !== null) {
                          if (Array.isArray(value)) {
                            return value.join('\n');
                          }
                          // Try to extract URL-like properties
                          const urlKeys = [
                            'url',
                            'href',
                            'src',
                            'link',
                            'value',
                          ];
                          for (const key of urlKeys) {
                            if (value[key] && typeof value[key] === 'string') {
                              return value[key];
                            }
                          }
                          return JSON.stringify(value, null, 2);
                        }

                        return String(value);
                      })()}
                    </div>
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

                  <div className="flex items-center justify-center">
                    <Button
                      size="sm"
                      onClick={saveProgress}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save All Annotations
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Auto-save: {autoSaveEnabled ? 'On' : 'Off'}</span>
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

                {/* Export CSV Button - Separate Section */}
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    onClick={exportAnnotationsToCSV}
                    disabled={annotations.length === 0}
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Annotation Tools */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Annotating: Row {currentTask.rowIndex}
                  </h2>

                  <div className="flex items-center space-x-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        currentTask.status === 'completed' &&
                          'bg-green-100 text-green-800',
                        currentTask.status === 'in_progress' &&
                          'bg-blue-100 text-blue-800',
                        currentTask.status === 'pending' &&
                          'bg-gray-100 text-gray-800',
                        currentTask.status === 'needs_review' &&
                          'bg-orange-100 text-orange-800',
                      )}
                    >
                      {currentTask.status.replace('_', ' ')}
                    </span>

                    {/* Labels Menu - Moved beside status */}
                    <div className="relative">
                      <button
                        onClick={() => setShowLabelsModal(!showLabelsModal)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors text-sm font-medium"
                        title="Select annotation label"
                      >
                        <Tag className="h-4 w-4" />
                        <span>Label</span>
                        <span className="text-blue-600">⋮</span>
                      </button>

                      {/* Labels Modal */}
                      {showLabelsModal && (
                        <div
                          ref={labelsModalRef}
                          className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium text-gray-900">
                                Available Labels
                              </h3>
                              <button
                                onClick={() => setShowLabelsModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <span className="text-lg">×</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {annotationConfig?.annotationLabels?.map(
                                (label, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                      setSelectedLabel(label.name);
                                      setShowLabelsModal(false);
                                    }}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{
                                          backgroundColor: label.color,
                                        }}
                                      ></div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {label.name}
                                        </p>
                                        {label.description && (
                                          <p className="text-xs text-gray-500">
                                            {label.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {label.hotkey && (
                                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {label.hotkey}
                                      </div>
                                    )}
                                  </div>
                                ),
                              ) || []}
                            </div>

                            {(!annotationConfig?.annotationLabels ||
                              annotationConfig.annotationLabels.length ===
                                0) && (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                No labels available. Please configure labels in
                                the field configuration.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Label Display */}
                {selectedLabel && (
                  <div className="flex items-center justify-end mb-2">
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <span>Selected: {selectedLabel}</span>
                      <button
                        onClick={() => setSelectedLabel(null)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
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
              <h3 className="text-xl font-medium mb-2">
                Select a row to start annotating
              </h3>
              <p className="text-sm">
                Click on any row from the left panel to begin annotation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
