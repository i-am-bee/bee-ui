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

import { MESSAGES_PAGE_SIZE } from '@/app/api/threads-messages';
import { Thread } from '@/app/api/threads/types';
import { useImmerWithGetter } from '@/hooks/useImmerWithGetter';
import { useQuery } from '@tanstack/react-query';
import { messagesWithFilesQuery } from '../queries';
import { MessageMetadata, MessageWithFiles } from '../types';
import { getMessagesFromThreadMessages } from '../utils';
import { decodeMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';

export function useMessages({
  thread,
  initialData,
}: {
  thread?: Thread | null;
  initialData?: MessageWithFiles[];
}) {
  const { project, organization } = useAppContext();

  const { data, refetch } = useQuery({
    ...messagesWithFilesQuery(organization.id, project.id, thread?.id || '', {
      limit: MESSAGES_PAGE_SIZE,
    }),
    select: (messages) =>
      messages.filter(
        ({ metadata }) =>
          !['code-update', 'error-report'].includes(
            decodeMetadata<MessageMetadata>(metadata).type ?? '',
          ),
      ),
    initialData,
    enabled: Boolean(thread),
  });

  return {
    messages: useImmerWithGetter(
      thread ? getMessagesFromThreadMessages(data ?? []) : [],
    ),
    refetch,
  };
}
