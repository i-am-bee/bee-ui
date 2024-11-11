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

import {
  SystemToolId,
  ToolApprovalRequest,
  ToolType,
} from '@/app/api/threads-runs/types';
import { Tool, ToolId, ToolReference, ToolsUsage } from '@/app/api/tools/types';
import { DocumentView, PartlyCloudy } from '@carbon/react/icons';
import { ComponentType } from 'react';
import Arxiv from './icons/arxiv.svg';
import DuckDuckGo from './icons/duckduckgo.svg';
import Wikipedia from './icons/wikipedia.svg';

export function getToolReferenceId(tool: ToolReference): string {
  switch (tool.type) {
    case 'system':
    case 'user':
      return tool.id;
    default:
      return tool.type;
  }
}

export function getToolUsageId(
  tool: ToolsUsage[number],
): ToolId | string | null {
  switch (tool.type) {
    case 'code_interpreter':
      return tool.type;
    case 'file_search':
      return tool.type;
    case 'system':
      return tool.system.id;
    case 'user':
      return tool.user.tool.id;
    default:
      return null;
  }
}

export function getToolApprovalId(tool: ToolApprovalRequest): string | null {
  switch (tool.type) {
    case 'code_interpreter':
      return tool.type;
    case 'user':
      return tool.user.tool.id;
    case 'system':
      return tool.system.id;
    default:
      return null;
  }
}

export function toolsEqual(
  tool1: ToolsUsage[number],
  tool2: ToolsUsage[number],
): boolean {
  if (tool1.type !== tool2.type) return false;

  if (tool1.type === 'user' && tool2.type === 'user') {
    return tool1.user.tool.id === tool2.user.tool.id;
  } else if (tool1.type === 'system' && tool2.type === 'system') {
    return tool1.system.id === tool2.system.id;
  }

  return true;
}

export function toolIncluded(
  tools: ToolsUsage,
  tool: ToolsUsage[number],
): boolean {
  return tools.some((t) => toolsEqual(t, tool));
}

export function getToolReference(tool: Tool): ToolReference {
  return {
    tool,
    ...(tool.type === 'system'
      ? { type: tool.type, id: tool.id as SystemToolId }
      : tool.type === 'user'
        ? { type: tool.type, id: tool.id }
        : { type: tool.type, id: tool.type }),
  };
}

export function isExternalTool(type: ToolType, id: string) {
  return !(
    type === 'file_search' ||
    type === 'function' ||
    (type === 'system' && id === ('read_file' satisfies SystemToolId))
  );
}

const SYSTEM_TOOL_ICONS: Record<SystemToolId, ComponentType> = {
  wikipedia: Wikipedia,
  web_search: DuckDuckGo,
  weather: PartlyCloudy,
  arxiv: Arxiv,
  read_file: DocumentView,
};

const SYSTEM_TOOL_NAME: Record<SystemToolId, string> = {
  wikipedia: 'Wikipedia',
  web_search: 'DuckDuckGo',
  weather: 'OpenMeteo',
  arxiv: 'Arxiv',
  read_file: 'ReadFile',
};
