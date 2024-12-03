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
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { MouseEventHandler } from 'react';
import classes from './AppCard.module.scss';
import { Artifact } from '../types';
import { useModal } from '@/layout/providers/ModalProvider';
import { useDeleteArtifact } from '../hooks/useDeleteArtifact';
import { UpdateAppModal } from '../manage/UpdateAppModal';

interface Props {
  artifact: Artifact;
  cta?: string;
  onClick?: MouseEventHandler;
  onDeleteSuccess?: (artifact: Artifact) => void;
}

export function AppCard({ artifact, cta, onClick, onDeleteSuccess }: Props) {
  const { name, description } = artifact;
  const { deleteArtifact, isPending: isDeletePending } = useDeleteArtifact({
    artifact,
    onSuccess: async () => {
      onDeleteSuccess?.(artifact);
    },
  });
  const { organization, project } = useAppContext();
  const { openModal } = useModal();

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        // TODO: icon={<AppIcon assistant={assistant} size="lg" />}
        onClick={onClick}
        isDeletePending={isDeletePending}
        cta={cta ? { title: cta } : undefined}
        actions={[
          ...[
            {
              itemText: 'Edit',
              onClick: () =>
                openModal((props) => (
                  <UpdateAppModal
                    organization={organization}
                    artifact={artifact}
                    project={project}
                    {...props}
                  />
                )),
            },
            {
              isDelete: true,
              itemText: 'Delete',
              onClick: () => deleteArtifact(),
            },
          ],
        ].filter(isNotNull)}
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
