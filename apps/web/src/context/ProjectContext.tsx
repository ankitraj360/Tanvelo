'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Environment {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  environments: Environment[];
  _count?: {
    apiKeys: number;
    gatewayRequests: number;
  };
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  currentEnvironment: Environment | null;
  setCurrentProject: (project: Project) => void;
  setCurrentEnvironment: (environment: Environment) => void;
  refreshProjects: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  currentProject: null,
  currentEnvironment: null,
  setCurrentProject: () => {},
  setCurrentEnvironment: () => {},
  refreshProjects: async () => {},
  loading: true,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [currentEnvironment, setCurrentEnvironmentState] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);

        // Keep or set current project
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('tanvelo_project_id') : null;
        let selectedProj = data.find((p) => p.id === savedProjectId) || data[0] || null;

        if (selectedProj) {
          setCurrentProjectState(selectedProj);
          const savedEnvId = typeof window !== 'undefined' ? localStorage.getItem('tanvelo_env_id') : null;
          let selectedEnv = selectedProj.environments.find((e) => e.id === savedEnvId) || selectedProj.environments[0] || null;
          setCurrentEnvironmentState(selectedEnv);
        }
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tanvelo_project_id', project.id);
    }
    // Select first environment of this project
    const env = project.environments?.[0] || null;
    setCurrentEnvironmentState(env);
    if (env && typeof window !== 'undefined') {
      localStorage.setItem('tanvelo_env_id', env.id);
    }
  };

  const setCurrentEnvironment = (env: Environment) => {
    setCurrentEnvironmentState(env);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tanvelo_env_id', env.id);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        currentEnvironment,
        setCurrentProject,
        setCurrentEnvironment,
        refreshProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
