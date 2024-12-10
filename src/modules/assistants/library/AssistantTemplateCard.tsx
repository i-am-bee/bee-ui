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

import { ToolReference, ToolsUsage } from '@/app/api/tools/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useVectorStore } from '@/modules/knowledge/hooks/useVectorStore';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { getToolReferenceFromToolUsage } from '@/modules/tools/utils';
import { SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { AssistantIcon } from '../icons/AssistantIcon';
import { Assistant, AssistantTemplate } from '../types';
import classes from './AssistantCard.module.scss';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  template: AssistantTemplate;
  selected?: boolean;
  onClick?: MouseEventHandler;
  organization: Organization;
  project: Project;
}

export function AssistantTemplateCard({
  template,
  selected,
  organization,
  project,
  onClick,
}: Props) {
  const { name, description, tools, tool_resources } = template;
  const vectorStoreId = tool_resources?.file_search?.vector_store_ids?.at(0);

  return (
    <CardsListItem
      className={classes.root}
      title={name ?? ''}
      icon={<AssistantIcon assistant={template} size="lg" />}
      onClick={onClick}
      selected={selected}
      canHover
    >
      {description && (
        <div className={classes.body}>
          <p>{description}</p>
        </div>
      )}

      <div className={classes.footer}>
        <ToolsInfo
          organization={organization}
          project={project}
          tools={tools}
        />
        {vectorStoreId && <KnowledgeInfo vectorStoreId={vectorStoreId} />}
      </div>
    </CardsListItem>
  );
}

function ToolsInfo({
  tools,
  organization,
  project,
}: {
  tools: ToolsUsage;
  organization: Organization;
  project: Project;
}) {
  const displayedTools = tools.slice(0, 3);
  const remainingToolsCount = tools.length - displayedTools.length;
  const [loadingStates, setLoadingStates] = useState(
    Array.from({ length: displayedTools.length }, () => true),
  );
  const isLoading = loadingStates.some((state) => state);

  return tools.length > 0 ? (
    <>
      {isLoading && <SkeletonText className={classes.info} />}

      <div className={clsx(classes.info, { [classes.loading]: isLoading })}>
        <strong>Tools:</strong>
        {displayedTools.map((tool, index) => {
          const toolReference = getToolReferenceFromToolUsage(tool);

          return (
            <span key={toolReference.id}>
              <ToolName
                organization={organization}
                project={project}
                index={index}
                tool={toolReference}
                setLoadingStates={setLoadingStates}
              />
              {index < displayedTools.length - 1 ? ', ' : ''}
            </span>
          );
        })}
        {remainingToolsCount > 0 && ` +${remainingToolsCount}`}
      </div>
    </>
  ) : null;
}

function ToolName({
  index,
  tool,
  setLoadingStates,
  organization,
  project,
}: {
  index: number;
  tool: ToolReference;
  organization: Organization;
  project: Project;
  setLoadingStates: Dispatch<SetStateAction<boolean[]>>;
}) {
  const { toolName, isLoading } = useToolInfo({
    organization,
    project,
    toolReference: tool,
  });

  const onLoadingChange = useCallback(
    (isLoading: boolean) => {
      setLoadingStates((states) =>
        states.map((state, idx) => (idx === index ? isLoading : state)),
      );
    },
    [index, setLoadingStates],
  );

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  return toolName;
}

function KnowledgeInfo({ vectorStoreId }: { vectorStoreId: string }) {
  const { data, isLoading } = useVectorStore(vectorStoreId);

  return isLoading ? (
    <SkeletonText className={classes.info} />
  ) : (
    <div className={classes.info}>
      <strong>Knowledge:</strong>
      {data?.name}
    </div>
  );
}
