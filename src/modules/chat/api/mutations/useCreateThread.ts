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

import { createThread } from '@/app/api/threads';
import { Thread, ThreadCreateBody } from '@/app/api/threads/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation } from '@tanstack/react-query';

export function useCreateThread() {
  const { project, organization } = useAppContext();

  const mutation = useMutation({
    mutationFn: async (body: ThreadCreateBody) => {
      const result = await createThread(organization.id, project.id, body);
      return {
        result,
        thread: result && decodeEntityWithMetadata<Thread>(result),
      };
    },
    meta: {
      errorToast: {
        title: 'Failed to create session',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
