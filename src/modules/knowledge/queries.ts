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
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export const PAGE_SIZE = 6;

export const vectorStoresQuery = (
  projectId: string,
  params?: VectorStoresListQuery,
) => {
  const paramsWithoutDependant: VectorStoresListQuery = {
    ...params,
    show_dependent: false,
  };
  return infiniteQueryOptions({
    queryKey: ['vector-stores', projectId, paramsWithoutDependant],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listVectorStores(projectId, {
        ...paramsWithoutDependant,
        limit: params?.limit || PAGE_SIZE,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const stores = data.pages.flatMap((page) => page?.data).filter(isNotNull);
      return {
        stores,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });
};

export const vectorStoresFilesQuery = (
  projectId: string,
  storeId: string,
  params?: VectorStoreFilesListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['vector-stores-files', projectId, storeId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listVectorStoreFiles(projectId, storeId, {
        ...params,
        limit: params?.limit || PAGE_SIZE,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const files = data.pages.flatMap((page) => page?.data).filter(isNotNull);
      return {
        files,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });

export const readVectorStoreQuery = (projectId: string, id: string) =>
  queryOptions({
    queryKey: ['vector-store', projectId, id],
    queryFn: () => readVectorStore(projectId, id),
    meta: {
      errorToast: false,
    },
  });

export const readVectorStoreFileQuery = (
  projectId: string,
  storeId: string,
  fileId: string,
) =>
  queryOptions({
    queryKey: ['vector-store-file', projectId, storeId, fileId],
    queryFn: () => readVectorStoreFile(projectId, storeId, fileId),
    meta: {
      errorToast: false,
    },
  });
