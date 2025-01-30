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

'use client';
import {
  VectorStoresListResponse,
  VectorStoreCreateResponse,
  VectorStoreDeleteResponse,
  VectorStoresListQueryOrderBy,
} from '@/app/api/vector-stores/types';
import { CardsList } from '@/components/CardsList/CardsList';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import {
  InfiniteData,
  keepPreviousData,
  useQueryClient,
} from '@tanstack/react-query';
import { produce, WritableDraft } from 'immer';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { ProjectHome } from '../projects/ProjectHome';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import { useVectorStoresQueries, VECTOR_STORES_DEFAULT_PAGE_SIZE } from './api';
import { useVectorStores } from './api/queries/useVectorStores';
import { CreateKnowledgeModal } from './create/CreateKnowledgeModal';
import { useUpdatePendingVectorStore } from './hooks/useUpdatePendingVectorStore';
import { KnowledgeCard } from './list/KnowledgeCard';

export function KnowledgeView() {
  const [search, setSearch] = useDebounceValue('', 200);
  const [order, setOrder] = useState<VectorStoresListQueryOrderBy>(
    VECTOR_STORES_ORDER_DEFAULT,
  );
  const { organization, isProjectReadOnly } = useAppContext();
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const vectorStoresQueries = useVectorStoresQueries();

  const params = {
    ...order,
    search: search.length ? search : undefined,
  };

  const {
    data,
    error,
    fetchNextPage,
    refetch,
    isPending,
    isFetchingNextPage,
    hasNextPage,
  } = useVectorStores({
    params,
    placeholderData: keepPreviousData,
  });

  useUpdatePendingVectorStore(data?.stores ?? [], params);

  const isLoading = isPending || isFetchingNextPage;

  return (
    <ProjectHome>
      <CardsList<VectorStoresListQueryOrderBy>
        heading="Knowledge"
        noItemsInfo="You haven't created any knowledge bases yet."
        errorTitle="Failed to load knowledge bases"
        totalCount={data?.totalCount ?? 0}
        onFetchNextPage={fetchNextPage}
        isFetching={isLoading}
        orderByProps={{
          selected: order,
          orderByItems: ORDER_OPTIONS,
          onChangeOrder: setOrder,
        }}
        error={error}
        onRefetch={refetch}
        hasNextPage={hasNextPage}
        onSearchChange={setSearch}
        newButtonProps={{
          title: 'Create a knowledge base',
          onClick: () =>
            openModal((props) => <CreateKnowledgeModal {...props} />),
          disabled: isProjectReadOnly,
          tooltipContent: isProjectReadOnly ? (
            <ReadOnlyTooltipContent
              organization={organization}
              entityName="knowledge base"
            />
          ) : undefined,
        }}
      >
        {data?.stores.map((item) => (
          <KnowledgeCard key={item.id} vectorStore={item} />
        ))}

        {isLoading
          ? Array.from({ length: VECTOR_STORES_DEFAULT_PAGE_SIZE }, (_, i) => (
              <KnowledgeCard.Skeleton key={i} />
            ))
          : undefined}
      </CardsList>
    </ProjectHome>
  );
}

type ListVectorStoresDataUpdater = (
  page: WritableDraft<VectorStoresListResponse>,
) => void;

export const VECTOR_STORES_ORDER_DEFAULT = {
  order: 'desc',
  order_by: 'created_at',
} as const;

const ORDER_OPTIONS = [
  { order: 'asc', order_by: 'name', label: 'A-Z' } as const,
  { order: 'desc', order_by: 'name', label: 'Z-A' } as const,
  { order: 'desc', order_by: 'created_at', label: 'Recently added' } as const,
  { order: 'asc', order_by: 'created_at', label: 'Oldest' } as const,
];
