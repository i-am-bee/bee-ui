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

import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useModal } from '@/layout/providers/ModalProvider';
import { useRouter } from 'next-nprogress-bar';
import { MouseEventHandler } from 'react';
import { AppIcon } from '../AppIcon';
import { useDeleteArtifact } from '../hooks/useDeleteArtifact';
import { ShareAppModal } from '../ShareAppModal';
import { Artifact } from '../types';
import classes from './AppCard.module.scss';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  artifact: Artifact;
  cta?: string;
  onClick?: MouseEventHandler;
  onDeleteSuccess?: (artifact: Artifact) => void;
}

export function AppCard({ artifact, cta, onClick, onDeleteSuccess }: Props) {
  const { name, description } = artifact;
  const router = useRouter();
  const { openModal } = useModal();

  const { deleteArtifact, isPending: isDeletePending } = useDeleteArtifact({
    artifact,
    onSuccess: async () => {
      onDeleteSuccess?.(artifact);
    },
  });
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
            onClick: () => deleteArtifact(),
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
