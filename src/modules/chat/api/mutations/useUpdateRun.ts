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
import { RunUpdateBody, ThreadRun } from '@/app/api/threads-runs/types';
import { decodeEntityWithMetadata, encodeMetadata } from '@/app/api/utils';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThreadsQueries } from '..';

type Props = {
  onSuccess?: (data?: ThreadRun) => void;
};

export function useUpdateRun({ onSuccess }: Props = {}) {
  const queryClient = useQueryClient();
  const { project, organization } = useWorkspace();
  const threadsQueries = useThreadsQueries();

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
      const run = result && decodeEntityWithMetadata<ThreadRun>(result);

      return run;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(
          threadsQueries.runDetail(data.thread_id, data.id).queryKey,
          (run) =>
            run
              ? {
                  ...run,
                  metadata: encodeMetadata(data.uiMetadata),
                }
              : undefined,
        );

        queryClient.invalidateQueries({
          queryKey: threadsQueries.runDetail(data.thread_id, data.id),
        });
      }

      onSuccess?.(data);
    },
  });

  return mutation;
}
