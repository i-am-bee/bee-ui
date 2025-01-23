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
import { createContext, PropsWithChildren, use, useMemo } from 'react';

interface WorkspaceContext {
  organization: Organization;
  project: Project;
}

const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

interface Props extends PropsWithChildren, WorkspaceContext {}

export const WorkspaceProvider = ({
  organization,
  project,
  children,
}: Props) => {
  const value = useMemo(
    () => ({
      organization,
      project,
    }),
    [organization, project],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = use(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }

  return context;
};
