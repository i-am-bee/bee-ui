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
import { useAppContext } from '@/layout/providers/AppProvider';
import { ToolReference } from '@/app/api/tools/types';
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
} from '@carbon/react/icons';
import { SkeletonIcon } from '@carbon/react';
import { ToolNameSkeleton } from '../components/ToolNameSkeleton';

export function useToolInfo(toolReference: ToolReference) {
  const { tool: toolProp, id, type } = toolReference;
  const { project } = useAppContext();
  const { data, isLoading, error } = useQuery({
    ...readToolQuery(project.id, id),
    enabled: !toolProp && (type === 'user' || type === 'system'),
  });

  const tool = toolProp ?? data;

  const toolName = useMemo(() => {
    if (tool) return tool.name;

    if (
      isLoading &&
      ((type === 'system' && id === 'web_search') || type === 'user')
    ) {
      return <ToolNameSkeleton />;
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
      return SYSTEM_TOOL_ICONS[id];
    }
    if (type === 'file_search') return SearchLocate;
    if (type === 'code_interpreter' || type === 'function') return Code;

    return Tools;
  }, [id, tool, type]);

  return { toolName, toolIcon, error, isLoading };
}

const SYSTEM_TOOL_NAME: Record<SystemToolId, string> = {
  wikipedia: 'Wikipedia',
  web_search: 'WebSearch',
  weather: 'OpenMeteo',
  arxiv: 'Arxiv',
  read_file: 'ReadFile',
};

const SYSTEM_TOOL_ICONS: Record<SystemToolId, ComponentType> = {
  wikipedia: Wikipedia,
  web_search: IbmWatsonDiscovery,
  weather: PartlyCloudy,
  arxiv: Arxiv,
  read_file: DocumentView,
};

export function getStaticToolName({ type, id, tool }: ToolReference) {
  if (tool) return tool.name;

  switch (type) {
    case 'system':
      return SYSTEM_TOOL_NAME[id];
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
