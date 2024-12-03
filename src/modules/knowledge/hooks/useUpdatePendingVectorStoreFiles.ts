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

import { VectorStore } from '@/app/api/vector-stores/types';
import {
  InfiniteData,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { readVectorStoreFileQuery, vectorStoresFilesQuery } from '../queries';
import { produce } from 'immer';
import {
  ListVectorStoreFilesResponse,
  VectorStoreFile,
  VectorStoreFilesListQuery,
} from '@/app/api/vector-stores-files/types';
import { useGetLinearIncreaseDuration } from '@/hooks/useGetLinearIncreaseDuration';
import { useAppContext } from '@/layout/providers/AppProvider';

export const useUpdatePendingVectorStoreFiles = (
  vectorStore: VectorStore,
  data: VectorStoreFile[],
  params: VectorStoreFilesListQuery,
) => {
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();

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
          ...readVectorStoreFileQuery(
            organization.id,
            project.id,
            vectorStore.id,
            file.id,
          ),
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

        queryClient.setQueryData<InfiniteData<ListVectorStoreFilesResponse>>(
          vectorStoresFilesQuery(
            organization.id,
            project.id,
            vectorStore.id,
            params,
          ).queryKey,
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
        queryKey: [
          vectorStoresFilesQuery(
            organization.id,
            project.id,
            vectorStore.id,
          ).queryKey.at(0),
        ],
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
  ]);
};
