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

import {
  ListVectorStoresResponse,
  VectorStore,
  VectorStoresListQuery,
} from '@/app/api/vector-stores/types';
import { useGetLinearIncreaseDuration } from '@/hooks/useGetLinearIncreaseDuration';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InfiniteData,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useEffect } from 'react';
import { useVectorStoresQueries } from '../queries';

export const useUpdatePendingVectorStore = (
  data: VectorStore[],
  params: VectorStoresListQuery,
) => {
  const queryClient = useQueryClient();
  const { project, organization } = useAppContext();
  const vectorStoresQueries = useVectorStoresQueries();

  const { onResetDuration, getDuration } = useGetLinearIncreaseDuration({
    durationStart: 1000,
    increaseStep: 200,
    countWithoutIncrease: 10,
  });

  useEffect(() => {
    onResetDuration();
  }, [data, onResetDuration]);

  const queries = useQueries({
    queries: data
      .filter((store) => store.status === 'in_progress')
      .map((store) => {
        return {
          ...vectorStoresQueries.detail(store.id),
          refetchOnWindowFocus: true,
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchInterval: getDuration,
          refetchIntervalInBackground: true,
        };
      }),
  });

  useEffect(() => {
    let isSomeUpdated = false;
    queries.forEach(({ data: vectoreStore }) => {
      const vectoreStoreOld = data.find((item) => item.id === vectoreStore?.id);
      if (vectoreStore && vectoreStore.status !== vectoreStoreOld?.status) {
        isSomeUpdated = true;

        queryClient.setQueryData<InfiniteData<ListVectorStoresResponse>>(
          vectorStoresQueries.list(params).queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              const index = page?.data.findIndex(
                (item) => item.id === vectoreStore.id,
              );

              if (index) {
                page?.data.splice(index, 1, vectoreStore);
              }
            }
          }),
        );
      }
    });

    if (isSomeUpdated) {
      queryClient.invalidateQueries({ queryKey: vectorStoresQueries.lists() });
    }
  }, [
    data,
    params,
    organization.id,
    project.id,
    queries,
    queryClient,
    vectorStoresQueries,
  ]);
};
