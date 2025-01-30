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
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useThreadsQueries } from '..';
import {
  MessageMetadata,
  MessageWithFiles,
  MessageWithFilesResponse,
} from '../../types';
import { isNotNull } from '@/utils/helpers';

interface Props {
  threadId: string | undefined;
  params?: MessagesListQuery;
  initialData?: MessageWithFilesResponse;
}

export function useListMessagesWithFiles({
  threadId,
  params,
  initialData,
}: Props) {
  const threadsQueries = useThreadsQueries();

  const query = useInfiniteQuery({
    ...threadsQueries.messagesWithFilesList(threadId!, {
      ...MESSAGES_DEFAULT_PARAMS,
      ...params,
    }),
    select: (data) =>
      data.pages
        .flatMap((page) => page?.data)
        .filter(isNotNull)
        .filter(
          ({ metadata }) =>
            !['code-update', 'error-report'].includes(
              decodeMetadata<MessageMetadata>(metadata).type ?? '',
            ),
        ),
    enabled: Boolean(threadId),
    initialData: { pages: [initialData], pageParams: [undefined] },
  });

  return query;
}

export const MESSAGES_DEFAULT_PAGE_SIZE = 2;
export const MESSAGES_DEFAULT_PARAMS: MessagesListQuery = {
  limit: MESSAGES_DEFAULT_PAGE_SIZE,
  order: 'desc',
  order_by: 'created_at',
};
