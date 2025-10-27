'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Slider } from '@/components/ui/slider'; // Not available, using custom slider
import { cn } from '@/lib/utils';
import { MultiselectInput } from './multiselect-input';

interface NewColumn {
  id: string;
  columnName: string;
  columnType: 'text' | 'number' | 'select' | 'selectrange' | 'multiselect';
  isRequired: boolean;
  defaultValue?: string;
  options?: string[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface NewColumnInputProps {
  column: NewColumn;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function NewColumnInput({
  column,
  value,
  onChange,
  placeholder,
  className,
}: NewColumnInputProps) {

  // Handle text input
  if (column.columnType === 'text') {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${column.columnName.toLowerCase()}...`}
        className={cn("min-h-[100px] resize-y overflow-hidden", className)}
        style={{
          height: (() => {
            const lines = value.split('\n');
            const estimatedHeight = Math.max(100, lines.length * 24 + 20);
            return Math.min(estimatedHeight, 400) + 'px';
          })(),
        }}
      />
    );
  }

  // Handle number input
  if (column.columnType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${column.columnName.toLowerCase()}...`}
        className={cn("h-10", className)}
        min={column.validation?.min}
        max={column.validation?.max}
        step="any"
      />
    );
  }

  // Handle multiselect input
  if (column.columnType === 'multiselect' && column.options && column.options.length > 0) {
    return (
      <MultiselectInput
        options={column.options}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Select ${column.columnName.toLowerCase()}...`}
        className={className}
        columnName={column.columnName}
      />
    );
  }

  // Handle select dropdown or radio buttons (based on number of options)
  if (column.columnType === 'select' && column.options && column.options.length > 0) {
    // Use radio buttons if 5 or fewer options, otherwise use dropdown
    if (column.options.length <= 5) {
      return (
        <div className={cn("p-3 border border-gray-200 rounded-md bg-white", className)}>
          <RadioGroup value={value} onValueChange={onChange} className="flex flex-col gap-0">
            {column.options.map((option, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={option} id={`${column.id}-${index}`} />
                <Label 
                  htmlFor={`${column.id}-${index}`} 
                  className="cursor-pointer font-normal text-sm text-gray-700 flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }
    
    // Use dropdown for more than 5 options
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-10 min-w-[200px] w-full", className)}>
          <SelectValue placeholder={placeholder || `Choose ${column.columnName.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent className="min-w-[200px]">
          {column.options.map((option, index) => (
            <SelectItem key={index} value={option} className="min-w-[200px]">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Handle select range (radio buttons or dropdown based on range size)
  if (column.columnType === 'selectrange' && column.validation) {
    const min = column.validation.min || 0;
    const max = column.validation.max || 10;
    
    // Generate options array from min to max
    const rangeOptions = [];
    for (let i = min; i <= max; i++) {
      rangeOptions.push(i.toString());
    }

    // Use radio buttons if 5 or fewer options, otherwise use dropdown
    if (rangeOptions.length <= 5) {
      return (
        <div className={cn("p-3 border border-gray-200 rounded-md bg-white", className)}>
          <RadioGroup value={value} onValueChange={onChange} className="flex flex-col gap-0">
            {rangeOptions.map((option, index) => (
              <div 
                key={option} 
                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={option} id={`${column.id}-range-${index}`} />
                <Label 
                  htmlFor={`${column.id}-range-${index}`} 
                  className="cursor-pointer font-normal text-sm text-gray-700 flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    // Use dropdown for more than 5 options
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-10 min-w-[200px] w-full", className)}>
          <SelectValue placeholder={`Choose ${column.columnName.toLowerCase()} (${min}-${max})...`} />
        </SelectTrigger>
        <SelectContent className="min-w-[200px]">
          {rangeOptions.map((option) => (
            <SelectItem key={option} value={option} className="min-w-[200px]">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Fallback to textarea for unknown types or missing options
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Enter ${column.columnName.toLowerCase()}...`}
      className={cn("min-h-[100px] resize-y overflow-hidden", className)}
      style={{
        height: (() => {
          const lines = value.split('\n');
          const estimatedHeight = Math.max(100, lines.length * 24 + 20);
          return Math.min(estimatedHeight, 400) + 'px';
        })(),
      }}
    />
  );
}
