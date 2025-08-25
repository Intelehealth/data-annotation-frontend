"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  Image, 
  FileAudio, 
  File, 
  X,
  CloudUpload
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadComponentProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function UploadComponent({ onFilesSelected, className }: UploadComponentProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (file.type.includes('audio')) return <FileAudio className="h-5 w-5 text-green-500" />;
    if (file.type.includes('document') || file.name.endsWith('.docx')) return <FileText className="h-5 w-5 text-orange-500" />;
    if (file.type.includes('text') || file.name.endsWith('.txt')) return <FileText className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          isDragOver
            ? "border-blue-400 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
        )}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className={cn(
            "p-3 rounded-full transition-colors",
            isDragOver ? "bg-blue-100" : "bg-gray-100"
          )}>
            <CloudUpload className={cn(
              "h-8 w-8 transition-colors",
              isDragOver ? "text-blue-600" : "text-gray-500"
            )} />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-gray-900">
              {isDragOver ? "Drop files here" : "Click to upload or drag & drop"}
            </h3>
            <p className="text-sm text-gray-500">
              Support for images, documents, text files, and audio files
            </p>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('fileInput')?.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
        </div>

        <input
          id="fileInput"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.docx,.doc,.txt,.pdf,.mp3,.wav,.aac,.flac"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Selected Files ({selectedFiles.length})
            </Label>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate max-w-48">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button className="w-full" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload {selectedFiles.length} Files
            </Button>
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <File className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Supported Formats</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div>• Images: JPG, PNG, GIF, BMP, WebP</div>
          <div>• Documents: DOCX, DOC, PDF, TXT</div>
          <div>• Audio: MP3, WAV, AAC, FLAC</div>
          <div>• Max Size: 50MB per file</div>
        </div>
      </div>
    </div>
  );
}
