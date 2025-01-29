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

import { useQuery } from '@tanstack/react-query';
import { useThreadsQueries } from '..';

interface Props {
  threadId: string | undefined;
  runId: string | undefined;
  enabled?: boolean;
}

export function useRun({ threadId, runId, enabled = true }: Props) {
  const threadsQueries = useThreadsQueries();

  const query = useQuery({
    ...threadsQueries.runDetail(threadId!, runId!),
    enabled: Boolean(threadId && runId) && enabled,
  });

  return query;
}
