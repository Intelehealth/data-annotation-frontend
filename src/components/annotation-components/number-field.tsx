'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fieldName: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
}

export function NumberField({
  value,
  onChange,
  placeholder,
  className,
  fieldName,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  min,
  max,
  step = 1,
  allowDecimals = true,
}: NumberFieldProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Simple regex: only allow numbers, decimal point, and minus sign
    const validPattern = /^-?[\d.]*$/;
    
    if (validPattern.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1) ||
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
      return;
    }
    
    // Allow digits (0-9) on main keyboard and numpad
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    
    // Allow decimal point
    if (e.keyCode === 190 || e.keyCode === 110) {
      return;
    }
    
    // Allow minus sign
    if (e.keyCode === 189 || e.keyCode === 109) {
      return;
    }
    
    // Prevent all other keys
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    
    // Simple validation: only allow numbers, decimal point, and minus sign
    const validPattern = /^-?[\d.]*$/;
    
    if (validPattern.test(paste)) {
      onChange(paste);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Edit Mode</span>
          </div>
        </div>
        
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || `Enter ${fieldName.toLowerCase()}...`}
          className="h-10"
        />
        
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Read-only mode - simple display
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Number Field</span>
        </div>
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      
      <div className="p-3 border border-gray-200 rounded-md bg-white">
        <div className="text-lg font-semibold text-gray-800">
          {value || <span className="text-gray-400 italic">No value</span>}
        </div>
      </div>
    </div>
  );
}
