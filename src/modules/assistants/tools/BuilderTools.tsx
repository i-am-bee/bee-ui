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

import { ToolResult } from '@/app/api/tools/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { useFormContext } from 'react-hook-form';
import { AssistantFormValues } from '../builder/AssistantBuilderProvider';
import classes from './BuilderTools.module.scss';
import { ToolsSelector } from './ToolsSelector';
import { BuilderSectionHeading } from '../builder/BuilderSectionHeading';

export function BuilderTools() {
  const { openModal } = useModal();
  const { project, organization, isProjectReadOnly } = useAppContext();

  const { setValue, getValues } = useFormContext<AssistantFormValues>();

  const handleUserToolCreateSuccess = (tool: ToolResult) => {
    const selectedTools = getValues('tools');

    setValue('tools', [...selectedTools, { id: tool.id, type: 'user' }], {
      shouldDirty: true,
    });
  };

  return (
    <div className={classes.root}>
      <BuilderSectionHeading
        title="Tools"
        buttonProps={{
          children: 'New Tool',
          onClick: () =>
            openModal((props) => (
              <UserToolModal
                organization={organization}
                project={project}
                onCreateSuccess={handleUserToolCreateSuccess}
                {...props}
              />
            )),
          disabled: isProjectReadOnly,
        }}
      />
      <div className={classes.body}>
        <ToolsSelector />
      </div>
    </div>
  );
}
