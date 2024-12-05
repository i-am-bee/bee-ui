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

import { listSpans } from '@/app/observe/api';
import { queryOptions } from '@tanstack/react-query';

export const listSpansQuery = (
  organizationId: string,
  projectId: string,
  traceId: string,
) =>
  queryOptions({
    queryKey: ['observe:span', traceId],
    queryFn: () => listSpans(organizationId, projectId, traceId),
    meta: {
      errorToast: false,
    },
  });
