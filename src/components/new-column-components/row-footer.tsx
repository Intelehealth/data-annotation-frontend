'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  rowIndex: number;
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

interface RowFooterProps {
  tasks: Task[];
  currentTaskIndex: number;
  onNavigateTask: (direction: 'prev' | 'next') => void;
  onJumpToRow: (rowIndex: number) => void;
  onMarkAsCompleted?: (rowIndex: number) => void;
}

export function RowFooter({
  tasks,
  currentTaskIndex,
  onNavigateTask,
  onJumpToRow,
  onMarkAsCompleted,
}: RowFooterProps) {
  const annotatedTasks = tasks.filter(
    (task) => task.status === 'completed',
  );
  const unannotatedTasks = tasks.filter(
    (task) => task.status !== 'completed',
  );

  return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Row info */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              Row {currentTaskIndex + 1} of {tasks.length}
            </span>
          </div>

          {/* Center: Previous + Jump to Row + Next */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => onNavigateTask('prev')}
              disabled={currentTaskIndex === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {/* Show first few rows */}
              {currentTaskIndex > 5 && (
                <>
                  <button
                    onClick={() => onJumpToRow(1)}
                    className="px-2 py-1 text-xs rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    title="Row 1"
                  >
                    1
                  </button>
                  {currentTaskIndex > 6 && (
                    <span className="text-xs text-gray-500 px-1">...</span>
                  )}
                </>
              )}
              
              {/* Show current row ±5 */}
              {Array.from({ length: Math.min(10, tasks.length) }, (_, index) => {
                const startIndex = Math.max(0, Math.min(currentTaskIndex - 4, tasks.length - 10));
                const rowNumber = startIndex + index + 1;
                const isCurrentRow = currentTaskIndex === startIndex + index;
                const task = tasks[startIndex + index];
                
                if (rowNumber > tasks.length) return null;
                
                return (
                  <button
                    key={rowNumber}
                    onClick={() => onJumpToRow(rowNumber)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      isCurrentRow
                        ? 'bg-blue-600 text-white'
                        : task?.status === 'completed'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                    title={`Row ${rowNumber} - ${task?.status || 'pending'}`}
                  >
                    {rowNumber}
                  </button>
                );
              })}
              
              {/* Show last row if not already shown */}
              {currentTaskIndex < tasks.length - 6 && (
                <>
                  {currentTaskIndex < tasks.length - 7 && (
                    <span className="text-xs text-gray-500 px-1">...</span>
                  )}
                  <button
                    onClick={() => onJumpToRow(tasks.length)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      currentTaskIndex === tasks.length - 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                    title={`Row ${tasks.length} - Last row`}
                  >
                    {tasks.length}
                  </button>
                </>
              )}
            </div>
            
            <Button
              onClick={() => {
                // Auto-mark current row as completed when clicking Next
                if (onMarkAsCompleted && tasks[currentTaskIndex]?.status !== 'completed') {
                  onMarkAsCompleted(currentTaskIndex);
                }
                onNavigateTask('next');
              }}
              disabled={currentTaskIndex === tasks.length - 1}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Right: Status Summary */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">{annotatedTasks.length} completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">{unannotatedTasks.length} pending</span>
            </div>
          </div>
        </div>
      </div>
  );
}
