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
import { ToolType } from '@/app/api/threads-runs/types';
import {
  Tool,
  ToolResult,
  ToolsListQuery,
  ToolsListResponse,
  ToosListQueryOrderBy,
} from '@/app/api/tools/types';
import { CardsList } from '@/components/CardsList/CardsList';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { AppProvider, useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import { useTools } from './hooks/useTools';
import { UserToolModal } from './manage/UserToolModal';
import { toolsQuery } from './queries';
import { ToolCard } from './ToolCard';

interface Props {
  type?: 'user' | 'public';
}

export function ToolsList({ type }: Props) {
  const appContext = useAppContext();
  const { project, organization, isProjectReadOnly, featureFlags } = appContext;
  const [order, setOrder] = useState<ToosListQueryOrderBy>(TOOLS_ORDER_DEFAULT);
  const { openModal } = useModal();
  const [search, setSearch] = useDebounceValue('', 200);

  const queryClient = useQueryClient();

  const publicTools = [
    'code_interpreter',
    'file_search',
    'system',
  ] as ToolType[];
  const userTools = ['user'] as ToolType[];

  const isUserOrAllTools = !type || type === 'user';

  const params: ToolsListQuery = {
    type:
      type === 'public'
        ? publicTools
        : type === 'user'
          ? userTools
          : [...userTools, ...publicTools],
    limit: TOOLS_PAGE_SIZE,
    ...order,
    search: search.length ? search : undefined,
  };

  const {
    data,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    isFetching,
    isPending,
    isFetchingNextPage,
  } = useTools({ params });

  const handleInvalidateData = () => {
    // invalidate all queries on GET:/tools
    queryClient.invalidateQueries({
      queryKey: [
        toolsQuery(
          organization.id,
          project.id,
          featureFlags.Knowledge,
        ).queryKey.at(0),
      ],
    });
  };

  const handleCreateSuccess = (tool: ToolResult) => {
    queryClient.setQueryData<InfiniteData<ToolsListResponse>>(
      toolsQuery(organization.id, project.id, featureFlags.Knowledge, params)
        .queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        const firstPage = draft.pages.at(0);
        if (firstPage) firstPage.data.unshift(tool);
      }),
    );
    handleInvalidateData();
  };

  const handleDeleteSuccess = (tool: Tool) => {
    queryClient.setQueryData<InfiniteData<ToolsListResponse>>(
      toolsQuery(organization.id, project.id, featureFlags.Knowledge, params)
        .queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        for (const page of draft.pages) {
          const index = page.data.findIndex(({ id }) => id === tool.id);
          if (index >= 0) {
            page.data.splice(index, 1);
          }
        }
      }),
    );
    handleInvalidateData();
  };

  return (
    <CardsList<ToosListQueryOrderBy>
      heading={isUserOrAllTools ? 'Tools' : undefined}
      totalCount={data?.totalCount ?? 0}
      onSearchChange={setSearch}
      onFetchNextPage={fetchNextPage}
      isFetching={isFetching}
      error={error}
      noItemsInfo="You haven’t created any tools yet."
      errorTitle="Failed to load tools"
      onRefetch={refetch}
      hasNextPage={hasNextPage}
      orderByProps={{
        selected: order,
        orderByItems: ORDER_OPTIONS,
        onChangeOrder: setOrder,
      }}
      newButtonProps={
        isUserOrAllTools
          ? {
              title: 'New tool',
              onClick: () =>
                openModal((props) => (
                  <AppProvider {...appContext}>
                    <UserToolModal
                      {...props}
                      onSaveSuccess={handleCreateSuccess}
                    />
                  </AppProvider>
                )),
              disabled: isProjectReadOnly,
              tooltipContent: isProjectReadOnly ? (
                <ReadOnlyTooltipContent
                  organization={organization}
                  entityName="tool"
                />
              ) : undefined,
            }
          : undefined
      }
    >
      {data?.tools?.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onDeleteSuccess={handleDeleteSuccess}
          onSaveSuccess={handleInvalidateData}
        />
      ))}

      {(isPending || isFetchingNextPage) &&
        Array.from({ length: TOOLS_PAGE_SIZE }, (_, i) => (
          <CardsListItem.Skeleton key={i} />
        ))}
    </CardsList>
  );
}

export const TOOLS_PAGE_SIZE = 6;
export const TOOLS_ORDER_DEFAULT = {
  order: 'asc',
  order_by: 'name',
} as const;

const ORDER_OPTIONS = [
  { order: 'asc', order_by: 'name', label: 'A-Z' } as const,
  { order: 'desc', order_by: 'name', label: 'Z-A' } as const,
  { order: 'desc', order_by: 'created_at', label: 'Recently added' } as const,
  { order: 'asc', order_by: 'created_at', label: 'Oldest' } as const,
];
