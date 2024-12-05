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
import { assistantsQuery } from '../assistants/library/queries';
import { Assistant } from '../assistants/types';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { ProjectHome } from '../projects/ProjectHome';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import {
  ArtifactsListQueryOrderBy,
  ListArtifactsResponse,
} from '@/app/api/artifacts/types';
import { useArtifacts } from './hooks/useArtifacts';
import { AppsList } from './library/AppsList';
import { Artifact } from './types';
import { AdminView } from '@/components/AdminView/AdminView';
import { listArtifactsQuery } from './queries';

export function AppsHome() {
  const { project, organization, isProjectReadOnly } = useAppContext();
  const [order, setOrder] = useState<ArtifactsListQueryOrderBy>(
    ARTIFACTS_ORDER_DEFAULT,
  );
  // const [search, setSearch] = useDebounceValue('', 200);
  const router = useRouter();

  const searchParams = useSearchParams();
  const showOnboarding =
    !isProjectReadOnly && searchParams?.has(ONBOARDING_PARAM);

  const queryClient = useQueryClient();

  const params = {
    ...order,
    // search: search.length ? search : undefined,
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
  } = useArtifacts({ params });

  const handleInvalidateData = () => {
    // invalidate all queries on GET:/assistants
    queryClient.invalidateQueries({
      queryKey: [assistantsQuery(organization.id, project.id).queryKey.at(0)],
    });
  };

  const handleDeleteArtifactSuccess = (artifact: Artifact) => {
    queryClient.setQueryData<InfiniteData<ListArtifactsResponse>>(
      listArtifactsQuery(organization.id, project.id, params).queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        for (const page of draft.pages) {
          const index = page.data.findIndex(({ id }) => id === artifact.id);
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
      <AdminView>
        <CardsList<ArtifactsListQueryOrderBy>
          heading="Apps"
          totalCount={data?.totalCount ?? 0}
          onFetchNextPage={fetchNextPage}
          isFetching={isFetching}
          error={error}
          noItemsText="Honey, this hive is empty."
          errorTitle="Failed to load apps"
          onRefetch={refetch}
          hasNextPage={hasNextPage}
          // onSearchChange={setSearch}
          orderByProps={{
            selected: order,
            orderByItems: ORDER_OPTIONS,
            onChangeOrder: setOrder,
          }}
          newButtonProps={{
            title: 'Create app',
            onClick: () => router.push(`/${project.id}/apps/builder`),
            disabled: isProjectReadOnly,
            tooltipContent: isProjectReadOnly ? (
              <ReadOnlyTooltipContent
                organization={organization}
                entityName="app"
              />
            ) : undefined,
          }}
        >
          <AppsList
            artifacts={data?.artifacts}
            isLoading={isPending || isFetchingNextPage}
            onDeleteSuccess={handleDeleteArtifactSuccess}
          />
        </CardsList>
      </AdminView>

      {showOnboarding && (
        <OnboardingModal onRequestClose={noop} onAfterClose={noop} isOpen />
      )}
    </>
  );
}

export const ARTIFACTS_ORDER_DEFAULT = {
  order: 'desc',
  order_by: 'created_at',
} as const;

const ORDER_OPTIONS = [
  { order: 'desc', order_by: 'created_at', label: 'Recently added' } as const,
  { order: 'asc', order_by: 'created_at', label: 'Oldest' } as const,
];
