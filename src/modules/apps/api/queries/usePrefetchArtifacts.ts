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

import { ArtifactsListQuery } from '@/app/api/artifacts/types';
import { useQueryClient } from '@tanstack/react-query';
import { useArtifactsQueries } from '..';
import { ARTIFACTS_ORDER_DEFAULT } from '../../AppsHome';

const DEFAULT_PARAMS: Partial<ArtifactsListQuery> = {
  ...ARTIFACTS_ORDER_DEFAULT,
};

export function usePrefetchArtifacts({
  useDefaultParams,
}: {
  useDefaultParams?: boolean;
}) {
  const queryClient = useQueryClient();
  const artifactsQueries = useArtifactsQueries();

  return (params?: ArtifactsListQuery) =>
    queryClient.prefetchInfiniteQuery(
      artifactsQueries.list({
        ...(useDefaultParams ? DEFAULT_PARAMS : {}),
        ...params,
      }),
    );
}
