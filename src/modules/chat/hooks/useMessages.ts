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

import { Thread } from '@/app/api/threads/types';
import { useImmerWithGetter } from '@/hooks/useImmerWithGetter';
import { useListMessagesWithFiles } from '../api/queries/useListMessagesWithFiles';
import { MessageWithFilesResponse } from '../types';
import { getMessagesFromThreadMessages } from '../utils';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';

export function useMessages({
  thread,
  initialData,
}: {
  thread?: Thread | null;
  initialData?: MessageWithFilesResponse;
}) {
  const { data, ...queryRest } = useListMessagesWithFiles({
    threadId: thread?.id,
    initialData,
  });

  const { fetchNextPage, isFetching, hasNextPage } = queryRest;
  const { ref: fetchNextPageInViewAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching,
    hasNextPage,
  });

  return {
    messages: useImmerWithGetter(
      thread ? getMessagesFromThreadMessages(data ?? []) : [],
    ),
    queryControl: {
      ...queryRest,
      fetchNextPageInViewAnchorRef,
    },
  };
}
