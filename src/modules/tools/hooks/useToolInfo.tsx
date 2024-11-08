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
import { SkeletonIcon, SkeletonPlaceholder, SkeletonText } from '@carbon/react';
import { ToolNameSkeleton } from '../components/ToolNameSkeleton';

export function useToolInfo(toolReference: ToolReference) {
  const { tool: toolProp, id, type } = toolReference;
  const { project } = useAppContext();
  const { data, isLoading } = useQuery({
    ...readToolQuery(project.id, id),
    enabled: !toolProp && (type === 'user' || type === 'system'),
  });

  const tool = toolProp ?? data;

  const toolName = useMemo(() => {
    if (tool) return tool.name;

    if (type === 'system' && id === 'web_search') {
      return isLoading ? <ToolNameSkeleton /> : SYSTEM_TOOL_NAME[id];
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

  return { toolName, toolIcon };
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
