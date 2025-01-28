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

import { fetchLinkPreview } from '@/app/api/link-preview';
import { queryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useLinkPreviewQueries() {
  const linkPreviewQueries = useMemo(
    () => ({
      all: () => ['link-preview'] as const,
      detail: (url: string) =>
        queryOptions({
          queryKey: [...linkPreviewQueries.all(), url],
          queryFn: () => fetchLinkPreview(url),
        }),
    }),
    [],
  );

  return linkPreviewQueries;
}
