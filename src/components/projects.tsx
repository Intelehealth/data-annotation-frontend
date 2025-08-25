"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { 
  Plus,
  Search,
  MoreHorizontal,
  FolderOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'pending' | 'paused';
  createdAt: string;
  lastModified: string;
  type: 'object-detection' | 'image-classification' | 'text-annotation' | 'segmentation';
  imageCount: number;
  modelsCount: number;
  isPublic: boolean;
}

// Mock data - replace with real data from your API
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'projext-2',
    description: 'Object detection project for traffic signs',
    status: 'active',
    createdAt: '2024-01-15',
    lastModified: '2024-01-20',
    type: 'object-detection',
    imageCount: 5,
    modelsCount: 0,
    isPublic: true
  },
  {
    id: '2',
    name: 'Prokjext-2',
    description: 'Instance segmentation for medical images',
    status: 'active',
    createdAt: '2024-01-01',
    lastModified: '2024-01-18',
    type: 'segmentation',
    imageCount: 1,
    modelsCount: 0,
    isPublic: true
  },
  {
    id: '3',
    name: 'My First Project',
    description: 'Object detection for food items',
    status: 'active',
    createdAt: '2024-01-10',
    lastModified: '2024-01-21',
    type: 'object-detection',
    imageCount: 3,
    modelsCount: 0,
    isPublic: true
  }
];



const typeConfig = {
  'object-detection': { label: 'Object Detection', color: 'bg-blue-50 text-blue-700' },
  'image-classification': { label: 'Image Classification', color: 'bg-green-50 text-green-700' },
  'text-annotation': { label: 'Text Annotation', color: 'bg-purple-50 text-purple-700' },
  'segmentation': { label: 'Instance Segmentation', color: 'bg-orange-50 text-orange-700' }
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track your data annotation projects</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-start">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all duration-200"
          />
        </div>
      </div>

             {/* Projects Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {currentProjects.map((project) => (
           <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
             <CardContent className="p-0">
               {/* Project Header */}
               <div className="p-4 pb-3">
                 <div className="flex items-start justify-between mb-3">
                   <div className="flex-1">
                     <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                       {project.name}
                     </h3>
                     <p className="text-sm text-gray-500 mt-1 truncate">
                       {project.description}
                     </p>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1">
                     <MoreHorizontal className="h-4 w-4" />
                   </Button>
                 </div>
                 
                 {/* Project Type Badge */}
                 <div className="mb-3">
                   <span className={cn(
                     "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full",
                     typeConfig[project.type].color
                   )}>
                     {typeConfig[project.type].label}
                   </span>
                 </div>
               </div>
               
               {/* Project Image Placeholder */}
               <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-100 flex items-center justify-center">
                 <div className="text-center text-gray-400">
                   <FolderOpen className="h-8 w-8 mx-auto mb-1 opacity-60" />
                   <p className="text-xs">Project Preview</p>
                 </div>
               </div>
               
               {/* Project Footer */}
               <div className="p-4 pt-3 bg-gray-50/50">
                 <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                   <span className="flex items-center gap-1">
                     <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                     {project.imageCount} {project.imageCount === 1 ? 'Image' : 'Images'}
                   </span>
                   <span className="flex items-center gap-1">
                     <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                     {project.modelsCount} {project.modelsCount === 1 ? 'Model' : 'Models'}
                   </span>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <span className="text-xs text-gray-500">
                     Edited {getTimeAgo(project.lastModified)}
                   </span>
                   <span className={cn(
                     "px-2 py-0.5 text-xs rounded-full font-medium",
                     project.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                   )}>
                     {project.isPublic ? "Public" : "Private"}
                   </span>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>

       {/* Pagination */}
       {totalPages > 1 && (
         <div className="flex items-center justify-center space-x-2 mt-8">
           <Button
             variant="outline"
             size="sm"
             onClick={() => handlePageChange(currentPage - 1)}
             disabled={currentPage === 1}
             className="h-8 w-8 p-0"
           >
             <ChevronLeft className="h-4 w-4" />
           </Button>
           
           <div className="flex items-center space-x-1">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
               <Button
                 key={page}
                 variant={currentPage === page ? "default" : "outline"}
                 size="sm"
                 onClick={() => handlePageChange(page)}
                 className="h-8 w-8 p-0"
               >
                 {page}
               </Button>
             ))}
           </div>
           
           <Button
             variant="outline"
             size="sm"
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages}
             className="h-8 w-8 p-0"
           >
             <ChevronRight className="h-4 w-4" />
           </Button>
         </div>
       )}

             {/* Empty State */}
       {currentProjects.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? "Try adjusting your search criteria" 
              : "Get started by creating your first project"}
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            + New Project
          </Button>
        </Card>
      )}
    </div>
  );
}
