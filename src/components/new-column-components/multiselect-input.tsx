'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiselectInputProps {
  options: string[];
  value: string; // Comma-separated string of selected values
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  columnName?: string;
}

export function MultiselectInput({
  options,
  value,
  onChange,
  placeholder,
  className,
  columnName = 'field',
}: MultiselectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Parse the comma-separated value into an array
  useEffect(() => {
    const parsed = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
    setSelectedValues(parsed);
  }, [value]);

  // Handle option selection/deselection
  const handleOptionToggle = (option: string) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    
    setSelectedValues(newSelected);
    onChange(newSelected.join(', '));
  };

  // Remove a selected option
  const handleRemoveOption = (option: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newSelected = selectedValues.filter(v => v !== option);
    setSelectedValues(newSelected);
    onChange(newSelected.join(', '));
  };

  // Clear all selections
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValues([]);
    onChange('');
  };

  // Check available space and determine dropdown direction
  const checkDropdownPosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = 300; // Approximate max dropdown height

    // Open upwards if not enough space below and more space above
    setOpenUpwards(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  };

  // Handle dropdown toggle with position check
  const handleToggleDropdown = () => {
    if (!isOpen) {
      checkDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use checkboxes if 5 or fewer options, otherwise use dropdown
  if (options.length <= 5) {
    return (
      <div className={cn("space-y-3 cursor-default", className)}>
        {/* Checkbox list */}
        <div className="p-3 border border-gray-200 rounded-md bg-white space-y-1 cursor-default">
          {options.map((option, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Checkbox
                checked={selectedValues.includes(option)}
                onCheckedChange={() => handleOptionToggle(option)}
                id={`multiselect-${columnName}-${index}`}
              />
              <Label 
                htmlFor={`multiselect-${columnName}-${index}`} 
                className="cursor-pointer font-normal text-sm text-gray-700 flex-1"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
        
        {/* Bottom selected chips removed for checkbox mode (<= 5 options) */}
      </div>
    );
  }

  // Use dropdown for more than 5 options
  return (
    <div className={cn("relative w-full space-y-3 cursor-default", className)} ref={dropdownRef}>
      {/* Dropdown trigger */}
      <div 
        ref={triggerRef}
        className="min-h-[40px] p-3 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 transition-colors"
        onClick={handleToggleDropdown}
      >
        <div className="flex items-center justify-between">
          <div className="text-gray-700 text-sm">
            {selectedValues.length > 0 
              ? `${selectedValues.length} option${selectedValues.length !== 1 ? 's' : ''} selected`
              : placeholder || `Select ${columnName.toLowerCase()}...`
            }
          </div>
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden",
          openUpwards ? "bottom-full mb-1" : "top-full mt-1"
        )}>
          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option, index) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionToggle(option);
                  }}
                >
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onCheckedChange={() => handleOptionToggle(option)}
                    id={`multiselect-dropdown-${columnName}-${index}`}
                  />
                  <Label 
                    htmlFor={`multiselect-dropdown-${columnName}-${index}`}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
                No options available
              </div>
            )}
          </div>

          {/* Footer with selection count */}
          {selectedValues.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 text-center">
              {selectedValues.length} option{selectedValues.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {/* Selected values display at the bottom */}
      {selectedValues.length > 0 && (
        <div className="p-2 border border-green-200 rounded-md bg-green-50">
          <div className="text-xs text-green-700 font-medium mb-1">
            Selected ({selectedValues.length}):
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedValues.map((option) => (
              <span
                key={option}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md border border-green-300"
              >
                {option}
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(option, e)}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-green-700 hover:text-green-900 px-1 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
