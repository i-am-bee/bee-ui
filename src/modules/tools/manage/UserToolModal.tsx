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

import { Project } from '@/app/api/projects/types';
import { createTool, deleteTool, updateTool } from '@/app/api/tools';
import { Tool, ToolResult, ToolsCreateBody } from '@/app/api/tools/types';
import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import {
  Button,
  FormLabel,
  InlineLoading,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useId } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { readToolQuery, toolsQuery } from '../queries';
import classes from './UserToolModal.module.scss';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { Organization } from '@/app/api/organization/types';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

const EXAMPLE_SOURCE_CODE = `# The following code is just an example

import requests

def ip_info(ip: str) -> dict:
  """
  Get information about an IP address, such as location, company, and carrier name.
  
  :param ip: IP address in the 255.255.255.255 format
  :return: Information about the IP address
  """
  response = requests.get(f"https://ipinfo.io/{ip}/geo")
  response.raise_for_status()
  return response.json()`;

interface FormValues {
  name?: string;
  sourceCode: string;
}

interface Props extends ModalProps {
  tool?: Tool;
  onCreateSuccess?: (tool: ToolResult) => void;
  onSaveSuccess?: (tool: ToolResult) => void;
  onDeleteSuccess?: (tool: Tool) => void;
}

export function UserToolModal({
  tool,
  onCreateSuccess,
  onSaveSuccess,
  onDeleteSuccess,
  ...props
}: Props) {
  const { project, organization } = useProjectContext();
  const { onRequestClose } = props;
  const { openConfirmation } = useModal();
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();

  const editMode = tool != undefined;

  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      name: tool?.name || '',
      sourceCode: tool?.source_code || '',
    },
    mode: 'onChange',
  });

  useConfirmModalCloseOnDirty(isDirty, 'tool');

  const {
    mutateAsync: mutateSaveTool,
    isError: isSaveError,
    error: saveError,
  } = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ToolsCreateBody }) => {
      return id
        ? updateTool(organization.id, project.id, id, body)
        : createTool(organization.id, project.id, body);
    },
    onSuccess: (tool, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [toolsQuery(organization.id, project.id).queryKey.at(0)],
      });

      if (tool) {
        queryClient.invalidateQueries({
          queryKey: readToolQuery(organization.id, project.id, tool.id)
            .queryKey,
        });

        if (!id) {
          onCreateSuccess?.(tool);
        }

        onSaveSuccess?.(tool);
      }

      onRequestClose();
    },
    meta: {
      errorToast: {
        title: id ? 'Failed to update tool' : 'Failed to create a new tool',
      },
    },
  });

  const { mutateAsync: mutateDeleteTool, isPending: isDeletePending } =
    useMutation({
      mutationFn: (id: string) => deleteTool(organization.id, project.id, id),
      onSuccess: () => {
        tool && onDeleteSuccess?.(tool);
        onRequestClose();

        queryClient.invalidateQueries({
          queryKey: [toolsQuery(organization.id, project.id).queryKey.at(0)],
        });
      },
      meta: {
        errorToast: {
          title: 'Failed to delete tool',
          includeErrorMessage: true,
        },
      },
    });

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (data) => {
      await mutateSaveTool({ id: tool?.id, body: createSaveToolBody(data) });
    },
    [mutateSaveTool, tool?.id],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside className={classes.modal}>
      <ModalHeader>
        <h2>{editMode ? 'Edit custom tool' : 'Create a custom tool'}</h2>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SettingsFormGroup>
            <div className={classes.group}>
              <TextInput
                size="lg"
                id={`${id}:name`}
                labelText="Name of tool"
                placeholder="Type tool name"
                invalid={errors.name != null}
                {...register('name', {
                  required: true,
                })}
              />

              <p className={classes.helperText}>
                This is your tool’s display name, it can be a real name or
                pseudonym.
              </p>
            </div>

            <div className={classes.group}>
              <div className={classes.groupHeader}>
                <FormLabel id={`${id}:code`}>Python code</FormLabel>

                {/* <Link href="/" className={classes.link}>
                  <span>View documentation</span>
                  <ArrowUpRight />
                </Link> */}
              </div>

              <Controller
                name="sourceCode"
                control={control}
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <EditableSyntaxHighlighter
                    id={`${id}:code`}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={EXAMPLE_SOURCE_CODE}
                    required
                    invalid={errors.sourceCode != null}
                    rows={16}
                  />
                )}
              />

              <p className={classes.helperText}>
                Do not share any authentication token in your Python function.
                Exposing it can compromise any account.
              </p>
            </div>

            {isSaveError && (
              <InlineNotification
                className={classes.error}
                kind="error"
                title={saveError.message}
                lowContrast
                hideCloseButton
              />
            )}
          </SettingsFormGroup>
        </form>
      </ModalBody>

      <ModalFooter>
        <div className={classes.actions}>
          {editMode ? (
            <Button
              kind="danger--ghost"
              onClick={() =>
                openConfirmation({
                  title: 'Are you sure you want to delete the tool?',
                  body: tool.name,
                  primaryButtonText: 'Delete',
                  danger: true,
                  onSubmit: () => mutateDeleteTool(tool.id),
                })
              }
            >
              {isDeletePending ? (
                <InlineLoading description="Deleting..." />
              ) : (
                'Delete'
              )}
            </Button>
          ) : (
            <Button kind="ghost" onClick={() => onRequestCloseSafe()}>
              Cancel
            </Button>
          )}

          <Button
            kind="secondary"
            type="submit"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <InlineLoading
                description={editMode ? 'Saving...' : 'Creating...'}
              />
            ) : editMode ? (
              'Save edit'
            ) : (
              'Create tool'
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

function createSaveToolBody({ name, sourceCode }: FormValues): ToolsCreateBody {
  return {
    name,
    source_code: sourceCode,
  };
}

UserToolModal.View = function ViewUserToolModal({
  tool,
  ...props
}: {
  tool: Tool;
} & ModalProps) {
  const id = useId();
  return (
    <Modal {...props} className={classes.modal}>
      <ModalHeader>
        <h2>{tool.name}</h2>
      </ModalHeader>
      <ModalBody className={classes.viewContent}>
        <dl>
          <div>
            <dd>
              <FormLabel>Type</FormLabel>
            </dd>
            <dt>Python function</dt>
          </div>

          <div>
            <dd>
              <FormLabel>Description</FormLabel>
            </dd>
            <dt>{tool.description}</dt>
          </div>
        </dl>

        <EditableSyntaxHighlighter
          id={`${id}:code`}
          labelText="Python code"
          value={tool.source_code ?? ''}
          required
          readOnly
          rows={16}
        />
      </ModalBody>
    </Modal>
  );
};
