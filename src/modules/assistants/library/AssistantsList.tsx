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

import { useAppApiContext } from '@/layout/providers/AppProvider';
import { getNewSessionUrl } from '@/layout/shell/NewSessionButton';
import { useRouter } from 'next-nprogress-bar';
import { Assistant } from '../types';
import { PAGE_SIZE } from './queries';
import { AssistantCard } from './AssistantCard';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  assistants?: NonNullable<Assistant>[];
  isLoading: boolean;
  pageSize?: number;
  onDeleteSuccess: (assistant: Assistant) => void;
}

export function AssistantsList({
  assistants,
  isLoading,
  pageSize = PAGE_SIZE,
  onDeleteSuccess,
}: Props) {
  const { selectAssistant } = useAppApiContext();
  const { project } = useProjectContext();
  const router = useRouter();

  return (
    <>
      {assistants?.map((assistant) => (
        <AssistantCard
          key={assistant.id}
          assistant={assistant}
          cta="Start chat"
          onDeleteSuccess={onDeleteSuccess}
          onClick={() => {
            selectAssistant(assistant);
            router.push(getNewSessionUrl(project.id, assistant));
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
