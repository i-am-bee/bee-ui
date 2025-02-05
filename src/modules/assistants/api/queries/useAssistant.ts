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

import { AssistantResponse } from '@/app/api/assistants/types';
import { QueryMetadata } from '@/layout/providers/QueryProvider';
import { QueryOptions, useQuery } from '@tanstack/react-query';
import { useAssistantsQueries } from '..';

interface Props {
  id: string | undefined;
  meta?: QueryMetadata;
  initialData?: AssistantResponse;
  enabled?: boolean;
  retry?: QueryOptions['retry'];
  throwOnError?: (error: Error) => boolean;
}

export function useAssistant({ id, enabled = true, ...props }: Props) {
  const assistantsQueries = useAssistantsQueries();

  const query = useQuery({
    ...assistantsQueries.detail(id!),
    enabled: Boolean(id) && enabled,
    ...props,
  });

  return query;
}
