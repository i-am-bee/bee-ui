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
