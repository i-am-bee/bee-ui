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

import { Tool } from '@/app/api/tools/types';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { ToolDisableModal } from '@/modules/tools/manage/ToolDisableModal';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { TOOLS_DEFAULT_PAGE_SIZE, toolsQuery } from '@/modules/tools/queries';
import { getToolReference } from '@/modules/tools/utils';
import { Button, InlineLoading } from '@carbon/react';
import { WarningFilled } from '@carbon/react/icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useController, useFormContext, useFormState } from 'react-hook-form';
import { AssistantFormValues } from '../builder/AssistantBuilderProvider';
import { ToolToggle } from './ToolToggle';
import classes from './ToolsList.module.scss';

interface Props {
  enableFetch: boolean;
}

export function ToolsList({ enableFetch }: Props) {
  const { openModal } = useModal();
  const { project, isProjectReadOnly } = useAppContext();
  const { isSubmitting } = useFormState();

  const {
    data,
    error,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    ...toolsQuery(project.id),
    enabled: enableFetch,
  });

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching,
    hasNextPage,
  });

  const { setValue, getValues } = useFormContext<AssistantFormValues>();
  const {
    field: { onChange, value },
  } = useController<AssistantFormValues, 'tools'>({ name: 'tools' });

  const handleToggle = (tool: Tool, toggled: boolean) => {
    const selectedTools = getValues('tools');
    tool?.type &&
      onChange(
        toggled
          ? [...selectedTools, { id: tool.id, type: tool.type }]
          : selectedTools.filter(
              ({ id, type }) => type !== tool.type || id !== tool.id,
            ),
      );
  };

  const onDeleteSuccess = useCallback(
    ({ type, id }: Tool) => {
      setValue(
        `tools`,
        getValues('tools').filter(
          (item) => item.type !== type || item.id !== id,
        ),
      );
    },
    [getValues, setValue],
  );

  return (
    <ul className={classes.tools}>
      {data?.tools?.map((tool) => (
        <li key={tool.id}>
          <ToolToggle
            tool={getToolReference(tool)}
            heading={tool.name}
            description={tool.uiMetadata.description_short || tool.description}
            disabled={isSubmitting || isProjectReadOnly}
            onToggle={(toggled) => {
              if (
                !toggled &&
                (tool.type === 'file_search' ||
                  tool.type === 'code_interpreter' ||
                  (tool.type === 'system' && tool.id === 'read_file'))
              ) {
                openModal((props) => (
                  <ToolDisableModal
                    {...props}
                    tool={tool}
                    onDisableClick={() => handleToggle(tool, toggled)}
                  />
                ));
              } else {
                handleToggle(tool, toggled);
              }
            }}
            toggled={value.some(
              ({ id, type }) => type === tool.type && id === tool.id,
            )}
            onEditClick={() =>
              openModal((props) => (
                <UserToolModal
                  {...props}
                  project={project}
                  tool={tool}
                  onDeleteSuccess={onDeleteSuccess}
                />
              ))
            }
            showTypeTag
          />
        </li>
      ))}

      {(isLoading || isFetchingNextPage) &&
        Array.from(
          // Prevent content jump on initial load with system tools
          // only, which will probably be the most common case
          {
            length: !data ? INITIAL_TOOLS_GUESS_SIZE : TOOLS_DEFAULT_PAGE_SIZE,
          },
          (_, i) => <ToolToggle.Skeleton key={i} />,
        )}

      {error != null && (
        <li className={classes.error}>
          <p className={classes.errorHeading}>
            <WarningFilled />
            <span>Failed to load tools</span>
          </p>
          <p>{error.message}</p>
          <Button
            kind="tertiary"
            size="sm"
            onClick={() => {
              fetchNextPage();
            }}
          >
            {isFetching ? (
              <InlineLoading description="Loading..." />
            ) : (
              'Try again'
            )}
          </Button>
        </li>
      )}

      {hasNextPage && (
        <li ref={fetchMoreAnchorRef} className={classes.anchor} />
      )}
    </ul>
  );
}

const INITIAL_TOOLS_GUESS_SIZE = 5;
