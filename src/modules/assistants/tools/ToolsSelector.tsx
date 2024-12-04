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

import { usePrefix } from '@carbon/react';
import classes from './ToolsSelector.module.scss';
import { Close } from '@carbon/react/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeProps } from '@/utils/fadeProps';
import { ToolReference } from '@/app/api/tools/types';
import { useController } from 'react-hook-form';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from '../builder/AssistantBuilderProvider';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ToolsSelectorDropdown } from './ToolsSelectorDropdown';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { useModal } from '@/layout/providers/ModalProvider';
import clsx from 'clsx';

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
  const { project, organization } = useAppContext();
  const {
    toolName,
    toolIcon: Icon,
    tool,
    error,
  } = useToolInfo({ toolReference: toolProp, project, organization });
  const { openModal } = useModal();

  const isUserTool = tool && tool.type === 'user';

  return (
    <AnimatePresence>
      <motion.li {...fadeProps()}>
        <button
          className={clsx(classes.selectedToolButton, {
            [classes.isUserTool]: isUserTool,
          })}
          onClick={() =>
            openModal(
              (props) =>
                isUserTool && (
                  <UserToolModal
                    organization={organization}
                    project={project}
                    tool={tool}
                    {...props}
                  />
                ),
            )
          }
        >
          <span className={classes.selectedIcon}>
            <Icon />
          </span>
          {error ? (
            <span className={classes.toolError}>Tool not found</span>
          ) : (
            toolName
          )}
        </button>
        <Tooltip content="Remove tool from bee" asChild placement="top">
          <button
            className={classes.removeButton}
            onClick={() => onToggle(toolProp, false)}
          >
            <Close size={18} />
          </button>
        </Tooltip>
      </motion.li>
    </AnimatePresence>
  );
}
