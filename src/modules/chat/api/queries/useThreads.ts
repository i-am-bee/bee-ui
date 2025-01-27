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

import { ThreadsListQuery } from '@/app/api/threads/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useThreadsQueries } from '..';

interface Props {
  params?: ThreadsListQuery;
  enabled?: boolean;
}

export function useThreads({ params, enabled = true }: Props = {}) {
  const threadsQueries = useThreadsQueries();

  const query = useInfiniteQuery({
    ...threadsQueries.list(params),
    enabled,
  });

  return query;
}
