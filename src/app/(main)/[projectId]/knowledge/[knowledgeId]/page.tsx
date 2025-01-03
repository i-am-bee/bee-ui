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

import { fetchVectorStore } from '@/app/api/rsc';
import { ensureDefaultOrganizationId } from '@/app/auth/rsc';
import { KnowledgeDetail } from '@/modules/knowledge/detail/KnowledgeDetail';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
    knowledgeId?: string;
  };
}

export default async function KnowledgeDetailPage({
  params: { projectId, knowledgeId },
}: Props) {
  const organizationId = await ensureDefaultOrganizationId();

  const vectorStore = await fetchVectorStore(
    organizationId,
    projectId,
    knowledgeId,
  );

  if (!vectorStore) notFound();

  return (
    <LayoutInitializer layout={{ navbarProps: { type: 'common' } }}>
      <KnowledgeDetail vectorStore={vectorStore} />
    </LayoutInitializer>
  );
}
