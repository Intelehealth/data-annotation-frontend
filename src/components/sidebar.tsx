'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  User,
  LogOut,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutConfirmationModal } from '@/components/ui/logout-confirmation-modal';

interface SidebarProps {
  className?: string;
  forceCollapsed?: boolean;
}

export function Sidebar({ className, forceCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(forceCollapsed);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Use forceCollapsed if provided, otherwise use state
  const effectiveCollapsed = forceCollapsed || isCollapsed;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

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
    // Admin-only menu items
    ...(user?.role === 'admin' ? [
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        href: '/users',
      },
    ] : []),
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: Settings,
      href: '/profile',
    },
  ];


  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200/80 flex flex-col h-screen transition-all duration-300 shadow-sm',
        effectiveCollapsed ? 'w-20' : 'w-72',
        className,
      )}
      data-testid="main-sidebar"
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
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-gray-900 truncate" data-testid="sidebar-user-name">
                  {user?.firstName} {user?.lastName}
                </p>
                {user?.role && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      user.role === 'admin'
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
                    )}
                  >
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate" data-testid="sidebar-user-email">{user?.email}</p>
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
              data-testid={`sidebar-${item.id}-link`}
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
      <div className="p-4 border-t border-gray-100">
        <Button
          onClick={handleLogoutClick}
          variant="ghost"
          data-testid="sidebar-logout-button"
          className={cn(
            'w-full justify-start text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 border border-red-200 hover:border-red-500 hover:shadow-md hover:shadow-red-100',
            effectiveCollapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
          {!effectiveCollapsed && 'Sign Out'}
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </aside>
  );
}
