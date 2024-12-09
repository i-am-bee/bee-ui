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
import { AppBuilder } from '@/modules/apps/builder/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/builder/AppBuilderProvider';
import { AppDetail } from '@/modules/apps/detail/AppDetail';
import { Artifact } from '@/modules/apps/types';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';
import { getAppBuilderNavbarProps } from '../utils';
import { ensureDefaultOrganizationId } from '@/app/auth/rsc';

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
  const artifactResult = await fetchArtifact(
    organizationId,
    projectId,
    artifactId,
  );
  if (!artifactResult) notFound();

  const artifact = decodeEntityWithMetadata<Artifact>(artifactResult);

  return (
    <LayoutInitializer
      layout={{
        navbarProps: {
          type: 'app-detail',
          artifact,
          backButton: getAppBuilderNavbarProps(projectId).backButton,
        },
      }}
    >
      <AppDetail artifact={artifact} />
    </LayoutInitializer>
  );
}
