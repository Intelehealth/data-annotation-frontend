'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Image as ImageIcon,
  AudioLines,
  Loader2,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DatasetMergedRowsAPI,
  DatasetMergedRowsData,
} from '@/lib/api/dataset-merged-rows';
import {
  AnnotationConfig,
  AnnotationField,
} from '@/lib/api/dataset-annotation-types';
import { fieldSelectionAPI } from '@/lib/api/field-config';
import { datasetsAPI } from '@/lib/api/datasets';
import { RowFooter, NewColumnDataPanel } from '@/components/new-column-components';
import { MetadataDisplay } from './metadata-display';
import { useToast } from '@/components/ui/toast';
import { exportSelectedColumnsToCSV, exportAllColumnsToCSV } from '@/lib/dataset-export-helper';
import { DragDropHelper, DragDropParams } from '@/lib/drag-drop-helper';
import { CompletionModal } from '@/components/ui/completion-modal';
import { ResizablePanels } from '@/components/ui/resizable-panels';

interface Task {
  id: string;
  rowIndex: number;
  fileName: string;
  fileType: 'text' | 'image' | 'audio';
  filePath: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
  assignedTo?: string;
  metadata?: Record<string, any>;
  csvInfo?: {
    csvImportId: string;
    fileName: string;
    originalCsvRowIndex: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface NewColumnData {
  [fieldName: string]: string;
}


interface DatasetAnnotationWorkbenchProps {
  datasetId: string;
}

export function DatasetAnnotationWorkbench({
  datasetId,
}: DatasetAnnotationWorkbenchProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [newColumnData, setNewColumnData] = useState<NewColumnData>({});
  const [, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotationConfig, setAnnotationConfig] =
    useState<AnnotationConfig | null>(null);
  const [datasetNewColumns, setDatasetNewColumns] = useState<any[]>([]);
  const [datasetData, setDatasetData] = useState<DatasetMergedRowsData | null>(null);
  const [orderedMetadataFields, setOrderedMetadataFields] = useState<AnnotationField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedTextFields, setExpandedTextFields] = useState<Set<string>>(new Set());
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [, setPendingChanges] = useState<Record<string, any>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStats, setCompletionStats] = useState<{
    completedCount: number;
    totalCount: number;
    completionTime: string;
  } | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [imageAuthConfig, setImageAuthConfig] = useState<{
    isPrivate: boolean;
    username?: string;
    password?: string;
  } | undefined>(undefined);

  // Initialize ordered metadata fields when annotation config changes
  useEffect(() => {
    if (annotationConfig) {
      // Metadata fields are existing CSV columns that are NOT new columns AND are visible
      const metadataFields = annotationConfig.annotationFields.filter(
        (field) => !field.isAnnotationField && !field.isNewColumn && field.isVisible !== false
      );
      setOrderedMetadataFields(metadataFields);
    }
  }, [annotationConfig]);

  // Load dataset data and annotation config
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dataset info for name and image auth config
        const datasetInfo = await datasetsAPI.getById(datasetId);
        setDatasetName(datasetInfo.name);
        setImageAuthConfig(datasetInfo.imageAuthConfig);

        // Load dataset merged rows data
        const mergedData = await DatasetMergedRowsAPI.getDatasetData(datasetId);
        setDatasetData(mergedData);

