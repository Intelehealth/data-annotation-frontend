'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsAPI } from '@/lib/api/datasets';
import { useToast } from '@/components/ui/toast';

interface ImageAuthConfigCardProps {
  datasetId: string;
  initialConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  };
  onConfigSaved?: () => void;
}

export function ImageAuthConfigCard({
  datasetId,
  initialConfig,
  onConfigSaved,
}: ImageAuthConfigCardProps) {
  const { showToast } = useToast();
  const [isPrivate, setIsPrivate] = useState(initialConfig?.isPrivate || false);
  const [username, setUsername] = useState(initialConfig?.username || '');
  const [password, setPassword] = useState(''); // Always empty for security
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(!!initialConfig?.password);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-save when switching to Public
  const handleTogglePrivate = async (newPrivateState: boolean) => {
    setIsPrivate(newPrivateState);
    
    // If switching to Public, auto-save immediately
    if (!newPrivateState) {
      setSaving(true);
      try {
        await datasetsAPI.update(datasetId, {
          imageAuthConfig: {
            isPrivate: false,
            username: undefined,
            password: undefined,
          },
        });

        showToast({
          title: 'Success',
          description: 'Switched to public images',
          type: 'success',
        });

        setHasChanges(false);
        if (onConfigSaved) {
          onConfigSaved();
        }
      } catch (error: any) {
        showToast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update settings',
          type: 'error',
        });
        // Revert on error
        setIsPrivate(true);
      } finally {
        setSaving(false);
      }
    }
  };

  // Track changes
  useEffect(() => {
    const configChanged =
      isPrivate !== (initialConfig?.isPrivate || false) ||
      username !== (initialConfig?.username || '') ||
      password !== ''; // Any password entry is a change
    
    setHasChanges(configChanged);
  }, [isPrivate, username, password, initialConfig]);

  // Validate form
  const isFormValid = () => {
    if (!isPrivate) return true; // Public images don't need credentials
    // Username required, password required only if no existing password or if changed
    return username.trim() !== '' && (hasExistingPassword || password.trim() !== '');
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      showToast({
        title: 'Validation Error',
        description: 'Username and password are required for private images',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const configToSave: any = {
        isPrivate,
        username: isPrivate ? username : undefined,
      };
      
      // Only send password if it was changed (not empty)
      if (password.trim() !== '') {
        configToSave.password = password;
      }

      await datasetsAPI.update(datasetId, {
        imageAuthConfig: configToSave,
      });

      showToast({
        title: 'Success',
        description: 'Image authentication settings saved successfully',
        type: 'success',
      });

      // If password was saved, mark that we now have an existing password
      if (password.trim() !== '') {
        setHasExistingPassword(true);
      }
      
      // Clear password field after save
      setPassword('');
      setHasChanges(false);
      
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-blue-300 bg-blue-50/50 rounded-lg mb-3">
      {/* Header */}
      <div className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-base font-semibold text-gray-900">
              <Lock className="h-4.5 w-4.5 text-blue-600" />
              <span data-testid="image-auth-config-title">Image Authentication</span>
            </div>
            {/* Toggle Switch */}
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm", !isPrivate ? "text-gray-700 font-medium" : "text-gray-400")}>
                Public
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => handleTogglePrivate(!isPrivate)}
                data-testid="image-auth-switch-button"
                disabled={saving}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  isPrivate ? "bg-blue-600" : "bg-gray-300",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform",
                    isPrivate ? "translate-x-5.5" : "translate-x-0.5"
                  )}
                />
              </button>
              <span className={cn("text-sm", isPrivate ? "text-blue-700 font-medium" : "text-gray-400")}>
                Private
              </span>
            </div>
          </div>
          {/* Show Save button only when Private is enabled */}
          {isPrivate && (
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges || !isFormValid()}
              size="sm"
              data-testid="image-auth-save-password-button"
              className="bg-black hover:bg-gray-800 text-white h-9 px-4 text-sm font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Password
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pb-3 pt-1">
        {/* Credentials Section - Only shown when Private */}
        {isPrivate && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1.5">
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  data-testid="image-auth-username-input"
                  className="mt-1.5 h-10 text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1.5">
                  Password {hasExistingPassword ? '' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={hasExistingPassword ? "Enter to change" : "Password"}
                    data-testid="image-auth-password-input"
                    className="mt-1.5 h-10 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                    data-testid="image-auth-password-toggle"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {!username.trim() && (
              <div className="flex items-center space-x-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-800" data-testid="image-auth-username-required-message">Username required</span>
              </div>
            )}

            {!hasExistingPassword && !password.trim() && username.trim() && (
              <div className="flex items-center space-x-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-800" data-testid="image-auth-password-required-message">Password required</span>
              </div>
            )}

            {hasExistingPassword && !password.trim() && username.trim() && !hasChanges && (
              <div className="flex items-center space-x-2 p-2.5 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800" data-testid="image-auth-credentials-saved-message">Credentials saved</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

