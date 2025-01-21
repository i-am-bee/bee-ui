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

import { listVectorStores, readVectorStore } from '@/app/api/vector-stores';
import {
  listVectorStoreFiles,
  readVectorStoreFile,
} from '@/app/api/vector-stores-files';
import { VectorStoreFilesListQuery } from '@/app/api/vector-stores-files/types';
import { VectorStoresListQuery } from '@/app/api/vector-stores/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export function useVectorStoresQueries() {
  const { organization, project } = useAppContext();

  const vectorStoresQueries = {
    all: () => [project.id, 'vector-stores'] as const,
    lists: () => [...vectorStoresQueries.all(), 'list'] as const,
    list: (params?: VectorStoresListQuery) => {
      const usedParams: VectorStoresListQuery = {
        show_dependent: false,
        limit: VECTOR_STORES_DEFAULT_PAGE_SIZE,
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...vectorStoresQueries.lists(), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listVectorStores(organization.id, project.id, {
            ...usedParams,
            after: pageParam,
          }),
        initialPageParam: undefined,
        getNextPageParam(lastPage) {
          return lastPage?.has_more && lastPage?.last_id
            ? lastPage.last_id
            : undefined;
        },
        select(data) {
          const stores = data.pages
            .flatMap((page) => page?.data)
            .filter(isNotNull);
          return {
            stores,
            totalCount: data.pages.at(0)?.total_count,
          };
        },
        meta: {
          errorToast: false,
        },
      });
    },
    details: () => [...vectorStoresQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...vectorStoresQueries.details(), id],
        queryFn: () => readVectorStore(organization.id, project.id, id),
        meta: {
          errorToast: false,
        },
      }),
    filesLists: (storeId: string) =>
      [...vectorStoresQueries.detail(storeId).queryKey, 'files-list'] as const,
    filesList: (storeId: string, params?: VectorStoreFilesListQuery) => {
      const usedParams: VectorStoreFilesListQuery = {
        limit: VECTOR_STORES_DEFAULT_PAGE_SIZE,
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...vectorStoresQueries.filesLists(storeId), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listVectorStoreFiles(organization.id, project.id, storeId, {
            ...usedParams,
            after: pageParam,
          }),
        initialPageParam: undefined,
        getNextPageParam(lastPage) {
          return lastPage?.has_more && lastPage?.last_id
            ? lastPage.last_id
            : undefined;
        },
        select(data) {
          const files = data.pages
            .flatMap((page) => page?.data)
            .filter(isNotNull);
          return {
            files,
            totalCount: data.pages.at(0)?.total_count,
          };
        },
        meta: {
          errorToast: false,
        },
      });
    },
    fileDetails: (storeId: string) =>
      [...vectorStoresQueries.detail(storeId).queryKey, 'file-detail'] as const,
    fileDetail: (storeId: string, fileId: string) =>
      queryOptions({
        queryKey: [...vectorStoresQueries.fileDetails(storeId), fileId],
        queryFn: () =>
          readVectorStoreFile(organization.id, project.id, storeId, fileId),
        meta: {
          errorToast: false,
        },
      }),
  };

  return vectorStoresQueries;
}

export const VECTOR_STORES_DEFAULT_PAGE_SIZE = 6;
