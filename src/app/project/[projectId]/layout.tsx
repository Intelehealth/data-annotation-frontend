"use client";

import { Sidebar } from "@/components/sidebar";
import { ProjectProvider } from "@/contexts/ProjectContext";

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Sidebar - Force collapsed state for project detail pages */}
      <Sidebar forceCollapsed={true} />
      
      {/* Project Content with ProjectContext */}
      <div className="flex-1">
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </div>
    </div>
  );
}
