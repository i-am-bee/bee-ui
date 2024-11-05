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

import { useCallback, useEffect, useState } from 'react';

export function usePagination() {
  const [pagination, setPagination] =
    useState<PaginationParams>(PAGINATION_DEFAULT);

  const onNextPage = useCallback(
    (lastItemId?: string) =>
      setPagination(({ page, after }) => ({
        page: after !== lastItemId ? page + 1 : page,
        after: lastItemId,
      })),
    [],
  );

  const onPreviousPage = useCallback(
    (fistItemId?: string) =>
      setPagination(({ page, before }) => ({
        page: page > 1 && before !== fistItemId ? page - 1 : page,
        before: fistItemId,
      })),
    [],
  );

  const reset = () => PAGINATION_DEFAULT;

  return { ...pagination, onNextPage, onPreviousPage, reset };
}

interface PaginationParams {
  page: number;
  after?: string;
  before?: string;
}

const PAGINATION_DEFAULT = { page: 1 };
