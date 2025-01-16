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

import { cancelRun } from '@/app/api/threads-runs';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation } from '@tanstack/react-query';

export function useCanceRun() {
  const { project, organization } = useAppContext();

  const mutation = useMutation({
    mutationFn: ({ threadId, runId }: CancelRunParams) =>
      cancelRun(organization.id, project.id, threadId, runId),
  });

  return mutation;
}

interface CancelRunParams {
  threadId: string;
  runId: string;
}
