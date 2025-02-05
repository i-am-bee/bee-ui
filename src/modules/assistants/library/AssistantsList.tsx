/**
 * Copyright 2025 IBM Corp.
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
import { useAppApiContext } from '@/layout/providers/AppProvider';
import { useRoutes } from '@/routes/useRoutes';
import { ASSISTANTS_DEFAULT_PAGE_SIZE } from '../api';
import { Assistant } from '../types';
import { AssistantCard } from './AssistantCard';

interface Props {
  assistants?: Assistant[];
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
