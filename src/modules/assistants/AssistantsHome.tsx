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
  AssistantsListQueryOrderBy,
  ListAssistantsResponse,
} from '@/app/api/assistants/types';
import { CardsList } from '@/components/CardsList/CardsList';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ONBOARDING_PARAM } from '@/utils/constants';
import { noop } from '@/utils/helpers';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useRouter } from 'next-nprogress-bar';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { AssistantsList } from '../assistants/library/AssistantsList';
import { Assistant } from '../assistants/types';
import { NewAgentModal } from '../onboarding/NewAgentModal';
import { ProjectHome } from '../projects/ProjectHome';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import { useAssistantsQueries } from './api';
import { useAssistants } from './api/queries/useAssistants';

export function AssistantsHome() {
  const { project, organization, isProjectReadOnly } = useAppContext();
  const [order, setOrder] = useState<AssistantsListQueryOrderBy>(
    ASSISTANTS_ORDER_DEFAULT,
  );
  const [search, setSearch] = useDebounceValue('', 200);
  const router = useRouter();

  const searchParams = useSearchParams();
  const showOnboarding =
    !isProjectReadOnly && searchParams?.has(ONBOARDING_PARAM);

  const queryClient = useQueryClient();
  const assistantsQueries = useAssistantsQueries();

  const params = {
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
  } = useAssistants({ params });

  const handleDeleteAssistantSuccess = (assistant: Assistant) => {
    queryClient.setQueryData<InfiniteData<ListAssistantsResponse>>(
      assistantsQueries.list(params).queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        for (const page of draft.pages) {
          const index = page.data.findIndex((item) => item.id === assistant.id);
          if (index >= 0) {
            page.data.splice(index, 1);
          }
        }
      }),
    );
  };

  return (
    <>
      <ProjectHome>
        <CardsList<AssistantsListQueryOrderBy>
          heading="Agents"
          totalCount={data?.totalCount ?? 0}
          onFetchNextPage={fetchNextPage}
          isFetching={isFetching}
          error={error}
          noItemsInfo="You haven’t created any agents yet."
          noItemsDescr="Get started by exploring the library of available agents to
                jump-start your productivity, or build your own agent fitted
                specifically for your needs and use cases!"
          errorTitle="Failed to load agents"
          onRefetch={refetch}
          hasNextPage={hasNextPage}
          onSearchChange={setSearch}
          orderByProps={{
            selected: order,
            orderByItems: ORDER_OPTIONS,
            onChangeOrder: setOrder,
          }}
          newButtonProps={{
            title: 'New agent',
            onClick: () => router.push(`/${project.id}/builder`),
            disabled: isProjectReadOnly,
            tooltipContent: isProjectReadOnly ? (
              <ReadOnlyTooltipContent
                organization={organization}
                entityName="agent"
              />
            ) : undefined,
          }}
        >
          <AssistantsList
            assistants={data?.assistants}
            isLoading={isPending || isFetchingNextPage}
            onDeleteSuccess={handleDeleteAssistantSuccess}
          />
        </CardsList>
      </ProjectHome>

      {showOnboarding && (
        <NewAgentModal
          isOnboarding
          onRequestClose={noop}
          onAfterClose={noop}
          isOpen
        />
      )}
    </>
  );
}

export const ASSISTANTS_ORDER_DEFAULT = {
  order: 'asc',
  order_by: 'name',
} as const;

const ORDER_OPTIONS = [
  { order: 'asc', order_by: 'name', label: 'A-Z' } as const,
  { order: 'desc', order_by: 'name', label: 'Z-A' } as const,
  { order: 'desc', order_by: 'created_at', label: 'Recently added' } as const,
  { order: 'asc', order_by: 'created_at', label: 'Oldest' } as const,
];
