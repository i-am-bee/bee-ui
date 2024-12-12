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
import {
  getStaticToolName,
  useToolInfo,
} from '@/modules/tools/hooks/useToolInfo';
import classes from './ToolNameWithTooltip.module.scss';
import { ToolInfoButton } from './ToolInfoButton';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  toolReference: ToolReference;
}

export function ToolNameWithTooltip({ toolReference }: Props) {
  const { project, organization } = useProjectContext();
  const { toolName } = useToolInfo({ toolReference, project, organization });

  return (
    <span className={classes.root}>
      {toolName}
      <ToolInfoButton toolReference={toolReference} />
    </span>
  );
}
