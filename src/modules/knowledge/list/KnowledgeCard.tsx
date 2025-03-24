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

import { VectorStoreResponse } from '@/app/api/vector-stores/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useRoutes } from '@/routes/useRoutes';
import { InlineLoading } from '@carbon/react';
import { Folder, WarningAlt } from '@carbon/react/icons';
import pluralize from 'pluralize';
import { useDeleteVectorStore } from '../api/mutations/useDeleteVectorStore';
import { KnowledgeAppsInfo } from '../detail/KnowledgeAppsInfo';
import classes from './KnowledgeCard.module.scss';
import { RenameModal } from './RenameModal';

interface Props {
  vectorStore: VectorStoreResponse;
}

export function KnowledgeCard({ vectorStore }: Props) {
  const { openModal } = useModal();
  const { project, organization, isProjectReadOnly } = useAppContext();
  const { routes, navigate } = useRoutes();

  const {
    mutateAsyncWithConfirmation: deleteStore,
    isPending: isDeletePending,
  } = useDeleteVectorStore();

  return (
    <CardsListItem
      title={vectorStore.name}
      className={classes.card}
      icon={
        <span className={classes.icon}>
          <Folder size="20" />
        </span>
      }
      onClick={() =>
        navigate(routes.vectorStore({ vectorStoreId: vectorStore.id }))
      }
      actions={
        !isProjectReadOnly
          ? [
              {
                itemText: 'Rename',
                onClick: () =>
                  openModal((props) => (
                    <RenameModal
                      organization={organization}
                      project={project}
                      vectorStore={vectorStore}
                      {...props}
                    />
                  )),
              },
              {
                isDelete: true,
                itemText: 'Delete',
                onClick: () => deleteStore(vectorStore),
              },
            ]
          : undefined
      }
      isDeletePending={isDeletePending}
    >
      <KnowledgeItemsInfo vectorStore={vectorStore} showStatus={true} />
      <KnowledgeAppsInfo vectorStore={vectorStore} />
    </CardsListItem>
  );
}

KnowledgeCard.Skeleton = function Skeleton() {
  return (
    <CardsListItem.Skeleton className={classes.card}></CardsListItem.Skeleton>
  );
};

export function KnowledgeItemsInfo({
  vectorStore,
  showStatus,
}: {
  vectorStore: VectorStoreResponse;
  showStatus?: boolean;
}) {
  return (
    <div className={classes.info}>
      <span>{pluralize('document', vectorStore.file_counts.total, true)}</span>

      {showStatus && (
        <div className={classes.status}>
          {vectorStore.status === 'in_progress' && (
            <Tooltip
              content={
                vectorStore.file_counts.in_progress
                  ? `${pluralize('document', vectorStore.file_counts.in_progress, true)} ${pluralize('is', vectorStore.file_counts.in_progress)} still embedding`
                  : 'Embedding in progress...'
              }
              asChild
              placement="top"
            >
              <span>
                <InlineLoading />
              </span>
            </Tooltip>
          )}
          {vectorStore.file_counts.failed > 0 && (
            <Tooltip
              content={`${pluralize('document', vectorStore.file_counts.failed, true)} ${pluralize('have', vectorStore.file_counts.failed)} failed embedding`}
              asChild
              placement="top"
            >
              <span className={classes.error}>
                <WarningAlt />
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
