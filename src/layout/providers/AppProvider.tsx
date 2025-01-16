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
import { ProjectUser } from '@/app/api/projects-users/types';
import { Project } from '@/app/api/projects/types';
import { encodeEntityWithMetadata } from '@/app/api/utils';
import { getAssistantsQueries } from '@/modules/assistants/api';
import { Assistant } from '@/modules/assistants/types';
import { getProjectsQueries } from '@/modules/projects/api';
import { getProjectUsersQueries } from '@/modules/projects/users/api';
import { useUserProfile } from '@/store/user-profile';
import { FeatureName } from '@/utils/parseFeatureFlags';
import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  use,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface AppContextValue {
  assistant: Assistant | null;
  project: Project;
  organization: Organization;
  role: ProjectUser['role'] | null;
  isProjectReadOnly?: boolean;
  featureFlags: Record<FeatureName, boolean>;
  onPageLeaveRef: MutableRefObject<() => void>;
}

export interface AppApiContextValue {
  selectAssistant: (assistant: Assistant | null) => void;
  selectProject: (project: Project) => void;
  onPageLeave: () => void;
}

const AppContext = createContext<AppContextValue>(
  null as unknown as AppContextValue,
);

const AppApiContext = createContext<AppApiContextValue>(
  null as unknown as AppApiContextValue,
);

interface Props {
  featureFlags: Record<FeatureName, boolean>;
  project: Project;
  organization: Organization;
}

export function AppProvider({
  featureFlags,
  project: initialProject,
  organization,
  children,
}: PropsWithChildren<Props>) {
  const [project, setProject] = useState<Project>(initialProject);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const onPageLeaveRef = useRef(() => null);
  const userId = useUserProfile((state) => state.id);
  const projectsQueries = getProjectsQueries({ organization });
  const assistantsQueries = getAssistantsQueries({ organization, project });
  const projectUsersQueries = getProjectUsersQueries({ organization });

  const { data: projectData } = useQuery({
    ...projectsQueries.detail(project.id),
    initialData: project,
  });

  const { data: assistantData } = useQuery({
    ...assistantsQueries.detail(assistant?.id ?? ''),
    enabled: Boolean(assistant),
    initialData: assistant
      ? encodeEntityWithMetadata<Assistant>(assistant)
      : undefined,
  });

  const { data: projectUser } = useQuery({
    ...projectUsersQueries.detail(project.id, userId),
    enabled: Boolean(userId),
  });

  const apiValue = useMemo(
    () => ({
      selectAssistant: setAssistant,
      selectProject: setProject,
      onPageLeave: () => onPageLeaveRef.current?.(),
    }),
    [],
  );

  const isProjectReadOnly = projectUser
    ? projectUser.role === 'reader'
    : Boolean(userId);

  return (
    <AppApiContext.Provider value={apiValue}>
      <AppContext.Provider
        value={{
          featureFlags,
          assistant: assistantData ?? assistant,
          project: projectData ?? project,
          organization,
          isProjectReadOnly,
          role: projectUser?.role ?? null,
          onPageLeaveRef,
        }}
      >
        {children}
      </AppContext.Provider>
    </AppApiContext.Provider>
  );
}

export function useAppContext() {
  const context = use(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider');
  }

  return context;
}

export function useAppApiContext() {
  const context = use(AppApiContext);

  if (!context) {
    throw new Error('useAppApiContext must be used within a AppProvider');
  }

  return context;
}
