'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fieldName: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export function MarkdownField({
  value,
  onChange,
  placeholder,
  className,
  fieldName,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
}: MarkdownFieldProps) {

  // Simple markdown renderer for preview
  const renderMarkdown = (text: string) => {
    if (!text) return <span className="text-gray-400 italic">No content</span>;
    
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-bold mb-2">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-medium mb-1">{line.slice(4)}</h3>;
        }
        
        // Handle bold text
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={index} className="mb-1">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? 
                  <strong key={partIndex}>{part}</strong> : 
                  <span key={partIndex}>{part}</span>
              )}
            </p>
          );
        }
        
        // Handle italic text
        if (line.includes('*') && !line.includes('**')) {
          const parts = line.split('*');
          return (
            <p key={index} className="mb-1">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? 
                  <em key={partIndex}>{part}</em> : 
                  <span key={partIndex}>{part}</span>
              )}
            </p>
          );
        }
        
        // Handle code blocks
        if (line.startsWith('```')) {
          return <div key={index} className="bg-gray-100 p-2 rounded font-mono text-sm my-2">Code block</div>;
        }
        
        // Handle lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
        }
        
        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
          return <li key={index} className="ml-4 mb-1">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Regular paragraph
        if (line.trim()) {
          return <p key={index} className="mb-1">{line}</p>;
        }
        
        // Empty line
        return <br key={index} />;
      });
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Edit Mode</span>
          </div>
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${fieldName.toLowerCase()} in markdown...`}
          className="min-h-[200px] resize-y overflow-hidden font-mono text-sm"
          style={{
            height: (() => {
              const lines = value.split('\n');
              const estimatedHeight = Math.max(200, lines.length * 20 + 20);
              return Math.min(estimatedHeight, 400) + 'px';
            })(),
          }}
        />
        
        <div className="text-xs text-gray-500">
          <strong>Markdown Tips:</strong> Use # for headers, **bold**, *italic*, - for lists, ``` for code blocks
        </div>
        
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

  // Read-only mode - always show rendered markdown
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Markdown Content</span>
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
      
      <div className="p-3 border border-gray-200 rounded-md bg-white min-h-[100px] max-h-[400px] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          {renderMarkdown(value)}
        </div>
      </div>
    </div>
  );
}
