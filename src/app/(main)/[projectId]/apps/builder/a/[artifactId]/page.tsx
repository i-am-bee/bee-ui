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

import { fetchArtifact } from '@/app/api/artifacts';
import {
  ensureAppBuilderAssistant,
  fetchThread,
  listMessagesWithFiles,
  MESSAGES_PAGE_SIZE,
} from '@/app/api/rsc';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { ensureDefaultOrganizationId, ensureSession } from '@/app/auth/rsc';
import { AppBuilder } from '@/modules/apps/builder/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/builder/AppBuilderProvider';
import { Artifact } from '@/modules/apps/types';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';
import { getAppBuilderNavbarProps } from '../../../utils';

interface Props {
  params: {
    projectId: string;
    artifactId: string;
  };
}

export default async function AppBuilderPage({
  params: { projectId, artifactId },
}: Props) {
  const organizationId = await ensureDefaultOrganizationId();

  const assistant = await ensureAppBuilderAssistant(organizationId, projectId);
  const artifactResult = await fetchArtifact(projectId, artifactId);

  const thread = artifactResult?.thread_id
    ? await fetchThread(organizationId, projectId, artifactResult?.thread_id)
    : null;

  if (!(assistant && thread && artifactResult)) notFound();

  const artifact = decodeEntityWithMetadata<Artifact>(artifactResult);

  const initialMessages = thread.id
    ? await listMessagesWithFiles(organizationId, projectId, thread.id, {
        limit: MESSAGES_PAGE_SIZE,
      })
    : [];

  return (
    <LayoutInitializer
      layout={{ navbarProps: getAppBuilderNavbarProps(projectId, artifact) }}
    >
      <AppBuilderProvider
        artifact={decodeEntityWithMetadata<Artifact>(artifact)}
      >
        <AppBuilder
          assistant={assistant}
          thread={thread}
          initialMessages={initialMessages}
        />
      </AppBuilderProvider>
    </LayoutInitializer>
  );
}
