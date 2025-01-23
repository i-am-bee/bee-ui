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

import { Tool, ToolReference } from '@/app/api/tools/types';
import {
  DropdownSelector,
  DropdownSelectorGroup,
} from '@/components/DropdownSelector/DropdownSelector';
import { getStaticToolName } from '@/modules/tools/hooks/useToolInfo';
import { ToolIcon } from '@/modules/tools/ToolCard';
import { getToolReferenceFromTool } from '@/modules/tools/utils';
import { DropdownSkeleton } from '@carbon/react';
import uniq from 'lodash/uniq';
import { useCallback, useMemo } from 'react';
import { useController } from 'react-hook-form';
import { useListAllTools } from '../../tools/api/queries/useListAllTools';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from '../builder/AssistantBuilderProvider';
import { ToolNameWithTooltip } from './ToolNameWithTooltip';

export function ToolsSelectorDropdown() {
  const {
    formReturn: { getValues },
  } = useAssistantBuilder();

  const { tools, isLoading } = useListAllTools();

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
              <ToolIcon tool={item} />
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
