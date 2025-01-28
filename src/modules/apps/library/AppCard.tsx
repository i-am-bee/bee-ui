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

import { ArtifactDeleteResult } from '@/app/api/artifacts/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useRouter } from 'next-nprogress-bar';
import { MouseEventHandler } from 'react';
import { useDeleteArtifact } from '../api/mutations/useDeleteArtifact';
import { AppIcon } from '../AppIcon';
import { ShareAppModal } from '../ShareAppModal';
import { Artifact } from '../types';
import classes from './AppCard.module.scss';

interface Props {
  artifact: Artifact;
  cta?: string;
  onClick?: MouseEventHandler;
}

export function AppCard({ artifact, cta, onClick }: Props) {
  const { name, description } = artifact;
  const router = useRouter();
  const { openModal } = useModal();

  const {
    mutateAsyncWithConfirmation: deleteArtifact,
    isPending: isDeletePending,
  } = useDeleteArtifact();
  const { project } = useAppContext();

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        icon={<AppIcon name={artifact.uiMetadata.icon} />}
        onClick={onClick}
        isDeletePending={isDeletePending}
        cta={cta ? { title: cta } : undefined}
        actions={[
          {
            itemText: 'Edit',
            onClick: () =>
              router.push(`/${project.id}/apps/builder/a/${artifact.id}`),
          },
          {
            itemText: 'Share',
            onClick: () =>
              openModal((props) => (
                <ShareAppModal {...props} artifact={artifact} />
              )),
          },
          {
            itemText: 'Copy to edit',
            onClick: () =>
              router.push(`/${project.id}/apps/builder/clone/${artifact.id}`),
          },
          {
            isDelete: true,
            itemText: 'Delete',
            onClick: () => deleteArtifact(artifact),
          },
        ]}
      >
        {description && (
          <div className={classes.body}>
            <p>{description}</p>
          </div>
        )}
      </CardsListItem>
    </>
  );
}

AppCard.Skeleton = function Skeleton() {
  return <CardsListItem.Skeleton className={classes.root} />;
};
