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

import { ApiError } from '@/app/api/errors';
import { Thread } from '@/app/api/threads/types';
import { useAssistant } from '@/modules/assistants/api/queries/useAssistant';
import { getAssistantName } from '@/modules/assistants/utils';
import { useEffect, useState } from 'react';
import { useListRuns } from '../api/queries/useListRuns';
import { ThreadAssistant } from '../types';

export function useGetThreadAssistant(
  thread?: Thread | null,
  initialAssistant?: ThreadAssistant,
) {
  const { assistantId: threadAssistantId, assistantName } =
    thread?.uiMetadata ?? {};
  const [assistant, setAssistant] = useState<ThreadAssistant>(
    initialAssistant ?? {
      name: assistantName,
      data: null,
    },
  );

  useEffect(() => {
    if (thread === null) setAssistant({ data: null });
  }, [thread]);

  const { data: runs } = useListRuns({
    threadId: thread?.id,
    params: {
      limit: 1,
      order: 'desc',
      order_by: 'created_at',
    },
    enabled: !threadAssistantId,
  });

  const assistantId =
    initialAssistant?.data?.id ??
    threadAssistantId ??
    runs?.data.at(-1)?.assistant_id;

  const { data } = useAssistant({
    id: assistantId,
    enabled: !assistant.isDeleted,
    retry: false,
    meta: {
      errorToast: false,
    },
    throwOnError: (error) => {
      if (error instanceof ApiError && error.code === 'not_found') {
        if (!assistant.isDeleted)
          setAssistant((assistant) => ({ ...assistant, isDeleted: true }));
        return false;
      }

      return true;
    },
  });

  return { ...assistant, data: data ?? assistant.data };
}

export function getThreadAssistantName(assistant: ThreadAssistant) {
  const name = getAssistantName(assistant);
  return `${name}${assistant.isDeleted ? ' (deleted)' : ''}`;
}
