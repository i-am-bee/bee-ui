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

import { ToolReference } from '@/app/api/tools/types';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { LinkButton } from '@/components/LinkButton/LinkButton';
import { useAppContext } from '@/layout/providers/AppProvider';
import { getToolReferenceId, isExternalTool } from '@/modules/tools/utils';
import {
  SkeletonIcon,
  SkeletonText,
  Tag,
  Toggle,
  ToggleProps,
  Tooltip,
} from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import { MouseEventHandler, useId } from 'react';
import classes from './ToolToggle.module.scss';
import { ToolDescription } from '@/modules/tools/ToolCard';
import { readToolQuery } from '@/modules/tools/queries';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';

interface Props extends Omit<ToggleProps, 'id' | 'size'> {
  tool: ToolReference;
  heading?: string;
  description?: string;
  showWarning?: boolean;
  toggled?: boolean;
  onToggle?: (toggled: boolean) => void;
  onEditClick?: MouseEventHandler<HTMLButtonElement>;
}

export function ToolToggle({
  tool,
  heading,
  description,
  showWarning,
  toggled,
  disabled,
  onToggle,
  onEditClick,
  ...props
}: Props) {
  const id = useId();
  const toolType = tool.type;
  const { toolName, toolIcon: Icon } = useToolInfo(tool);

  return (
    <div className={classes.root}>
      <span className={classes.icon}>{Icon && <Icon />}</span>

      <div className={classes.header}>
        {heading ? (
          <h3 className={classes.heading}>{heading}</h3>
        ) : (
          <h3 className={classes.heading}>{toolName}</h3>
        )}

        {showWarning && isExternalTool(tool.type, getToolReferenceId(tool)) && (
          <Tooltip
            align="right"
            label="Third-party tools may share your data with external services."
          >
            <ToolExternalTag />
          </Tooltip>
        )}

        {toolType === 'user' && onEditClick && (
          <LinkButton onClick={onEditClick} disabled={disabled}>
            Edit
          </LinkButton>
        )}
      </div>

      <Toggle
        {...props}
        toggled={toggled}
        id={id}
        className={classes.toggle}
        size="sm"
        onToggle={onToggle}
        disabled={!toolType || disabled}
      />
      {description && (
        <LineClampText
          className={classes.description}
          numberOfLines={2}
          as="div"
        >
          <ToolDescription description={description} />
        </LineClampText>
      )}
    </div>
  );
}

ToolToggle.Skeleton = function Skeleton() {
  return (
    <div className={classes.root}>
      <span className={classes.icon}>
        <SkeletonIcon />
      </span>

      <SkeletonText className={classes.heading} />

      <SkeletonText className={classes.toggle} width="" />

      <SkeletonText className={classes.description} />
    </div>
  );
};

export function ToolExternalTag() {
  return (
    <Tag size="sm" type="blue" className={classes.tag}>
      Public API
    </Tag>
  );
}
