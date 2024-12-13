/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { createContext, PropsWithChildren, use } from 'react';

interface Props {
  project: Project;
  organization: Organization;
}

const ProjectContext = createContext<Props>(null as unknown as Props);

export function ProjectProvider({
  project,
  organization,
  children,
}: PropsWithChildren<Props>) {
  return (
    <ProjectContext.Provider
      value={{
        project,
        organization,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = use(ProjectContext);

  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }

  return context;
}
