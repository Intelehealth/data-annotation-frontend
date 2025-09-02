'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Database,
  FileText,
  Settings,
  BarChart3,
  Tag,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  projectId: string;
  className?: string;
}

export function ProjectSidebar({
  activeTab,
  onTabChange,
  projectId,
  className,
}: ProjectSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const projectMenuItems = [
    {
      id: 'upload',
      label: 'Upload Data',
      icon: Upload,
      description: 'Add new files to project',
    },
    {
      id: 'dataset',
      label: 'Dataset',
      icon: Database,
      description: 'Manage project files',
    },
    {
      id: 'field-selection',
      label: 'Field Selection',
      icon: FileText,
      description: 'Configure CSV annotation fields',
    },
    {
      id: 'annotations',
      label: 'Annotations',
      icon: FileText,
      description: 'Create and manage annotations',
    },
    {
      id: 'classes',
      label: 'Classes & Tags',
      icon: Tag,
      description: 'Define annotation classes',
    },
    {
      id: 'versions',
      label: 'Versions',
      icon: Layers,
      description: 'Manage dataset versions',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'View project statistics',
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
      {/* Project Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Project {projectId.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-500">Data Annotation</p>
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

      {/* Project Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {!isCollapsed && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Project Menu
            </h3>
          </div>
        )}

        {projectMenuItems.map((item) => {
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

      {/* Project Settings */}
      <div className="p-3 border-t border-gray-100">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors',
            isCollapsed && 'justify-center px-2',
          )}
          title={isCollapsed ? 'Project Settings' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="ml-3 text-sm">Project Settings</span>
          )}
        </Button>
      </div>
    </aside>
  );
}
