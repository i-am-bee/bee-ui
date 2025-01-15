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
import { MouseEventHandler, useState } from 'react';
import { useDeleteAssistant } from '../builder/useDeleteAssistant';
import { AssistantModalRenderer } from '../detail/AssistantModalRenderer';
import { AssistantIcon } from '../icons/AssistantIcon';
import { Assistant } from '../types';
import classes from './AssistantCard.module.scss';

interface Props {
  assistant: Assistant;
  cta?: string;
  onClick?: MouseEventHandler;
  onDeleteSuccess?: (assistant: Assistant) => void;
}

export function AssistantCard({
  assistant,
  cta,
  onClick,
  onDeleteSuccess,
}: Props) {
  const { name, description } = assistant;
  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant,
    onSuccess: async () => {
      onDeleteSuccess?.(assistant);
    },
  });
  const { isProjectReadOnly } = useAppContext();
  const [builderModalOpened, setBuilderModalOpened] = useState<boolean>(false);

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        icon={<AssistantIcon assistant={assistant} />}
        onClick={onClick}
        isDeletePending={isDeletePending}
        cta={cta ? { title: cta } : undefined}
        actions={[
          {
            itemText: 'Agent details',
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
        {description && (
          <div className={classes.body}>
            <p>{description}</p>
          </div>
        )}
      </CardsListItem>

      <AssistantModalRenderer
        assistant={assistant}
        isOpened={builderModalOpened}
        onModalClose={() => setBuilderModalOpened(false)}
      />
    </>
  );
}
