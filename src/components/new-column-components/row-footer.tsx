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
}

export function RowFooter({
  tasks,
  currentTaskIndex,
  onNavigateTask,
  onJumpToRow,
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
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTask('prev')}
            disabled={currentTaskIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Row {currentTaskIndex + 1} of {tasks.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTask('next')}
            disabled={currentTaskIndex === tasks.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Row Pagination */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 mr-2">Jump to:</span>
          <div className="flex space-x-1 max-w-md overflow-x-auto">
            {Array.from({ length: Math.min(20, tasks.length) }, (_, index) => {
              const rowNumber = index + 1;
              const isCurrentRow = currentTaskIndex === index;
              const task = tasks[index];
              
              return (
                <button
                  key={rowNumber}
                  onClick={() => onJumpToRow(rowNumber)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    isCurrentRow
                      ? 'bg-blue-600 text-white'
                      : task?.status === 'completed'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  title={`Row ${rowNumber} - ${task?.status || 'pending'}`}
                >
                  {rowNumber}
                </button>
              );
            })}
            {tasks.length > 20 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                ...{tasks.length - 20} more
              </span>
            )}
          </div>
        </div>

        {/* Status Summary */}
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
