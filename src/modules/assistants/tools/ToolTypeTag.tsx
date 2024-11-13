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

import { ToolType } from '@/app/api/threads-runs/types';
import { isExternalTool } from '@/modules/tools/utils';
import { Tag, Tooltip } from '@carbon/react';
import classes from './ToolTypeTag.module.scss';

export function ToolTypeTag({
  type,
  id,
  showTooltip,
}: {
  type: ToolType;
  id: string;
  showTooltip?: boolean;
}) {
  const label = {
    code_interpreter: 'Code execution',
    file_search: 'File handling',
    function: null,
    user: 'Custom tool',
    system: id === 'read_file' ? 'File handling' : 'Public API',
  }[type];

  const content = (
    <Tag
      size="sm"
      type={type === 'system' && id !== 'read_file' ? 'blue' : 'outline'}
      className={classes.root}
    >
      {label}
    </Tag>
  );

  return label ? (
    showTooltip && isExternalTool(type, id) ? (
      <Tooltip
        align="right"
        label="Third-party tools may share your data with external services."
      >
        {content}
      </Tooltip>
    ) : (
      content
    )
  ) : null;
}
