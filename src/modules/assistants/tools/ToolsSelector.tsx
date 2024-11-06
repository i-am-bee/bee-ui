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
            const Icon = getToolIcon(tool);
            return (
              <AnimatePresence key={tool.id}>
                <motion.li {...fadeProps()}>
                  <span className={classes.selectedIcon}>
                    <Icon />
                  </span>
                  {getToolName(tool)}
                  <Tooltip
                    content="Remove tool from bee"
                    asChild
                    placement="top"
                  >
                    <button
                      className={classes.removeButton}
                      onClick={() => handleToggle(tool, false)}
                    >
                      <Close size={18} />
                    </button>
                  </Tooltip>
                </motion.li>
              </AnimatePresence>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function filterToolsBySelectedValue(tools: Tool[], selected: ToolReference[]) {
  return tools
    .filter(
      (tool) =>
        !selected.some(({ type, id }) => type === tool.type && id === tool.id),
    )
    .map(getToolReference);
}
