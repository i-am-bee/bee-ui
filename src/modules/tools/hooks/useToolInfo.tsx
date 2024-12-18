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

import { useQuery } from '@tanstack/react-query';
import { Tool, ToolReference } from '@/app/api/tools/types';
import { readToolQuery } from '../queries';
import { ComponentType, useMemo } from 'react';
import { SystemToolId } from '@/app/api/threads-runs/types';
import Arxiv from '../icons/arxiv.svg';
import DuckDuckGo from '../icons/duckduckgo.svg';
import Google from '../icons/google.svg';
import Wikipedia from '../icons/wikipedia.svg';
import {
  Code,
  DocumentView,
  IbmWatsonDiscovery,
  PartlyCloudy,
  SearchLocate,
  Tools,
  Calculator,
  IbmWatsonxAssistant,
} from '@carbon/react/icons';
import { SkeletonIcon } from '@carbon/react';
import { ToolName } from '../common/ToolName';
import { encodeEntityWithMetadata } from '@/app/api/utils';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { useTools } from './useTools';

export function useToolInfo({
  toolReference,
  organization,
  project,
}: {
  toolReference: ToolReference;
  organization: Organization;
  project: Project;
}) {
  const { tool: toolProp, id, type } = toolReference;
  const isQueryable = type === 'user' || type === 'system';
  const { data, isLoading, error } = useQuery({
    ...readToolQuery(organization.id, project.id, id),
    enabled: isQueryable,
    initialData: toolProp
      ? encodeEntityWithMetadata<Tool>(toolProp)
      : undefined,
  });

  const { data: staticToolData } = useTools({
    params: { type: [type] },
    enabled: !isQueryable,
  });
  const staticTool = staticToolData?.tools.at(0);

  const tool = data ?? staticTool ?? toolProp;

  const toolName = useMemo(() => {
    if (tool) return tool.name;

    if (
      isLoading &&
      ((type === 'system' && id === 'web_search') || type === 'user')
    ) {
      return <ToolName.Skeleton />;
    }

    return getStaticToolName({ ...toolReference, tool });
  }, [id, isLoading, tool, toolReference, type]);

  const toolIcon = useMemo(() => {
    if (type === 'system') {
      if (id === 'web_search') {
        if (tool?.name === 'GoogleSearch') return Google;
        if (tool?.name === 'DuckDuckGo') return DuckDuckGo;
        return SkeletonIcon;
      }
      return SYSTEM_TOOL_ICONS[id] ?? Tools;
    }
    if (type === 'file_search') return SearchLocate;
    if (type === 'code_interpreter' || type === 'function') return Code;

    return Tools;
  }, [id, tool, type]);

  return { toolName, toolIcon, tool: data ?? staticTool, isLoading, error };
}

const SYSTEM_TOOL_NAME: Record<SystemToolId, string> = {
  wikipedia: 'Wikipedia',
  web_search: 'WebSearch',
  weather: 'OpenMeteo',
  arxiv: 'Arxiv',
  read_file: 'ReadFile',
  llm: 'LLM',
  calculator: 'Calculatr',
};

const SYSTEM_TOOL_ICONS: Record<SystemToolId, ComponentType> = {
  wikipedia: Wikipedia,
  web_search: IbmWatsonDiscovery,
  weather: PartlyCloudy,
  arxiv: Arxiv,
  read_file: DocumentView,
  llm: IbmWatsonxAssistant,
  calculator: Calculator,
};

export function getStaticToolName({ type, id, tool }: ToolReference) {
  if (tool) return tool.name;

  switch (type) {
    case 'system':
      return SYSTEM_TOOL_NAME[id] ?? id;
    case 'code_interpreter':
      return 'Python Intepreter';
    case 'function':
      return 'Function';
    case 'user':
      return 'Custom Tool';
    case 'file_search':
      return 'FileSearch';
  }
}
