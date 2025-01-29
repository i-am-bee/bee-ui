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

import { MessagesListQuery } from '@/app/api/threads-messages/types';
import { decodeMetadata } from '@/app/api/utils';
import { useQuery } from '@tanstack/react-query';
import { useThreadsQueries } from '..';
import { MessageMetadata, MessageWithFiles } from '../../types';

interface Props {
  threadId: string | undefined;
  params?: MessagesListQuery;
  initialData?: MessageWithFiles[];
}

export function useListMessagesWithFiles({
  threadId,
  params,
  ...props
}: Props) {
  const threadsQueries = useThreadsQueries();

  const query = useQuery({
    ...threadsQueries.messagesWithFilesList(threadId!, params),
    select: (messages) =>
      messages.filter(
        ({ metadata }) =>
          !['code-update', 'error-report'].includes(
            decodeMetadata<MessageMetadata>(metadata).type ?? '',
          ),
      ),
    enabled: Boolean(threadId),
    ...props,
  });

  return query;
}
