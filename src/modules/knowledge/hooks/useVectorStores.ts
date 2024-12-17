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

import { VectorStoresListQuery } from '@/app/api/vector-stores/types';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { vectorStoresQuery } from '../queries';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function useVectorStores({
  params,
  placeholderData,
}: {
  params?: VectorStoresListQuery;
  placeholderData?: typeof keepPreviousData;
} = {}) {
  const { project, organization } = useProjectContext();

  const query = useInfiniteQuery({
    ...vectorStoresQuery(organization.id, project.id, params),
    placeholderData,
  });

  return query;
}
