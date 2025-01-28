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
  ArtifactsListQueryOrderBy,
  ListArtifactsResponse,
} from '@/app/api/artifacts/types';
import { AdminView } from '@/components/AdminView/AdminView';
import { CardsList } from '@/components/CardsList/CardsList';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ONBOARDING_PARAM } from '@/utils/constants';
import { noop } from '@/utils/helpers';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import Lottie from 'lottie-react';
import { useRouter } from 'next-nprogress-bar';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useFirstAssistant } from '../assistants/hooks/useFirstAssistatn';
import { GeneralOnboardingModal } from '../onboarding/general/GeneralOnboardingModal';
import { ReadOnlyTooltipContent } from '../projects/ReadOnlyTooltipContent';
import classes from './AppsHome.module.scss';
import blinkingBeeAnimation from './BlinkingBeeAnimation.json';
import { useArtifacts } from './hooks/useArtifacts';
import { AppsList } from './library/AppsList';
import { useArtifactsQueries } from './queries';
import { Artifact } from './types';

export function AppsHome() {
  const { project, organization, isProjectReadOnly } = useAppContext();
  const [order, setOrder] = useState<ArtifactsListQueryOrderBy>(
    ARTIFACTS_ORDER_DEFAULT,
  );
  const [search, setSearch] = useDebounceValue('', 200);
  const router = useRouter();

  const searchParams = useSearchParams();
  const showOnboarding =
    !isProjectReadOnly && searchParams?.has(ONBOARDING_PARAM);

  const queryClient = useQueryClient();
  const artifactsQueries = useArtifactsQueries();

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
  } = useArtifacts({ params });

  const { assistant: firstAssistant } = useFirstAssistant({
    enabled: !data?.artifacts.length,
  });

  const handleDeleteArtifactSuccess = (artifact: Artifact) => {
    queryClient.setQueryData<InfiniteData<ListArtifactsResponse>>(
      artifactsQueries.list(params).queryKey,
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
          noItemsInfo={
            <div className={classes.noItemsInfo}>
              <Lottie
                className={classes.noItemsAnimation}
                animationData={blinkingBeeAnimation}
                loop
              />
              <div className={classes.noItemsTitle}>
                Honey, this hive is empty.
              </div>
              <p>
                Create your first app, or if that‘s a buzzkill, chat with{' '}
                <Link
                  href={
                    firstAssistant
                      ? `/${project.id}/chat/${firstAssistant.id}`
                      : `/${project.id}/builder`
                  }
                >
                  Agent Bee
                </Link>
              </p>
            </div>
          }
          errorTitle="Failed to load apps"
          onRefetch={refetch}
          hasNextPage={hasNextPage}
          onSearchChange={setSearch}
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
        <GeneralOnboardingModal
          onRequestClose={noop}
          onAfterClose={noop}
          isOpen
        />
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
