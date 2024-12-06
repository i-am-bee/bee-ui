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

import { Thread, ThreadMetadata } from '@/app/api/threads/types';
import { readAssistantQuery } from '@/modules/assistants/queries';
import { useQuery } from '@tanstack/react-query';
import { runsQuery } from '../queries';
import { ApiError } from '@/app/api/errors';
import { useEffect, useState } from 'react';
import { ThreadAssistant } from '../types';
import { useAppContext } from '@/layout/providers/AppProvider';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!;

export function useGetThreadAssistant(
  thread?: Thread | null,
  initialAssistant?: ThreadAssistant,
) {
  const { project, organization } = useAppContext();

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

  const { data: runs } = useQuery({
    ...runsQuery(organization.id, project.id, thread?.id ?? '', {
      limit: 1,
      order: 'desc',
      order_by: 'created_at',
    }),
    enabled: Boolean(thread && !threadAssistantId),
  });

  const assistantId =
    initialAssistant?.data?.id ??
    threadAssistantId ??
    runs?.data.at(-1)?.assistant_id;

  const { data } = useQuery({
    ...readAssistantQuery(organization.id, project.id, assistantId ?? ''),
    enabled: Boolean(assistantId && !assistant.isDeleted),
    retry: 0,
    meta: {
      errorToast: false,
    },
    throwOnError: (e) => {
      if (e instanceof ApiError && e.code === 'not_found') {
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
  const name = assistant.data?.name ?? assistant.name;
  return name ? `${name}${assistant.isDeleted ? ' (deleted)' : ''}` : APP_NAME;
}
