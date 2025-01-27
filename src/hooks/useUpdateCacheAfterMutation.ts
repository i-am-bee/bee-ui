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

import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useCallback } from 'react';

interface ListDataResponse {
  data: { id: string; [key: string]: unknown }[];
}

interface Props {
  listQueryKey: readonly string[];
}

export function useUpdateCacheAfterMutation<T extends ListDataResponse>({
  listQueryKey,
}: Props) {
  const queryClient = useQueryClient();

  const onItemUpdate = useCallback(
    ({
      data,
      detailQueryKey,
    }: {
      data: T['data'][number];
      detailQueryKey: readonly string[];
    }) => {
      queryClient.setQueryData<InfiniteData<T>>(
        listQueryKey,
        produce((draft) => {
          if (!draft?.pages) return null;
          for (const page of draft.pages) {
            const index = page.data.findIndex(({ id }) => id === data.id);
            if (index >= 0) {
              page.data.splice(index, 1);
            }
          }
        }),
      );

      if (detailQueryKey) {
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
    [listQueryKey, queryClient],
  );

  const onItemDelete = useCallback(
    (item: T['data'][number]) => {
      queryClient.setQueryData<InfiniteData<T>>(
        listQueryKey,
        produce((draft) => {
          if (!draft?.pages) return null;
          for (const page of draft.pages) {
            const index = page.data.findIndex(({ id }) => id === item.id);
            if (index >= 0) {
              page.data.splice(index, 1);
            }
          }
        }),
      );
    },
    [listQueryKey, queryClient],
  );

  return { onItemUpdate, onItemDelete };
}
