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

import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { useGetLinearIncreaseDuration } from '@/hooks/useGetLinearIncreaseDuration';
import { isNotNull } from '@/utils/helpers';
import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useVectorStoresQueries } from '..';

export const useWatchPendingVectorStoreFiles = (
  vectorStoreId: string | null,
  data: VectorStoreFile[],
) => {
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
    queries: vectorStoreId
      ? data
          .filter((file) => file.status === 'in_progress')
          .map((file) => {
            return {
              ...vectorStoresQueries.fileDetail(vectorStoreId, file.id),
              refetchInterval: getDuration,
            };
          })
      : [],
  });

  return queries.map(({ data }) => data).filter(isNotNull);
};
