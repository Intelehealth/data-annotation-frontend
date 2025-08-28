'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { projectsAPI, ProjectResponse } from '@/lib/api/projects';
import { Loader2 } from 'lucide-react';
import { ProjectSidebar } from '@/components/project-components/project-sidebar';
import { UploadComponent } from '@/components/project-components/upload-component';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Tag,
  Layers,
  BarChart3,
  Settings,
  FileText,
} from 'lucide-react';

export default function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { activeTab, setActiveTab } = useProject();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getById(params.projectId);
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };
  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    // Handle the selected files here
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Upload Data
                </h1>
                <p className="text-gray-600 mt-1">
                  Add new files to your project dataset
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Upload Files</span>
                </CardTitle>
                <CardDescription>
                  Add new files to your project dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadComponent onFilesSelected={handleFilesSelected} />
              </CardContent>
            </Card>
          </div>
        );

      case 'dataset':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dataset</h1>
                <p className="text-gray-600 mt-1">
                  Manage and organize your project files
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                <div className="flex items-center space-x-1 bg-white border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">📁</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No files uploaded yet
                  </h3>
                  <p className="mb-4">
                    Start by uploading some files to your project
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'annotations':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Annotations</h1>
              <p className="text-gray-600 mt-1">
                Create and manage annotations for your project files
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    Annotation Workbench
                  </h3>
                  <p className="mb-4">
                    Use the dedicated annotation page for detailed annotation
                    work
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = `/project/${params.projectId}/annotation`)
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Open Annotation Workbench
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'classes':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Classes & Tags
              </h1>
              <p className="text-gray-600 mt-1">
                Define annotation classes and categories
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No classes defined yet
                  </h3>
                  <p className="mb-4">
                    Create annotation classes to organize your data
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'versions':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Versions</h1>
              <p className="text-gray-600 mt-1">
                Manage dataset versions and iterations
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <Layers className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No versions created yet
                  </h3>
                  <p className="mb-4">
                    Create versions to track dataset changes
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Version
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">
                View project statistics and insights
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No data available
                  </h3>
                  <p className="mb-4">
                    Upload files and create annotations to see analytics
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {project.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl text-blue-600">📊</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {project.projectSchema.metadataFields.length}
                    </h3>
                    <p className="text-sm text-gray-600">Metadata Fields</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl text-green-600">🏷️</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {project.projectSchema.annotationLabels.length}
                    </h3>
                    <p className="text-sm text-gray-600">Annotation Labels</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl text-purple-600">📅</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-600">Created</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">🚀</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Get started with your project
                  </h3>
                  <p className="mb-4">
                    Choose a tab from the sidebar to begin working
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Start Uploading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Project Sidebar */}
      <ProjectSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        projectId={params.projectId}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
