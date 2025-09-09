'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Folder,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  User,
  Bell,
  HelpCircle,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  className?: string;
  forceCollapsed?: boolean;
}

export function Sidebar({ className, forceCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(forceCollapsed);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Use forceCollapsed if provided, otherwise use state
  const effectiveCollapsed = forceCollapsed || isCollapsed;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      id: 'dataset',
      label: 'Dataset',
      icon: Database,
      href: '/dataset',
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: Settings,
      href: '/profile',
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200/80 flex flex-col h-screen transition-all duration-300 shadow-sm',
        effectiveCollapsed ? 'w-20' : 'w-72',
        className,
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex items-center space-x-3',
              effectiveCollapsed && 'hidden',
            )}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">DataAnnotate</h2>
              <p className="text-xs text-gray-500">Data Annotation Platform</p>
            </div>
          </div>
          {!forceCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {effectiveCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-100">
        <div
          className={cn(
            'flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50',
            effectiveCollapsed && 'justify-center',
          )}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          {!effectiveCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className={cn('mb-4', effectiveCollapsed && 'hidden')}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            Main Menu
          </h3>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                effectiveCollapsed && 'justify-center px-2',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
              {!effectiveCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              {isActive && !effectiveCollapsed && (
                <div className="w-2 h-2 bg-white/30 rounded-full ml-auto animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {!effectiveCollapsed && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              Quick Actions
            </h3>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors',
            effectiveCollapsed && 'justify-center px-2',
          )}
        >
          <Bell className="h-4 w-4 mr-3 flex-shrink-0" />
          {!effectiveCollapsed && 'Notifications'}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors',
            effectiveCollapsed && 'justify-center px-2',
          )}
        >
          <HelpCircle className="h-4 w-4 mr-3 flex-shrink-0" />
          {!effectiveCollapsed && 'Help & Support'}
        </Button>

        <Button
          onClick={logout}
          variant="ghost"
          className={cn(
            'w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors',
            effectiveCollapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
          {!effectiveCollapsed && 'Sign Out'}
        </Button>
      </div>
    </aside>
  );
}
