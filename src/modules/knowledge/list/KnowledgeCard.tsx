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

import { deleteVectorStore } from '@/app/api/vector-stores';
import { VectorStore } from '@/app/api/vector-stores/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { InlineLoading } from '@carbon/react';
import { Folder, TrashCan, WarningAlt } from '@carbon/react/icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import pluralize from 'pluralize';
import { KnowledgeAppsInfo } from '../detail/KnowledgeAppsInfo';
import { useVectorStoresQueries } from '../queries';
import classes from './KnowledgeCard.module.scss';
import { RenameModal } from './RenameModal';

interface Props {
  vectorStore: VectorStore;
  onUpdateSuccess: (vectorStore: VectorStore) => void;
  onDeleteSuccess: (vectorStore: VectorStore) => void;
}

export function KnowledgeCard({
  vectorStore,
  onUpdateSuccess,
  onDeleteSuccess,
}: Props) {
  const { id, name } = vectorStore;
  const { openConfirmation, openModal } = useModal();
  const { project, organization, isProjectReadOnly } = useAppContext();
  const router = useRouter();
  const vectorStoresQueries = useVectorStoresQueries();

  const { mutateAsync: mutateDeleteStore, isPending: isDeletePending } =
    useMutation({
      mutationFn: (id: string) =>
        deleteVectorStore(organization.id, project.id, id),
      onSuccess: () => onDeleteSuccess(vectorStore),
      meta: {
        invalidates: [vectorStoresQueries.lists()],
        errorToast: {
          title: 'Failed to delete knowledge base',
          includeErrorMessage: true,
        },
      },
    });

  return (
    <CardsListItem
      title={name}
      className={classes.card}
      icon={
        <span className={classes.icon}>
          <Folder size="20" />
        </span>
      }
      onClick={() => router.push(`/${project.id}/knowledge/${id}`)}
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
                      onSuccess={onUpdateSuccess}
                      {...props}
                    />
                  )),
              },
              {
                isDelete: true,
                itemText: 'Delete',
                onClick: () =>
                  openConfirmation({
                    title: 'Delete knowledge base?',
                    // TODO: add apps info "This knowledge base contains 12 documents and 3 websites, which are used by 2 apps. Are you sure you want to delete it?"
                    body: `This knowledge base contains ${vectorStore.file_counts.total} documents. Are you sure you want to delete it?`,
                    primaryButtonText: 'Delete knowledge base',
                    danger: true,
                    icon: TrashCan,
                    size: 'md',
                    onSubmit: () => mutateDeleteStore(id),
                  }),
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
  vectorStore: VectorStore;
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
