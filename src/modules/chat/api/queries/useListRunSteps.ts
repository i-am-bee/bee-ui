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

import { RunStepsListQuery } from '@/app/api/threads-runs/types';
import { useQuery } from '@tanstack/react-query';
import { useThreadsQueries } from '..';

interface Props {
  threadId: string | undefined;
  runId: string | undefined;
  params?: RunStepsListQuery;
  enabled?: boolean;
}

export function useListRunSteps({
  threadId,
  runId,
  params,
  enabled = true,
}: Props) {
  const threadsQueries = useThreadsQueries();

  const query = useQuery({
    ...threadsQueries.runStepsList(threadId!, runId!, params),
    enabled: Boolean(threadId && runId) && enabled,
  });

  return query;
}
