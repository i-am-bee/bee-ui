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
import { ToolDescription } from '@/modules/tools/ToolCard';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { getToolReferenceId } from '@/modules/tools/utils';
import { SkeletonIcon, SkeletonText, Toggle, ToggleProps } from '@carbon/react';
import { MouseEventHandler, useId } from 'react';
import classes from './ToolToggle.module.scss';
import { ToolTypeTag } from './ToolTypeTag';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';

interface Props extends Omit<ToggleProps, 'id' | 'size'> {
  tool: ToolReference;
  heading?: string;
  description?: string;
  showTypeTag?: boolean;
  toggled?: boolean;
  onToggle?: (toggled: boolean) => void;
  onEditClick?: MouseEventHandler<HTMLButtonElement>;
  organization: Organization;
  project: Project;
}

export function ToolToggle({
  tool,
  heading,
  description,
  showTypeTag,
  toggled,
  disabled,
  onToggle,
  onEditClick,
  organization,
  project,
  ...props
}: Props) {
  const id = useId();
  const toolType = tool.type;
  const { toolName, toolIcon: Icon } = useToolInfo({
    toolReference: tool,
    organization,
    project,
  });

  const toolId = getToolReferenceId(tool);

  return (
    <div className={classes.root}>
      <span className={classes.icon}>{Icon && <Icon />}</span>

      <div className={classes.header}>
        {heading ? (
          <h3 className={classes.heading}>{heading}</h3>
        ) : (
          <h3 className={classes.heading}>{toolName}</h3>
        )}

        {showTypeTag && (
          <ToolTypeTag type={tool.type} id={toolId} showTooltip />
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
