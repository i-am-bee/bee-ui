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

import { ListDataResponse } from '@/app/api/types';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useCallback } from 'react';

interface Props {
  isListInfiniteQuery?: boolean;
}

export function useUpdateDataOnMutation<T extends ListDataResponse = never>({
  isListInfiniteQuery = true,
}: Props = {}) {
  const queryClient = useQueryClient();

  const onItemUpdate = useCallback(
    ({
      data,
      detailQueryKey,
      listQueryKey,
      invalidateQueries = true,
    }: {
      data: T['data'][number];
      detailQueryKey?: readonly string[];
      listQueryKey?: readonly string[];
      invalidateQueries?: boolean;
    }) => {
      if (listQueryKey) {
        invalidateQueries &&
          queryClient.invalidateQueries({ queryKey: listQueryKey });

        if (isListInfiniteQuery) {
          queryClient.setQueriesData<InfiniteData<T>>(
            { queryKey: listQueryKey },
            produce((draft) => {
              if (!draft?.pages) return null;
              for (const page of draft.pages) {
                const index = page.data.findIndex(({ id }) => id === data.id);
                if (index >= 0) {
                  console.log('updating...', { page, data });

                  page.data.splice(index, 1, data);
                }
              }
            }),
          );
        } else {
          queryClient.setQueriesData(
            { queryKey: listQueryKey },
            produce((draft: T) => {
              const index = draft.data.findIndex(({ id }) => id === data.id);
              if (index >= 0) {
                draft.data.splice(index, 1, data);
              }
            }),
          );
        }
      }

      if (detailQueryKey) {
        invalidateQueries &&
          queryClient.invalidateQueries({ queryKey: detailQueryKey });
        queryClient.setQueryData<T['data'][number]>(
          detailQueryKey,
          (savedData) =>
            savedData
              ? {
                  ...savedData,
                  ...data,
                }
              : undefined,
        );
      }
    },
    [isListInfiniteQuery, queryClient],
  );

  const onItemDelete = useCallback(
    ({
      id: itemId,
      listQueryKey,
      invalidateQueries = true,
    }: {
      id: string;
      listQueryKey?: readonly string[];
      invalidateQueries?: boolean;
    }) => {
      if (listQueryKey) {
        invalidateQueries &&
          queryClient.invalidateQueries({ queryKey: listQueryKey });

        if (isListInfiniteQuery) {
          queryClient.setQueriesData<InfiniteData<T>>(
            { queryKey: listQueryKey },
            produce((draft) => {
              if (!draft?.pages) return null;
              for (const page of draft.pages) {
                const index = page.data.findIndex(({ id }) => id === itemId);
                if (index >= 0) {
                  page.data.splice(index, 1);
                }
              }
            }),
          );
        } else {
          queryClient.setQueriesData(
            { queryKey: listQueryKey },
            produce((draft: T) => {
              const index = draft.data.findIndex(({ id }) => id === itemId);
              if (index >= 0) {
                draft.data.splice(index, 1);
              }
            }),
          );
        }
      }
    },
    [isListInfiniteQuery, queryClient],
  );

  return { onItemUpdate, onItemDelete };
}
