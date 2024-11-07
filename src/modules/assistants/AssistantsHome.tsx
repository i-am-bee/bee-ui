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
import { useDebounceValue } from 'usehooks-ts';
import { useState } from 'react';
import { AssistantModalRenderer } from '../assistants/builder/AssistantModalRenderer';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  assistantsQuery,
  lastAssistantsQuery,
} from '../assistants/library/queries';
import { AssistantsList } from '../assistants/library/AssistantsList';
import { Assistant } from '../assistants/types';
import {
  AssistantResult,
  AssistantsListQueryOrderBy,
  ListAssistantsResponse,
} from '@/app/api/assistants/types';
import { produce } from 'immer';
import { CardsList } from '@/components/CardsList/CardsList';
import { HomeSection, ProjectHome } from '../projects/ProjectHome';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export function AssistantsHome() {
  const { project, isProjectReadOnly } = useAppContext();
  const [builderOpened, setBuilderOpened] = useState(false);
  const [order, setOrder] = useState<AssistantsListQueryOrderBy>(ORDER_DEFAULT);
  const [search, setSearch] = useDebounceValue('', 200);

  const queryClient = useQueryClient();

  const params = {
    search,
    ...order,
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
  } = useInfiniteQuery({
    ...assistantsQuery(project.id, params),
  });

  const handleInvalidateData = () => {
    // invalidate all queries on GET:/assistants
    queryClient.invalidateQueries({
      queryKey: [assistantsQuery(project.id).queryKey.at(0)],
    });
    queryClient.invalidateQueries({
      queryKey: lastAssistantsQuery(project.id).queryKey,
    });
  };

  const handleSaveAssistantSuccess = (
    assistant: AssistantResult,
    isNew: boolean,
  ) => {
    queryClient.setQueryData<InfiniteData<ListAssistantsResponse>>(
      assistantsQuery(project.id, params).queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        if (isNew) {
          const firstPage = draft.pages.at(0);
          if (firstPage) firstPage.data.unshift(assistant);
        }
        // TODO: handle update
      }),
    );
    handleInvalidateData();

    setBuilderOpened(false);
  };

  const handleDeleteAssistantSuccess = (assistant: Assistant) => {
    queryClient.setQueryData<InfiniteData<ListAssistantsResponse>>(
      assistantsQuery(project.id, params).queryKey,
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
    handleInvalidateData();
  };

  return (
    <>
      <ProjectHome section={HomeSection.Bees}>
        <CardsList<AssistantsListQueryOrderBy>
          heading="Bees"
          totalCount={data?.totalCount ?? 0}
          onFetchNextPage={fetchNextPage}
          isFetching={isFetching}
          error={error}
          noItemsText="You haven’t created any bees yet."
          noItemsDescr="Get started by exploring the library of available bees to
                jump-start your productivity, or build your own bee fitted
                specifically for your needs and use cases!"
          errorTitle="Failed to load bees"
          onRefetch={refetch}
          hasNextPage={hasNextPage}
          onSearchChange={setSearch}
          orderByProps={{
            selected: order,
            orderByItems: ORDER_OPTIONS,
            onChangeOrder: setOrder,
          }}
          newButtonProps={{
            title: 'New bee',
            onClick: () => setBuilderOpened(true),
            disabled: isProjectReadOnly,
            tooltipContent: isProjectReadOnly ? (
              <ReadOnlyTooltipContent entityName="bee" />
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

      <AssistantModalRenderer
        isOpened={builderOpened}
        onModalClose={() => setBuilderOpened(false)}
        onSaveSuccess={handleSaveAssistantSuccess}
      />

      <OnboardingModal assistants={data?.assistants} isOpen />
    </>
  );
}

const ORDER_DEFAULT = {
  order: 'asc',
  order_by: 'name',
} as const;

const ORDER_OPTIONS = [
  { order: 'asc', order_by: 'name', label: 'A-Z' } as const,
  { order: 'desc', order_by: 'name', label: 'Z-A' } as const,
  { order: 'desc', order_by: 'created_at', label: 'Recently added' } as const,
  { order: 'asc', order_by: 'created_at', label: 'Oldest' } as const,
];
