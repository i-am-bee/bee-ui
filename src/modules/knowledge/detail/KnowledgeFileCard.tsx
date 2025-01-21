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

import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { VectorStore } from '@/app/api/vector-stores/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InlineLoading,
  SkeletonPlaceholder,
  SkeletonText,
} from '@carbon/react';
import { Document, WarningAlt } from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useFilesQueries } from '../../files/api';
import { useDeleteVectorStoreFile } from '../api/mutations/useDeleteVectorStoreFile';
import classes from './KnowledgeFileCard.module.scss';

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
  const { isProjectReadOnly } = useAppContext();
  const filesQueries = useFilesQueries();

  const {
    mutateWithConfirmationAsync: deleteVectorStoreFile,
    isPending: isDeletePending,
  } = useDeleteVectorStoreFile({
    onSuccess: async () => {
      onDeleteSuccess?.(vectorStoreFile);
    },
  });

  const { data, isLoading } = useQuery(filesQueries.detail(vectorStoreFile.id));

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
                  deleteVectorStoreFile({
                    vectorStore,
                    vectorStoreFile,
                    filename: data?.filename,
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
