'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Database,
  FileText,
  BarChart3,
  Tag,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatasetSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  datasetId: string;
  className?: string;
}

export function DatasetSidebar({
  activeTab,
  onTabChange,
  datasetId,
  className,
}: DatasetSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const datasetMenuItems = [
    {
      id: 'overview',
      label: 'Data Overview',
      icon: Database,
      description: 'View dataset information',
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      description: 'Add new files to dataset',
    },
    {
      id: 'field-configuration',
      label: 'Field Configuration',
      icon: FileText,
      description: 'Configure CSV annotation fields',
    },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200/80 flex flex-col transition-all duration-300 shadow-sm',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Dataset Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Dataset {datasetId.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-500">Data Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Dataset Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {!isCollapsed && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Dataset Menu
            </h3>
          </div>
        )}

        {datasetMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group',
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed && 'justify-center px-2',
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-500 truncate block">
                    {isActive ? item.description : item.description}
                  </span>
                </div>
              )}
              {isActive && !isCollapsed && (
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
