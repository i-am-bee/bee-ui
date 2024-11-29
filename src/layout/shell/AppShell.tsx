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

import { fetchProject } from '@/app/api/rsc';
import { ProjectStoreProvider } from '@/stores/project/ProjectStoreProvider';
import { MAIN_ELEMENT_ID } from '@/utils/constants';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { AppProvider } from '../providers/AppProvider';
import { AppHeader } from './AppHeader';
import classes from './AppShell.module.scss';

interface Props {
  projectId: string;
}

export async function AppShell({
  projectId,
  children,
}: PropsWithChildren<Props>) {
  const project = await fetchProject(projectId);

  if (!project) notFound();

  return (
    <ProjectStoreProvider project={project}>
      <AppProvider project={project}>
        <div className={classes.root}>
          <AppHeader />

          <main id={MAIN_ELEMENT_ID} className={classes.content}>
            {children}
          </main>
        </div>
      </AppProvider>
    </ProjectStoreProvider>
  );
}
