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

import { SkeletonText } from '@carbon/react';
import classes from './ToolName.module.scss';
import { ToolReference } from '@/app/api/tools/types';
import { useToolInfo } from '../hooks/useToolInfo';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';

interface Props {
  tool: ToolReference;
  organization: Organization;
  project: Project;
}

export function ToolName({ tool, organization, project }: Props) {
  const { toolName } = useToolInfo({
    organization,
    project,
    toolReference: tool,
  });
  return toolName;
}

ToolName.Skeleton = function Skeleton() {
  return (
    <SkeletonText
      width={LOADING_TOOL_NAME_WIDTH}
      className={classes.skeleton}
    />
  );
};

const LOADING_TOOL_NAME_WIDTH = '5rem';