        // Load annotation config using datasetId
        try {
          const config = await fieldSelectionAPI.getDatasetFieldConfig(
            datasetId,
          );
          if (config) {
            // Use fields directly from backend
            const normalizedFields = (config.annotationFields || []).map((f: any) => ({
              ...f,
              isAnnotationField: f.isAnnotationField === false ? false : true,
              isNewColumn: Boolean(f.isNewColumn),
              isPrimaryKey: Boolean(f.isPrimaryKey),
              isRequired: Boolean(f.isRequired),
            }));

            // Transform the dataset config to match the expected AnnotationConfig format
            const annotationConfig: AnnotationConfig = {
              _id: config._id || '',
              csvImportId: '', // Not used in dataset-level annotation
              userId: user?._id,
              annotationFields: normalizedFields,
              annotationLabels: config.annotationLabels || [],
              rowAnnotations: [],
              totalRows: mergedData.totalRows,
              completedRows: 0,
              status: 'active',
              createdAt: config.createdAt || new Date().toISOString(),
              updatedAt: config.updatedAt || new Date().toISOString(),
            };
            setAnnotationConfig(annotationConfig);
            setDatasetNewColumns(config.newColumns || []);
          } else {
            throw new Error('No field configuration found');
          }
        } catch {
          // If no annotation config exists, create a default one
          const defaultConfig: AnnotationConfig = {
            _id: '',
            csvImportId: '',
            userId: user?._id,
            annotationFields: [],
            rowAnnotations: [],
            totalRows: mergedData.totalRows,
            completedRows: 0,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setAnnotationConfig(defaultConfig);
        }

        let taskData: Task[] = [];

        if (mergedData.mergedRows && Array.isArray(mergedData.mergedRows)) {
          taskData = mergedData.mergedRows.map((row: any) => ({
            id: `row-${row.rowIndex}`,
            rowIndex: row.rowIndex,
            fileName: `Row ${row.rowIndex}`, // Display as 1-based for user friendliness
            fileType: 'text', // Default to text, will be determined by annotation fields
            filePath: `/dataset/${datasetId}/row/${row.rowIndex}`,
            status: row.completed ? 'completed' : 'pending',
            metadata: row.data || {},
            csvInfo: row.csvInfo || null,
            createdAt: new Date(mergedData.createdAt),
            updatedAt: new Date(mergedData.lastUpdatedAt),
          }));
        } else {
          // If no mergedRows, create tasks based on totalRows
          taskData = Array.from({ length: mergedData.totalRows }, (_, index) => ({
            id: `row-${index + 1}`,
            rowIndex: index + 1, // Start from 1
            fileName: `Row ${index + 1}`, // Display as 1-based for user friendliness
            fileType: 'text',
            filePath: `/dataset/${datasetId}/row/${index + 1}`,
            status: 'pending',
            metadata: {},
            csvInfo: undefined,
            createdAt: new Date(mergedData.createdAt),
            updatedAt: new Date(mergedData.lastUpdatedAt),
          }));
        }

        // Initialize metadata with actual merged row data
        if (
          taskData.length > 0 &&
          mergedData.mergedRows &&
          mergedData.mergedRows.length > 0
        ) {
          const firstRowData = mergedData.mergedRows[0].data;
          setMetadata(firstRowData);
        }

        setTasks(taskData);

        // Load progress and apply completion status
        try {
          const progress = await DatasetMergedRowsAPI.getDetailedProgress(datasetId);

          // Apply completion status to tasks
          const updatedTasks = taskData.map(task => {
            const rowStatus = progress.rowStatuses.find((rs: { rowIndex: number; completed: boolean }) => rs.rowIndex === task.rowIndex);
            return {
              ...task,
              status: rowStatus?.completed ? 'completed' as const : 'pending' as const
            };
          });
          setTasks(updatedTasks);

          // Set current task index to resume position
          if (progress.lastViewedRow > 0 && progress.lastViewedRow < taskData.length) {
            setCurrentTaskIndex(progress.lastViewedRow);
          } else {
            // Find first incomplete row
            const firstIncompleteIndex = updatedTasks.findIndex(task => task.status !== 'completed');
            if (firstIncompleteIndex >= 0) {
              setCurrentTaskIndex(firstIncompleteIndex);
            }
          }
        } catch {
          showToast({
            type: 'info',
            title: 'Progress Loading Info',
            description: 'Could not load progress data. Starting from first incomplete row.',
          });
        }

        // Initialize new column data for annotation fields
        if (annotationConfig && annotationConfig.annotationFields.length > 0) {
          const annotationFields = annotationConfig.annotationFields.filter(
            (field) => (field.isNewColumn || field.isAnnotationField) && field.isVisible !== false
          );
          // Initialize new column data, preserving any existing values
          setNewColumnData(prevNewColumnData => {
            const initialNewColumnData: NewColumnData = {};
            annotationFields.forEach((field) => {
              // Preserve existing values or initialize with empty string
              initialNewColumnData[field.fieldName] = prevNewColumnData[field.fieldName] || '';
            });
            return initialNewColumnData;
          });
        }
      } catch (err) {
        setError(
          `Failed to load dataset annotation data: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    if (datasetId) {
      loadData();
    }
  }, [datasetId, user?._id]);

  const currentTask = tasks[currentTaskIndex];

  // Update metadata when current task changes
  useEffect(() => {
    if (currentTask && currentTask.metadata) {
      setMetadata(currentTask.metadata);
    }
  }, [currentTask]);



  // Export annotations to CSV - Selected Columns Only
  const handleExportSelectedColumns = useCallback(async () => {
    if (!datasetData || !annotationConfig) {
      return;
    }

    await exportSelectedColumnsToCSV(
      datasetData,
      {
        annotationFields: annotationConfig.annotationFields.map(field => ({
          ...field,
          isNewColumn: field.isNewColumn ?? false
        }))
      },
      datasetId,
      {
        cleanHtml: true,
        showSuccess: true,
        onSuccess: (message) => {
          showToast({
            type: 'success',
            title: 'Export Complete',
            description: message,
          });
        },
        onError: () => {
          setError('Failed to export selected columns CSV');
        },
      }
    );
  }, [datasetData, annotationConfig, showToast, datasetId]);

  // Export annotations to CSV - All Columns
  const handleExportAllColumns = useCallback(async () => {
    if (!datasetData || !annotationConfig) {
      return;
    }

    await exportAllColumnsToCSV(
      datasetData,
      {
        annotationFields: annotationConfig.annotationFields.map(field => ({
          ...field,
          isNewColumn: field.isNewColumn ?? false
        }))
      },
      datasetId,
      {
        cleanHtml: true,
        showSuccess: true,
        onSuccess: (message) => {
          showToast({
            type: 'success',
            title: 'Export Complete',
            description: message,
          });
        },
        onError: () => {
          setError('Failed to export all columns CSV');
        },
      }
    );
  }, [datasetData, annotationConfig, showToast, datasetId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      const timeoutId = saveTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);


  const navigateTask = useCallback((direction: 'prev' | 'next') => {
    let newIndex = currentTaskIndex;
    
    if (direction === 'prev' && currentTaskIndex > 0) {
      newIndex = currentTaskIndex - 1;
    } else if (direction === 'next' && currentTaskIndex < tasks.length - 1) {
      newIndex = currentTaskIndex + 1;
    }
    
    if (newIndex !== currentTaskIndex) {
      setCurrentTaskIndex(newIndex);
      
      // Update last viewed row in backend
      if (datasetId) {
        DatasetMergedRowsAPI.updateAnnotationProgress(
          datasetId, 
          newIndex, 
          tasks.filter(t => t.status === 'completed').length
        ).catch(() => {
          showToast({
            type: 'error',
            title: 'Navigation Error',
            description: 'Failed to update navigation progress. Please try again.',
          });
        });
      }
    }
  }, [currentTaskIndex, tasks, datasetId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
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
  }, [navigateTask]);

  const jumpToRow = (rowIndex: number) => {
    // Find the task with the matching rowIndex
    const taskIndex = tasks.findIndex(task => task.rowIndex === rowIndex);
    if (taskIndex >= 0) {
      setCurrentTaskIndex(taskIndex);
    }
  };

  // Drag and drop handlers for metadata field reordering
  const handleDragStart = (e: React.DragEvent, fieldName: string) => {
    setDraggedField(fieldName);
    e.dataTransfer.effectAllowed = 'move';
  };


  // Unified drag handler using the DragDropHelper
  const handleUnifiedDrop = async (e: React.DragEvent | null, targetFieldName: string, targetPanel: 'metadata' | 'annotation') => {
    if (e) {
      e.preventDefault();
    }
    
    if (!draggedField || !annotationConfig) return;

    // Use the DragDropHelper to handle the operation
    const params: DragDropParams = {
      draggedField,
      targetFieldName,
      targetPanel,
      annotationConfig,
      orderedMetadataFields
    };

    const result = await DragDropHelper.handleDragDrop(params);

    if (result.success) {
      // Update state based on result
      if (result.updatedFields) {
        setAnnotationConfig((prev) => (prev ? { ...prev, annotationFields: result.updatedFields! } : prev));
        
        // Transfer data from metadata to newColumnData when moving from metadata to annotation
        // Check which fields were just moved from metadata to annotation
        const movedFields: AnnotationField[] = [];
        
        annotationConfig.annotationFields.forEach(oldField => {
          const updatedField = result.updatedFields!.find(newField => newField.csvColumnName === oldField.csvColumnName);
          if (updatedField && !oldField.isAnnotationField && updatedField.isAnnotationField) {
            movedFields.push(updatedField);
          }
        });
        
        // Transfer data for each moved field
        movedFields.forEach(field => {
          if (currentTask?.metadata && currentTask.metadata[field.csvColumnName] !== undefined) {
            const fieldData = currentTask.metadata[field.csvColumnName];
            setNewColumnData(prevData => ({
              ...prevData,
              [field.fieldName]: fieldData
            }));
            console.log(`Transferred data for ${field.fieldName}:`, fieldData);
          }
        });
      }
      
      if (result.updatedMetadataFields) {
        setOrderedMetadataFields(result.updatedMetadataFields);
      }

      // Persist changes to backend
      if (result.updatedFields) {
        try {
          await fieldSelectionAPI.saveDatasetFieldConfig({
            datasetId,
            annotationFields: result.updatedFields,
            annotationLabels: annotationConfig.annotationLabels || [],
            newColumns: datasetNewColumns,
          });

          showToast({
            type: 'success',
            title: 'Operation Successful',
            description: result.message
          });
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Save Failed',
            description: 'Failed to save field configuration'
          });
        }
      } else {
        // For metadata-only reordering (no backend persistence needed)
        showToast({
          type: 'success',
          title: 'Fields Reordered',
          description: result.message
        });
      }
    } else {
      // Show error message
      showToast({
        type: 'error',
        title: 'Operation Failed',
        description: result.message
      });
    }

    setDraggedField(null);
  };

  // Unified drag over handler
  const handleUnifiedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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

  // Individual field save handler for dataset row data
  const handleSaveIndividualField = useCallback(async (fieldName: string, fieldValue: string) => {
    if (!datasetId || !currentTask) return;
    
    setIsSaving(true);
    try {
      const fieldData = { [fieldName]: fieldValue };

      const response = await DatasetMergedRowsAPI.patchRowData(
        datasetId,
        currentTask.rowIndex,
        fieldData
      );

      if (response.success && response.data) {
        // Update local dataset data
        if (datasetData && datasetData.mergedRows) {
          const updatedRow = datasetData.mergedRows.find(row => row.rowIndex === currentTask.rowIndex);
          if (updatedRow) {
            updatedRow.data[fieldName] = fieldValue;
            updatedRow.processed = true;
            setDatasetData({ ...datasetData });
          }
        }

        // Update current task metadata to immediately reflect the changes
        const updatedTask = {
          ...currentTask,
          metadata: {
            ...currentTask.metadata,
            [fieldName]: fieldValue
          },
          updatedAt: new Date(),
        };

        // Update the tasks array
        setTasks(prev => prev.map(task => 
          task.id === currentTask.id ? updatedTask : task
        ));

        // Don't update newColumnData during individual saves
        // This preserves any unsaved changes in the right panel

        setLastSavedTime(new Date());
        showToast({
          type: 'success',
          title: 'Field Saved',
          description: `Field "${fieldName}" saved successfully!`,
        });
      }

    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: `Failed to save field "${fieldName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, currentTask, datasetData, showToast]);

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


  // Save all new column data function
  const saveAllNewColumnData = useCallback(async () => {
    if (!datasetId || !currentTask) return;

    const annotationFields = annotationConfig?.annotationFields.filter(
      (field) => (field.isNewColumn || field.isAnnotationField) && field.isVisible !== false
    ) || [];

    const dataToSave: Record<string, any> = {};
    let hasActualData = false;

    // IMPORTANT: First, save any unsaved individual edits from the left panel
    if (editingField && metadata[editingField] !== undefined) {
      try {
        await handleSaveIndividualField(editingField, metadata[editingField]);
        setEditingField(null); // Clear editing state
      } catch {
        showToast({
          type: 'error',
          title: 'Save Failed',
          description: 'Could not save individual edit before proceeding'
        });
        return;
      }
    }

    // Collect only fields that have actual data from newColumnData
    for (const field of annotationFields) {
      const fieldValue = newColumnData[field.fieldName];
      if (fieldValue !== undefined && fieldValue !== null && fieldValue.trim() !== '') {
        dataToSave[field.fieldName] = fieldValue;
        hasActualData = true;
      }
    }

    setIsSaving(true);
    try {
      let response = null;
      
      // Only save data if there's actual data to save
      if (hasActualData) {
        response = await DatasetMergedRowsAPI.patchRowData(
          datasetId,
          currentTask.rowIndex,
          dataToSave
        );

        if (response.success && response.data) {
          // Update local dataset data
          if (datasetData && datasetData.mergedRows) {
            const updatedRow = datasetData.mergedRows.find(row => row.rowIndex === currentTask.rowIndex);
            if (updatedRow) {
              Object.entries(dataToSave).forEach(([fieldName, value]) => {
                updatedRow.data[fieldName] = value;
              });
              updatedRow.processed = true;
              setDatasetData({ ...datasetData });
            }
          }
        }
      }

      // Always mark row as completed (regardless of whether data was saved)
      const updatedTask = {
        ...currentTask,
        metadata: {
          ...currentTask.metadata,
          ...dataToSave
        },
        status: 'completed' as const,
        updatedAt: new Date(),
      };

      // Update the tasks array
      setTasks(prev => prev.map(task => 
        task.id === currentTask.id ? updatedTask : task
      ));

      // Mark row as completed in backend
      try {
        await DatasetMergedRowsAPI.markRowCompleted(datasetId, currentTask.rowIndex);
        
        // Update progress tracking
        const completedCount = tasks.filter(t => t.status === 'completed' || t.rowIndex === currentTask.rowIndex).length;
        await DatasetMergedRowsAPI.updateAnnotationProgress(datasetId, currentTask.rowIndex, completedCount);
      } catch {
        showToast({
          type: 'info',
          title: 'Completion Status Update',
          description: 'Data saved successfully, but completion status could not be updated.',
        });
      }

      setLastSavedTime(new Date());
      setPendingChanges({});
      
      // Check if ALL rows are completed using API
      try {
        const completionStatus = await DatasetMergedRowsAPI.checkAllRowsCompleted(datasetId);
        
        if (completionStatus.allCompleted) {
          // Show completion modal instead of toast
          setCompletionStats({
            completedCount: completionStatus.completedCount,
            totalCount: completionStatus.totalCount,
            completionTime: new Date().toLocaleString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
          setShowCompletionModal(true);
        } else {
          // Show regular success toast and navigate to next row
          const isLastRow = currentTaskIndex >= tasks.length - 1;
        
        if (hasActualData && response?.success) {
          const fieldCount = response.updatedFields || 0;
          showToast({
            type: 'success',
            title: 'Data Saved & Row Completed',
            description: fieldCount > 0 
              ? `Successfully saved ${fieldCount} field(s).${isLastRow ? '' : ' Moving to next row...'}`
              : `Row marked as complete.${isLastRow ? '' : ' Moving to next row...'}`,
          });
        } else {
          showToast({
            type: 'success',
            title: 'Row Marked as Complete',
            description: `Row completed.${isLastRow ? '' : ' Moving to next row...'}`,
          });
        }

          // Auto-navigate to next row after successful save (only if not last row)
          if (!isLastRow) {
            setTimeout(() => {
              navigateTask('next');
            }, 1000); // Small delay to let user see the success message
          }
        }
      } catch {
        // Fallback to regular flow if API call fails
        const isLastRow = currentTaskIndex >= tasks.length - 1;
        
        if (hasActualData && response?.success) {
          const fieldCount = response.updatedFields || 0;
          showToast({
            type: 'success',
            title: 'Data Saved & Row Completed',
            description: fieldCount > 0 
              ? `Successfully saved ${fieldCount} field(s).${isLastRow ? '' : ' Moving to next row...'}`
              : `Row marked as complete.${isLastRow ? '' : ' Moving to next row...'}`,
          });
        } else {
          showToast({
            type: 'success',
            title: 'Row Marked as Complete',
            description: `Row completed.${isLastRow ? '' : ' Moving to next row...'}`,
          });
        }

        // Auto-navigate to next row after successful save (only if not last row)
        if (!isLastRow) {
          setTimeout(() => {
            navigateTask('next');
          }, 1000);
        }
      }

    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: `Failed to save new column data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, currentTask, datasetData, newColumnData, annotationConfig, showToast, editingField, metadata, handleSaveIndividualField, currentTaskIndex, navigateTask, tasks]);

  // New column data handlers - no auto-save, only manual save
  const handleNewColumnChange = useCallback((fieldName: string, value: string) => {
    setNewColumnData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    setPendingChanges(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  // Navigation handler
  const handleNavigateBack = useCallback(() => {
    router.push(`/dataset/${datasetId}`);
  }, [router, datasetId]);

  // Completion modal handlers
  const handleReturnToDataset = useCallback(() => {
    setShowCompletionModal(false);
    router.push(`/dataset/${datasetId}`);
  }, [router, datasetId]);

  const handleRecheckRows = useCallback(() => {
    setShowCompletionModal(false);
    // Reset to first row to allow rechecking
    setCurrentTaskIndex(0);
    // Optionally refresh the tasks to get latest status
    // This will be handled by the existing useEffect that loads tasks
  }, []);

  // Mark row as completed with backend persistence
  const handleMarkAsCompleted = useCallback(async (rowIndex: number) => {
    if (!datasetId) return;
    
    try {
      // Update local state immediately
      setTasks(prev => prev.map(task => 
        task.rowIndex === rowIndex 
          ? { ...task, status: 'completed' as const, updatedAt: new Date() }
          : task
      ));
      
      // Save to backend
      await DatasetMergedRowsAPI.markRowCompleted(datasetId, rowIndex);
      
      // Update progress tracking
      const completedCount = tasks.filter(t => t.status === 'completed' || t.rowIndex === rowIndex).length;
      await DatasetMergedRowsAPI.updateAnnotationProgress(datasetId, rowIndex, completedCount);
      
    } catch {
      // Revert local state on error
      setTasks(prev => prev.map(task => 
        task.rowIndex === rowIndex 
          ? { ...task, status: 'pending' as const }
          : task
      ));
      
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save completion status. Please try again.',
      });
    }
  }, [datasetId, tasks, showToast]);

  const annotatedTasks = tasks.filter(
    (task) => task.status === 'completed',
  );


  // Track the previous task to detect navigation
  const prevTaskRef = useRef<Task | null>(null);

  // Effect 1: Load fresh data when navigating to a new task
  useEffect(() => {
    if (!currentTask || !annotationConfig) return;

    // Check if we're navigating to a different task
    const isNewTask = prevTaskRef.current?.id !== currentTask.id;
    
    if (isNewTask) {
      const annotationFields = annotationConfig.annotationFields.filter(
        (field) => (field.isNewColumn || field.isAnnotationField) && field.isVisible !== false
      );

      // Load fresh data for the new task
      const newColumnData: NewColumnData = {};
      
      annotationFields.forEach((field) => {
        // Check multiple sources for field data, with priority:
        // 1. Saved annotation data (field.fieldName in metadata)
        // 2. Original CSV column data (field.csvColumnName in metadata)
        // 3. Empty string (don't carry over data from previous row)
        
        let fieldValue = currentTask.metadata?.[field.fieldName];
        
        // If no saved annotation data, check original CSV column name
        if (!fieldValue && field.csvColumnName && currentTask.metadata) {
          fieldValue = currentTask.metadata[field.csvColumnName];
        }
        
        // If still no value, use empty string (don't preserve old row data)
        if (!fieldValue) {
          fieldValue = '';
        }
        
        newColumnData[field.fieldName] = fieldValue;
      });
      
      setNewColumnData(newColumnData);
      setPendingChanges({}); // Clear pending changes for new task
    }

    // Update the previous task reference
    prevTaskRef.current = currentTask;
  }, [currentTask, annotationConfig]);

  // Effect 2: Initialize annotation fields when config changes
  useEffect(() => {
    if (!annotationConfig) return;

    const annotationFields = annotationConfig.annotationFields.filter(
      (field) => (field.isNewColumn || field.isAnnotationField) && field.isVisible !== false
    );

    // Initialize new column data structure
    setNewColumnData(prevNewColumnData => {
      const initialNewColumnData: NewColumnData = {};
      annotationFields.forEach((field) => {
        // Preserve existing values or initialize with empty string
        initialNewColumnData[field.fieldName] = prevNewColumnData[field.fieldName] || '';
      });
      return initialNewColumnData;
    });
  }, [annotationConfig]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" data-testid="annotation-workbench-loading-spinner" />
          <p className="text-gray-600">Loading dataset annotation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600" data-testid="annotation-workbench-error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main Content Area - Resizable Panels */}
      <div className="flex-1 overflow-hidden" data-testid="annotation-workbench-main-content">
        <ResizablePanels
          leftPanel={
            <MetadataDisplay
              metadata={metadata}
              orderedMetadataFields={orderedMetadataFields}
              draggedField={draggedField}
              editingField={editingField}
              expandedTextFields={expandedTextFields}
              datasetName={datasetName}
              datasetId={datasetId}
              rowIndex={currentTask?.rowIndex}
              imageAuthConfig={imageAuthConfig}
              onMetadataChange={setMetadata}
              onDragStart={handleDragStart}
              onDragOver={handleUnifiedDragOver}
              onDrop={(e, targetFieldName) => handleUnifiedDrop(e, targetFieldName, 'metadata')}
              onEditField={handleEditField}
              onSaveField={handleSaveField}
              onSaveIndividualField={handleSaveIndividualField}
              onCancelEdit={handleCancelEdit}
              onToggleTextExpansion={toggleTextExpansion}
              onNavigateBack={handleNavigateBack}
              onPanelDragOver={handleUnifiedDragOver}
              onDropFromAnnotation={() => handleUnifiedDrop(null, '', 'metadata')}
            />
          }
          rightPanel={
            <NewColumnDataPanel
              annotationConfig={annotationConfig}
              newColumnData={newColumnData}
              newColumns={datasetNewColumns}
              onNewColumnChange={handleNewColumnChange}
              onSaveAllNewColumnData={saveAllNewColumnData}
              onExportSelectedColumns={handleExportSelectedColumns}
              onExportAllColumns={handleExportAllColumns}
              isSaving={isSaving}
              datasetId={datasetId}
              rowIndex={currentTask?.rowIndex}
              imageAuthConfig={imageAuthConfig}
              onPanelDragOver={handleUnifiedDragOver}
              onDropFromMetadata={() => handleUnifiedDrop(null, '', 'annotation')}
              draggedField={draggedField}
              onAnnotationFieldDragStart={handleDragStart}
              onAnnotationFieldDragOver={handleUnifiedDragOver}
              onAnnotationFieldDrop={(e, targetFieldName) => handleUnifiedDrop(e, targetFieldName, 'annotation')}
            />
          }
          defaultLeftWidth={50}
          minLeftWidth={25}
          maxLeftWidth={75}
        />
      </div>

      {/* Fixed Footer: Row Navigation */}
      <RowFooter
        tasks={tasks}
        currentTaskIndex={currentTaskIndex}
        onNavigateTask={navigateTask}
        onJumpToRow={jumpToRow}
        onMarkAsCompleted={handleMarkAsCompleted}
        completedCount={annotatedTasks.length}
        totalCount={tasks.length}
      />


      {/* Completion Modal */}
      {showCompletionModal && completionStats && (
        <CompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onReturnToDataset={handleReturnToDataset}
          onRecheckRows={handleRecheckRows}
          completedCount={completionStats.completedCount}
          totalCount={completionStats.totalCount}
          completionTime={completionStats.completionTime}
        />
      )}
    </div>
  );
}
