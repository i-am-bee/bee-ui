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
import { ensureSession } from '@/app/auth/rsc';
import { KnowledgeDetail } from '@/modules/knowledge/detail/KnowledgeDetail';
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
  const session = await ensureSession();
  if (!session) {
    throw new Error('Session not found.');
  }
  const vectorStore = await fetchVectorStore(
    session.userProfile.default_organization,
    projectId,
    knowledgeId,
  );

  if (!vectorStore) notFound();

  return <KnowledgeDetail vectorStore={vectorStore} />;
}
