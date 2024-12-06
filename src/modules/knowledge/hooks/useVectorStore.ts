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

import { VectorStore } from '@/app/api/vector-stores/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useQuery } from '@tanstack/react-query';
import { readVectorStoreQuery } from '../queries';

export function useVectorStore(
  id: string | undefined,
  {
    enabled = true,
    initialData,
  }: {
    enabled?: boolean;
    initialData?: VectorStore;
  } = {},
) {
  const { project, organization } = useAppContext();

  const query = useQuery({
    ...readVectorStoreQuery(organization.id, project.id, id ?? ''),
    enabled: Boolean(id) && enabled,
    initialData,
  });

  return query;
}
