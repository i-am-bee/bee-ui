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

import { readAssistant } from '@/app/api/assistants';
import { queryOptions } from '@tanstack/react-query';
import { Assistant } from './types';
import { decodeEntityWithMetadata } from '@/app/api/utils';

export const readAssistantQuery = (
  organizationId: string,
  projectId: string,
  id: string,
) =>
  queryOptions({
    queryKey: ['assistant', organizationId, projectId, id],
    queryFn: () => readAssistant(organizationId, projectId, id),
    select: (data) => (data ? decodeEntityWithMetadata<Assistant>(data) : null),
    staleTime: 10 * 60 * 1000,
  });
