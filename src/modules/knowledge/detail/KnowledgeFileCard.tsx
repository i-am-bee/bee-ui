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

import { Document, TrashCan, WarningAlt } from '@carbon/react/icons';
import { useModal } from '@/layout/providers/ModalProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { VectorStore } from '@/app/api/vector-stores/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import classes from './KnowledgeFileCard.module.scss';
import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { deleteVectorStoreFile } from '@/app/api/vector-stores-files';
import { readFileQuery } from '../../files/queries';
import {
  InlineLoading,
  SkeletonPlaceholder,
  SkeletonText,
} from '@carbon/react';
import clsx from 'clsx';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  vectorStore: VectorStore;
  vectorStoreFile: VectorStoreFile;
  onDeleteSuccess?: (file: VectorStoreFile) => void;
  readOnly?: boolean;
  kind?: 'card' | 'list';
}

export function KnowledgeFileCard({
  vectorStore,
  vectorStoreFile,
  readOnly,
  kind = 'card',
  onDeleteSuccess,
}: Props) {
  const { openConfirmation } = useModal();
  const { project, isProjectReadOnly } = useAppContext();

  const { mutateAsync: mutateDeleteFile, isPending: isDeletePending } =
    useMutation({
      mutationFn: () =>
        deleteVectorStoreFile(project.id, vectorStore.id, vectorStoreFile.id),
      onSuccess: async () => {
        onDeleteSuccess?.(vectorStoreFile);
      },
      meta: {
        errorToast: {
          title: 'Failed to delete the file',
          includeErrorMessage: true,
        },
      },
    });

  const { data, isLoading } = useQuery(
    readFileQuery(project.id, vectorStoreFile.id),
  );

  if (!data && isLoading)
    return kind === 'card' ? (
      <KnowledgeFileCard.Skeleton />
    ) : (
      <li>
        <SkeletonPlaceholder className={classes.listItem} />
      </li>
    );

  return kind === 'card' ? (
    <CardsListItem
      title={
        <>
          <FileStatus vectorStoreFile={vectorStoreFile} />
          {data?.filename}
        </>
      }
      className={classes.card}
      isDeletePending={isDeletePending}
      actions={
        !isProjectReadOnly && !readOnly
          ? [
              {
                isDelete: true,
                itemText: 'Delete',
                onClick: () =>
                  openConfirmation({
                    title: 'Delete document?',
                    // TODO: add apps info "Are you sure you would like to delete Lorem-Ipsum.pdf? It is currently used by 3 apps."
                    body: `Are you sure you would like to delete ${data?.filename}?`,
                    primaryButtonText: 'Delete document',
                    danger: true,
                    icon: TrashCan,
                    size: 'md',
                    onSubmit: mutateDeleteFile,
                  }),
              },
            ]
          : undefined
      }
    >
      <span className={classes.description}>
        {data?.filename.split('.').pop()}
      </span>

      <div className={classes.preview}>
        <Document size={32} />
      </div>
    </CardsListItem>
  ) : (
    <li className={classes.listItem}>{data?.filename}</li>
  );
}

KnowledgeFileCard.Skeleton = function Skeleton() {
  return (
    <CardsListItem.Skeleton
      className={clsx(classes.card, classes.skeleton)}
      hideIcon
    >
      <div>
        <SkeletonText className={classes.skeletonTitle} width="" />
        <SkeletonText className={classes.description} width="" />
        <SkeletonPlaceholder className={classes.preview} />
      </div>
    </CardsListItem.Skeleton>
  );
};

function FileStatus({ vectorStoreFile }: { vectorStoreFile: VectorStoreFile }) {
  if (vectorStoreFile.status === 'completed') return null;

  return (
    <div className={classes.status}>
      {vectorStoreFile.status === 'in_progress' ? (
        <Tooltip content="Embedding in progress..." asChild placement="top">
          <span>
            <InlineLoading />
          </span>
        </Tooltip>
      ) : (
        <Tooltip
          content={
            vectorStoreFile.last_error?.message ??
            (vectorStoreFile.status === 'failed'
              ? 'This file has failed embedding'
              : 'Embedding has been cancelled')
          }
          asChild
          placement="top"
        >
          <span className={classes.error}>
            <WarningAlt />
          </span>
        </Tooltip>
      )}
    </div>
  );
}
