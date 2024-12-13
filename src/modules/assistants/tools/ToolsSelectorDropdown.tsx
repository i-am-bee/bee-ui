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

import { useCallback, useMemo } from 'react';
import { useListAllTools } from './useListAllTools';
import { Tool, ToolReference } from '@/app/api/tools/types';
import { useController } from 'react-hook-form';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from '../builder/AssistantBuilderProvider';
import { getToolReferenceFromTool } from '@/modules/tools/utils';
import { ToolIcon } from '@/modules/tools/ToolCard';
import uniq from 'lodash/uniq';
import {
  DropdownSelector,
  DropdownSelectorGroup,
} from '@/components/DropdownSelector/DropdownSelector';
import { DropdownSkeleton } from '@carbon/react';
import { getStaticToolName } from '@/modules/tools/hooks/useToolInfo';
import { ToolNameWithTooltip } from './ToolNameWithTooltip';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function ToolsSelectorDropdown() {
  const {
    formReturn: { getValues },
  } = useAssistantBuilder();

  const { tools, isLoading } = useListAllTools();
  const { project, organization } = useProjectContext();

  const {
    field: { onChange, value },
  } = useController<AssistantFormValues, 'tools'>({ name: 'tools' });

  const handleAddTools = useCallback(
    (items: ToolReference[]) => {
      const selectedTools = getValues('tools');
      onChange(
        uniq([...selectedTools, ...items]),
        ({ id, type }: ToolReference) => `${id}${type}`,
      );
    },
    [getValues, onChange],
  );

  const items: DropdownSelectorGroup<ToolReference>[] | null = useMemo(
    () =>
      tools
        ? [
            {
              id: 'user',
              groupTitle: 'Custom tools',
              items: filterToolsBySelectedValue(tools.user ?? [], value),
            },
            {
              id: 'public',
              groupTitle: 'Public tools',
              items: filterToolsBySelectedValue(tools.public ?? [], value),
            },
          ]
        : null,
    [tools, value],
  );

  return (
    <>
      {items && (
        <DropdownSelector<ToolReference>
          items={items}
          multiple
          placeholder="Browse available tools"
          itemToString={(item) => getStaticToolName(item)}
          itemToElement={(item) => (
            <>
              <ToolIcon
                organization={organization}
                project={project}
                tool={item}
              />
              <ToolNameWithTooltip toolReference={item} />
            </>
          )}
          onSubmit={(items, clearSelected) => {
            items && handleAddTools(items);
            clearSelected();
          }}
          submitButtonTitle="Add selected tools"
        />
      )}
      {!items && isLoading && <DropdownSkeleton />}
    </>
  );
}

function filterToolsBySelectedValue(tools: Tool[], selected: ToolReference[]) {
  return tools
    .filter(
      (tool) =>
        !selected.some(({ type, id }) => type === tool.type && id === tool.id),
    )
    .map(getToolReferenceFromTool);
}
