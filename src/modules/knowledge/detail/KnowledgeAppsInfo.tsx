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

import { VectorStore } from '@/app/api/vector-stores/types';
import { useAssistants } from '@/modules/assistants/hooks/useAssistants';
import { AssistantIcon } from '@/modules/assistants/icons/AssistantIcon';
import { SkeletonText } from '@carbon/react';
import pluralize from 'pluralize';
import { useMemo } from 'react';
import classes from './KnowledgeAppsInfo.module.scss';

interface Props {
  vectorStore: VectorStore;
}

export function KnowledgeAppsInfo({ vectorStore }: Props) {
  const { data, isLoading } = useAssistants({ params: { limit: PAGE_SIZE } });

  const assistants = useMemo(
    () =>
      data?.assistants.filter(
        (item) =>
          item.tool_resources?.file_search?.vector_store_ids?.at(0) ===
          vectorStore.id,
      ),
    [data?.assistants, vectorStore.id],
  );

  if (isLoading && !data)
    return <SkeletonText className={classes.skeleton} width="" />;

  if (!assistants?.length) return null;

  return (
    <div className={classes.root}>
      <div className={classes.apps}>
        {assistants.slice(0, APPS_COUNT_TO_SHOW_ICONS).map((item) => (
          <AssistantIcon key={item.id} assistant={item} />
        ))}
        {assistants.length > APPS_COUNT_TO_SHOW_ICONS && (
          <span className={classes.more}>
            +{assistants.length - APPS_COUNT_TO_SHOW_ICONS}
          </span>
        )}
      </div>
      <span className={classes.usedBy}>
        used by {pluralize('bee', assistants.length, true)}
      </span>
    </div>
  );
}

// try loading all apps, we trust nobody has more than 100
const PAGE_SIZE = 100;

const APPS_COUNT_TO_SHOW_ICONS = 3;
