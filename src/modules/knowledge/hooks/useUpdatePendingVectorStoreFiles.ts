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
  VectorStoreFileResponse,
  VectorStoreFilesListQuery,
  VectorStoreFilesListResponse,
} from '@/app/api/vector-stores-files/types';
import { VectorStoreResponse } from '@/app/api/vector-stores/types';
import { useGetLinearIncreaseDuration } from '@/hooks/useGetLinearIncreaseDuration';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InfiniteData,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useEffect } from 'react';
import { useVectorStoresQueries } from '../api';

export const useUpdatePendingVectorStoreFiles = (
  vectorStore: VectorStoreResponse,
  data: VectorStoreFileResponse[],
  params: VectorStoreFilesListQuery,
) => {
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();
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
      .filter((file) => file.status === 'in_progress')
      .map((file) => {
        return {
          ...vectorStoresQueries.fileDetail(vectorStore.id, file.id),
          refetchInterval: getDuration,
        };
      }),
  });

  useEffect(() => {
    let isSomeUpdated = false;
    queries.forEach(({ data: vectoreStoreFile }) => {
      const vectoreStoreFileOld = data.find(
        (item) => item.id === vectoreStoreFile?.id,
      );
      if (
        vectoreStoreFile &&
        (vectoreStoreFile.status !== vectoreStoreFileOld?.status ||
          vectoreStoreFile.status !== 'in_progress')
      ) {
        isSomeUpdated = true;

        queryClient.setQueryData<InfiniteData<VectorStoreFilesListResponse>>(
          vectorStoresQueries.filesList(vectorStore.id, params).queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              const index =
                page?.data.findIndex(({ id }) => id === vectoreStoreFile.id) ??
                -1;

              if (index >= 0) {
                page?.data.splice(index, 1, vectoreStoreFile);
              }
            }
          }),
        );
      }
    });

    if (isSomeUpdated) {
      queryClient.invalidateQueries({
        queryKey: vectorStoresQueries.filesLists(vectorStore.id),
      });
    }
  }, [
    data,
    params,
    organization.id,
    project.id,
    queries,
    queryClient,
    vectorStore.id,
    vectorStoresQueries,
  ]);
};
