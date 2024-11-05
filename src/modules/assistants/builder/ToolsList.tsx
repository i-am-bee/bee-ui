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

import { Tool, ToolResult } from '@/app/api/tools/types';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { ToolDisableModal } from '@/modules/tools/manage/ToolDisableModal';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { TOOLS_DEFAULT_PAGE_SIZE, toolsQuery } from '@/modules/tools/queries';
import { getToolReference } from '@/modules/tools/utils';
import { Button, InlineLoading } from '@carbon/react';
import { Add, WarningFilled } from '@carbon/react/icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useController, useFormContext, useFormState } from 'react-hook-form';
import { AssistantFormValues } from '../builder/AssistantBuilderProvider';
import classes from './ToolsList.module.scss';

export function ToolsList() {
  const { openModal } = useModal();
  const { project, isProjectReadOnly } = useAppContext();
  const { isSubmitting } = useFormState();

  const { setValue, getValues } = useFormContext<AssistantFormValues>();
  const {
    field: { onChange, value },
  } = useController<AssistantFormValues, 'tools'>({ name: 'tools' });

  const handleUserToolCreateSuccess = (tool: ToolResult) => {
    const selectedTools = getValues('tools');

    setValue('tools', [...selectedTools, { id: tool.id, type: 'user' }], {
      shouldDirty: true,
    });
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h2>Tools</h2>
        <Button
          kind="ghost"
          size="md"
          renderIcon={Add}
          onClick={() =>
            openModal((props) => (
              <UserToolModal
                project={project}
                onCreateSuccess={handleUserToolCreateSuccess}
                {...props}
              />
            ))
          }
          disabled={isProjectReadOnly}
        >
          New tool
        </Button>
      </div>
    </div>
  );
}
