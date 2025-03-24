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

import { updateRun } from '@/app/api/threads-runs';
import {
  Run,
  RunsListResponse,
  RunUpdateBody,
} from '@/app/api/threads-runs/types';
import {
  decodeEntityWithMetadata,
  encodeEntityWithMetadata,
} from '@/app/api/utils';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useThreadsQueries } from '..';

type Props = {
  onSuccess?: (data?: Run) => void;
};

export function useUpdateRun({ onSuccess }: Props = {}) {
  const { project, organization } = useWorkspace();
  const threadsQueries = useThreadsQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<RunsListResponse>();

  const mutation = useMutation({
    mutationFn: async ({
      threadId,
      runId,
      body,
    }: {
      threadId: string;
      runId: string;
      body: RunUpdateBody;
    }) => {
      const result = await updateRun(
        organization.id,
        project.id,
        threadId,
        runId,
        body,
      );

      const run = result && decodeEntityWithMetadata<Run>(result);

      return run;
    },
    onSuccess: (data, { threadId, runId }) => {
      onItemUpdate({
        data: data && encodeEntityWithMetadata<Run>(data),
        listQueryKey: threadsQueries.runsLists(threadId),
        detailQueryKey: threadsQueries.runDetail(threadId, runId).queryKey,
      });

      const run = data && decodeEntityWithMetadata<Run>(data);
      onSuccess?.(run);
    },
  });

  return mutation;
}
