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

import { listArtifacts, readArtifact } from '@/app/api/artifacts';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { Artifact } from './types';
import { ArtifactsListQuery } from '@/app/api/artifacts/types';
import { isNotNull } from '@/utils/helpers';

export const readArtifactQuery = (projectId: string, id: string) =>
  queryOptions({
    queryKey: ['artifact', projectId, id],
    queryFn: () => readArtifact(projectId, id),
    select: (data) => (data ? decodeEntityWithMetadata<Artifact>(data) : null),
    staleTime: 10 * 60 * 1000,
  });

export const listArtifactsQuery = (
  projectId: string,
  params?: ArtifactsListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['artifacts', projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listArtifacts(projectId, {
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
      const artifacts = data.pages
        .flatMap((page) => page?.data)
        .filter(isNotNull)
        .map((item) => decodeEntityWithMetadata<Artifact>(item));
      return {
        artifacts,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });

const PAGE_SIZE = 10;
