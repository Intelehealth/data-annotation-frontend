"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ProjectContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <ProjectContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
