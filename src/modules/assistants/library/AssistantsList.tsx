import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useAppApiContext } from '@/layout/providers/AppProvider';
import { useRoutes } from '@/routes/useRoutes';
import { ASSISTANTS_DEFAULT_PAGE_SIZE } from '../api';
import { Assistant } from '../types';
import { AssistantCard } from './AssistantCard';

interface Props {
  assistants?: NonNullable<Assistant>[];
  isLoading: boolean;
  pageSize?: number;
}

export function AssistantsList({
  assistants,
  isLoading,
  pageSize = ASSISTANTS_DEFAULT_PAGE_SIZE,
}: Props) {
  const { selectAssistant } = useAppApiContext();
  const { routes, navigate } = useRoutes();

  return (
    <>
      {assistants?.map((assistant) => (
        <AssistantCard
          key={assistant.id}
          assistant={assistant}
          cta="Start chat"
          onClick={() => {
            selectAssistant(assistant);
            navigate(routes.chat({ assistantId: assistant.id }));
          }}
        />
      ))}

      {isLoading &&
        Array.from({ length: pageSize }, (_, i) => (
          <CardsListItem.Skeleton key={i} />
        ))}
    </>
  );
}
