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

import { listSpans, readTrace } from '@/app/observe/api';
import { useAppContext } from '@/layout/providers/AppProvider';
import { queryOptions } from '@tanstack/react-query';

export function useTracesQueries() {
  const { organization, project } = useAppContext();

  const tracesQueries = {
    all: () => ['traces'] as const,
    details: () => [...tracesQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...tracesQueries.details(), id],
        queryFn: () => readTrace(organization.id, project.id, id),
        meta: {
          errorToast: false,
        },
        retry: MAX_TRACE_RETRY_COUNT,
      }),
    spans: () => [...tracesQueries.all(), 'span'] as const,
    span: (id: string) =>
      queryOptions({
        queryKey: [...tracesQueries.spans(), id],
        queryFn: () => listSpans(organization.id, project.id, id),
        meta: {
          errorToast: false,
        },
      }),
  };

  return tracesQueries;
}

export const MAX_TRACE_RETRY_COUNT = 10;
