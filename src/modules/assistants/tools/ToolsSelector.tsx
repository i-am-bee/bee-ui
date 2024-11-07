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
  Button,
  Checkbox,
  IconButton,
  SelectableTile,
  Tag,
  usePrefix,
} from '@carbon/react';
import classes from './ToolsSelector.module.scss';
import { ChevronDown, Close } from '@carbon/react/icons';
import { AnimatePresence, motion } from 'framer-motion';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useId, useMemo, useRef, useState } from 'react';
import { fadeProps } from '@/utils/fadeProps';
import { mergeRefs } from 'react-merge-refs';
import { useListAllTools } from './useListAllTools';
import { Tool, ToolReference } from '@/app/api/tools/types';
import { useController } from 'react-hook-form';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from '../builder/AssistantBuilderProvider';
import {
  getToolIcon,
  getToolName,
  getToolReference,
} from '@/modules/tools/utils';
import { ToolIcon } from '@/modules/tools/ToolCard';
import { LinkButton } from '@/components/LinkButton/LinkButton';
import { useAppContext } from '@/layout/providers/AppProvider';
import { Link } from '@/components/Link/Link';
import clsx from 'clsx';
import { ToolsSelectorDropdown } from './ToolsSelectorDropdown';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useQuery } from '@tanstack/react-query';
import { readToolQuery } from '@/modules/tools/queries';
import { encodeEntityWithMetadata } from '@/app/api/utils';

export function ToolsSelector() {
  const prefix = usePrefix();
  const {
    formReturn: { getValues },
  } = useAssistantBuilder();

  const {
    field: { onChange, value },
  } = useController<AssistantFormValues, 'tools'>({ name: 'tools' });

  const handleToggle = (tool: ToolReference, toggled: boolean) => {
    const selectedTools = getValues('tools');
    tool?.type &&
      onChange(
        toggled
          ? [...selectedTools, tool]
          : selectedTools.filter(
              ({ id, type }) => type !== tool.type || id !== tool.id,
            ),
      );
  };

  return (
    <div className={classes.root}>
      <ToolsSelectorDropdown />
      <div className={classes.selected}>
        <span className={`${prefix}--label`}>Added tools</span>
        <ul>
          {value.map((tool) => {
            return (
              <SelectedToolsItem
                key={tool.id}
                tool={tool}
                onToggle={handleToggle}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SelectedToolsItem({
  tool: toolProp,
  onToggle,
}: {
  tool: ToolReference;
  onToggle: (tool: ToolReference, toggled: boolean) => void;
}) {
  const { project } = useAppContext();
  const { data } = useQuery({
    ...readToolQuery(project.id, toolProp.id),
    enabled:
      !toolProp.tool &&
      (toolProp.type === 'user' || toolProp.type === 'system'),
  });

  const tool = data ? { ...toolProp, tool: data } : toolProp;
  const Icon = getToolIcon(tool);

  return (
    <AnimatePresence key={tool.id}>
      <motion.li {...fadeProps()}>
        <span className={classes.selectedIcon}>
          <Icon />
        </span>
        {getToolName(tool)}
        <Tooltip content="Remove tool from bee" asChild placement="top">
          <button
            className={classes.removeButton}
            onClick={() => onToggle(tool, false)}
          >
            <Close size={18} />
          </button>
        </Tooltip>
      </motion.li>
    </AnimatePresence>
  );
}
