"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  FolderPlus,
  FileText,
  Image,
  AudioLines,
  Database,
  Tag,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetadataField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

interface AnnotationClass {
  id: string;
  name: string;
  color: string;
  description?: string;
  hotkey?: string;
}

const projectTypes = [
  { value: 'text', label: 'Text Annotation', icon: FileText },
  { value: 'image', label: 'Image Annotation', icon: Image },
  { value: 'audio', label: 'Audio Annotation', icon: AudioLines },
  { value: 'multimodal', label: 'Multi-modal', icon: Database },
];

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
];

const predefinedColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#0f172a'
];

export default function AddProjectPage() {
  const router = useRouter();
  
  // Project Basic Info
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  
  // Metadata Schema
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  
  // Label Schema
  const [annotationClasses, setAnnotationClasses] = useState<AnnotationClass[]>([]);

  const addMetadataField = () => {
    const newField: MetadataField = {
      id: Date.now().toString(),
      name: '',
      label: '',
      type: 'text',
      required: false
    };
    setMetadataFields([...metadataFields, newField]);
  };

  const updateMetadataField = (id: string, updates: Partial<MetadataField>) => {
    setMetadataFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeMetadataField = (id: string) => {
    setMetadataFields(fields => fields.filter(field => field.id !== id));
  };

  const addAnnotationClass = () => {
    const newClass: AnnotationClass = {
      id: Date.now().toString(),
      name: '',
      color: predefinedColors[annotationClasses.length % predefinedColors.length],
      description: '',
      hotkey: ''
    };
    setAnnotationClasses([...annotationClasses, newClass]);
  };

  const updateAnnotationClass = (id: string, updates: Partial<AnnotationClass>) => {
    setAnnotationClasses(classes =>
      classes.map(cls =>
        cls.id === id ? { ...cls, ...updates } : cls
      )
    );
  };

  const removeAnnotationClass = (id: string) => {
    setAnnotationClasses(classes => classes.filter(cls => cls.id !== id));
  };

  const handleCreateProject = () => {
    if (!projectName || !projectType) {
      alert('Please fill in required fields');
      return;
    }

    const projectData = {
      name: projectName,
      description: projectDescription,
      type: projectType,
      metadataSchema: metadataFields,
      labelSchema: annotationClasses,
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating project:', projectData);
    
    // Generate a mock project ID and redirect
    const projectId = Date.now().toString();
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/project')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Set up your annotation project</p>
          </div>
        </div>

        {/* Single White Background Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Project Information */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <FolderPlus className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Project Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDescription" className="text-sm font-medium text-gray-700">Description</Label>
                  <Input
                    id="projectDescription"
                    placeholder="Brief description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Label className="text-sm font-medium text-gray-700">Project Type *</Label>
                <div className="grid grid-cols-4 gap-4">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setProjectType(type.value)}
                        className={cn(
                          "flex flex-col items-center space-y-3 p-4 rounded-lg border-2 transition-all hover:shadow-sm",
                          projectType === type.value
                            ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium text-center leading-tight">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metadata Schema */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Metadata Fields</h2>
                </div>
                <Button onClick={addMetadataField} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">Define metadata fields for your data</p>
              
              {metadataFields.length > 0 && (
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg">
                    <div className="col-span-3">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Field Name</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Display Label</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Default</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</span>
                    </div>
                  </div>
                  
                  {/* Field Rows */}
                  {metadataFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="col-span-3">
                        <Input
                          placeholder="field_name"
                          value={field.name}
                          onChange={(e) => updateMetadataField(field.id, { name: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Input
                          placeholder="Field Label"
                          value={field.label}
                          onChange={(e) => updateMetadataField(field.id, { label: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="col-span-2">
                        <select
                          value={field.type}
                          onChange={(e) => updateMetadataField(field.id, { type: e.target.value as any })}
                          className="w-full h-9 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <Input
                          placeholder="Default value"
                          value={field.defaultValue || ''}
                          onChange={(e) => updateMetadataField(field.id, { defaultValue: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="col-span-2 flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateMetadataField(field.id, { required: !field.required })}
                          className={cn(
                            "h-8 px-3 text-xs",
                            field.required ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {field.required ? "Required" : "Optional"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetadataField(field.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {field.type === 'select' && (
                        <div className="col-span-12 mt-3">
                          <Label className="text-sm font-medium text-gray-700">Options (comma-separated)</Label>
                          <Input
                            placeholder="Option 1, Option 2, Option 3"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateMetadataField(field.id, { 
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                            })}
                            className="h-9 mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {metadataFields.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No metadata fields defined yet</p>
                  <p className="text-sm">Add fields to describe your data structure</p>
                </div>
              )}
            </div>

            {/* Label Schema */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Annotation Classes</h2>
                </div>
                <Button onClick={addAnnotationClass} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">Define annotation classes for labeling</p>
              
              {annotationClasses.length > 0 && (
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg">
                    <div className="col-span-3">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Class Name</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Color</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hotkey</span>
                    </div>
                    <div className="col-span-5">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Description</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</span>
                    </div>
                  </div>
                  
                  {/* Class Rows */}
                  {annotationClasses.map((cls) => (
                    <div key={cls.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="col-span-3">
                        <Input
                          placeholder="Class name"
                          value={cls.name}
                          onChange={(e) => updateAnnotationClass(cls.id, { name: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={cls.color}
                            onChange={(e) => updateAnnotationClass(cls.id, { color: e.target.value })}
                            className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="col-span-1">
                        <Input
                          placeholder="K"
                          maxLength={1}
                          value={cls.hotkey || ''}
                          onChange={(e) => updateAnnotationClass(cls.id, { hotkey: e.target.value.toUpperCase() })}
                          className="h-9 text-center"
                        />
                      </div>

                      <div className="col-span-5">
                        <Input
                          placeholder="Class description"
                          value={cls.description || ''}
                          onChange={(e) => updateAnnotationClass(cls.id, { description: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnnotationClass(cls.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {annotationClasses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No annotation classes defined yet</p>
                  <p className="text-sm">Add classes to define what you'll be annotating</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleCreateProject}
            disabled={!projectName || !projectType}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 text-lg"
            size="lg"
          >
            <FolderPlus className="h-5 w-5 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
}
