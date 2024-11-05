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

import { MouseEventHandler, useState } from 'react';
import { useDeleteAssistant } from '../builder/useDeleteAssistant';
import { AssistantIcon } from '../icons/AssistantIcon';
import { Assistant } from '../types';
import classes from './AssistantCard.module.scss';
import BlankAssistantCard from './blank-app-card.svg';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { AssistantModalRenderer } from '../detail/AssistantModalRenderer';

interface Props {
  assistant: Assistant;
  cta?: string;
  blank?: boolean;
  onClick?: MouseEventHandler;
  onDeleteSuccess: (assistant: Assistant) => void;
}

export function AssistantCard({
  assistant,
  cta,
  blank,
  onClick,
  onDeleteSuccess,
}: Props) {
  const { name, description } = assistant;
  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant,
    onSuccess: async () => {
      onDeleteSuccess(assistant);
    },
  });
  const { isProjectReadOnly } = useAppContext();
  const [builderModalOpened, setBuilderModalOpened] = useState<boolean>(false);

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        icon={<AssistantIcon assistant={assistant} size="lg" />}
        onClick={onClick}
        isDeletePending={isDeletePending}
        cta={cta ? { title: cta } : undefined}
        actions={[
          {
            itemText: 'Bee details',
            onClick: () => setBuilderModalOpened(true),
          },
          !isProjectReadOnly
            ? {
                isDelete: true,
                itemText: 'Delete',
                onClick: () => deleteAssistant(),
              }
            : null,
        ].filter(isNotNull)}
      >
        <div className={classes.body}>
          {description && <p className={classes.description}>{description}</p>}

          {blank && (
            <div className={classes.illustration}>
              <BlankAssistantCard />
            </div>
          )}
        </div>
      </CardsListItem>
      <AssistantModalRenderer
        assistant={assistant}
        isOpened={builderModalOpened}
        onModalClose={() => setBuilderModalOpened(false)}
      />
    </>
  );
}
