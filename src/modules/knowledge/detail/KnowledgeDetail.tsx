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
import { VectorStore } from '@/app/api/vector-stores/types';
import { useModal } from '@/layout/providers/ModalProvider';
import {
  InfiniteData,
  keepPreviousData,
  useQueryClient,
} from '@tanstack/react-query';
// import { useDebounceValue } from 'usehooks-ts';
import {
  ListVectorStoreFilesResponse,
  VectorStoreFile,
  VectorStoreFilesDeleteResponse,
} from '@/app/api/vector-stores-files/types';
import { CardsList } from '@/components/CardsList/CardsList';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ProjectHome } from '@/modules/projects/ProjectHome';
import { ReadOnlyTooltipContent } from '@/modules/projects/ReadOnlyTooltipContent';
import { useRoutes } from '@/routes';
import { IconButton } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import { produce } from 'immer';
import {
  VECTOR_STORES_DEFAULT_PAGE_SIZE,
  useVectorStoresQueries,
} from '../api';
import { useVectorStore } from '../api/queries/useVectorStore';
import { useVectorStoreFiles } from '../api/queries/useVectorStoreFiles';
import { useUpdatePendingVectorStoreFiles } from '../hooks/useUpdatePendingVectorStoreFiles';
import { KnowledgeItemsInfo } from '../list/KnowledgeCard';
import { AddContentModal } from './AddContentModal';
import { KnowledgeAppsInfo } from './KnowledgeAppsInfo';
import classes from './KnowledgeDetail.module.scss';
import { KnowledgeFileCard } from './KnowledgeFileCard';

interface Props {
  vectorStore: VectorStore;
}

export function KnowledgeDetail({ vectorStore: vectorStoreProps }: Props) {
  // const [search, setSearch] = useDebounceValue('', 200);
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const { organization, isProjectReadOnly } = useAppContext();
  const { routes, navigate } = useRoutes();
  const vectorStoresQueries = useVectorStoresQueries();

  const params = {
    // search, TODO: api not ready
  };

  const { data: vectorStoreFetched } = useVectorStore({
    id: vectorStoreProps.id,
    initialData: vectorStoreProps,
  });

  const vectorStore = vectorStoreFetched ?? vectorStoreProps;

  const {
    data,
    error,
    fetchNextPage,
    refetch,
    isPending,
    isFetchingNextPage,
    hasNextPage,
  } = useVectorStoreFiles({
    storeId: vectorStore.id,
    params,
    placeholderData: keepPreviousData,
  });

  useUpdatePendingVectorStoreFiles(vectorStore, data?.files ?? [], params);

  const onDeleteSuccess = (file?: VectorStoreFilesDeleteResponse) => {
    if (file) {
      queryClient.setQueryData<InfiniteData<ListVectorStoreFilesResponse>>(
        vectorStoresQueries.filesList(vectorStore.id, params).queryKey,
        produce((draft) => {
          if (!draft?.pages) return null;
          for (const page of draft.pages) {
            if (!page) continue;
            const index = page?.data.findIndex((item) => item.id === file.id);
            if (index >= 0) {
              page.data.splice(index, 1);
            }
          }
        }),
      );

      queryClient.invalidateQueries(vectorStoresQueries.detail(vectorStore.id));
    }
  };

  const onCreateSuccess = (vectorStoreFile?: VectorStoreFile) => {
    if (vectorStoreFile)
      queryClient.setQueryData<InfiniteData<ListVectorStoreFilesResponse>>(
        vectorStoresQueries.filesList(vectorStore.id, params).queryKey,
        produce((draft) => {
          if (
            !draft?.pages ||
            draft?.pages.some((page) =>
              page?.data.some((item) => item.id === vectorStoreFile.id),
            )
          )
            return null;
          const page = draft.pages.at(0);
          if (page) page.data.unshift(vectorStoreFile);
        }),
      );

    queryClient.invalidateQueries(vectorStoresQueries.detail(vectorStore.id));
  };

  const remainsToFetchCount =
    (data?.totalCount ?? vectorStore.file_counts.total) -
    (data?.files.length ?? 0);

  const isLoading = isPending || isFetchingNextPage;

  return (
    <ProjectHome>
      <div className={classes.root}>
        <div className={classes.header}>
          <IconButton
            kind="tertiary"
            label="Back to Knowledge bases"
            onClick={() => navigate(routes.vectorStores())}
          >
            <ArrowLeft />
          </IconButton>

          <div className={classes.headerContent}>
            <h2>{vectorStore.name}</h2>
            <KnowledgeItemsInfo vectorStore={vectorStore} />
          </div>

          <KnowledgeAppsInfo vectorStore={vectorStore} />
        </div>

        <CardsList
          totalCount={data?.totalCount ?? 0}
          onFetchNextPage={fetchNextPage}
          isFetching={isLoading}
          error={error}
          noItemsInfo="No files in this knowledge base."
          errorTitle="Failed to load knowledge base files"
          onRefetch={refetch}
          hasNextPage={hasNextPage}
          newButtonProps={{
            title: 'Add content',
            onClick: () =>
              openModal((props) => (
                <AddContentModal
                  {...props}
                  vectorStore={vectorStore}
                  onCreateSuccess={onCreateSuccess}
                />
              )),
            disabled: isProjectReadOnly,
            tooltipContent: isProjectReadOnly ? (
              <ReadOnlyTooltipContent
                organization={organization}
                entityName="knowledge base"
              />
            ) : undefined,
          }}
        >
          {data?.files.map((item) => (
            <KnowledgeFileCard
              key={item.id}
              vectorStore={vectorStore}
              vectorStoreFile={item}
              onDeleteSuccess={onDeleteSuccess}
            />
          ))}

          {isLoading
            ? Array.from(
                {
                  length:
                    remainsToFetchCount < VECTOR_STORES_DEFAULT_PAGE_SIZE
                      ? remainsToFetchCount
                      : VECTOR_STORES_DEFAULT_PAGE_SIZE,
                },
                (_, i) => <KnowledgeFileCard.Skeleton key={i} />,
              )
            : undefined}
        </CardsList>
      </div>
    </ProjectHome>
  );
}
