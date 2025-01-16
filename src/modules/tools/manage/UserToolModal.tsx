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

import { createTool, deleteTool, updateTool } from '@/app/api/tools';
import { Tool, ToolResult, ToolsCreateBody } from '@/app/api/tools/types';
import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import {
  Button,
  Dropdown,
  FormLabel,
  InlineLoading,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PasswordInput,
  RadioButton,
  RadioButtonGroup,
  TextInput,
} from '@carbon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useId } from 'react';
import {
  Control,
  Controller,
  FormProvider,
  SubmitHandler,
  useController,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { readToolQuery, toolsQuery } from '../queries';
import classes from './UserToolModal.module.scss';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ToolDescription } from '../ToolCard';

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

const TOOL_TYPES = [
  { key: 'function' as const, label: 'Python function' },
  { key: 'api' as const, label: 'API calling' },
];
type ToolType = (typeof TOOL_TYPES)[number];
type ToolTypeKey = ToolType['key'];

const API_AUTH_METHODS = [
  { key: 'none' as const, label: 'None' },
  { key: 'api-key' as const, label: 'API key' },
];
type ApiAuthMethod = (typeof API_AUTH_METHODS)[number];

interface FormValues {
  type: ToolType;
  name?: string;
  sourceCode?: string;
  api: {
    schema?: string;
    auth?: ApiAuthMethod['key'];
    apiKey?: string;
  };
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
  const { project, organization, featureFlags } = useAppContext();
  const { onRequestClose } = props;
  const { openConfirmation } = useModal();
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();

  const editMode = tool != undefined;

  const queryClient = useQueryClient();

  const formReturn = useForm<FormValues>({
    defaultValues: {
      type:
        TOOL_TYPES.find(({ key }) =>
          tool?.open_api_schema ? key === 'api' : key === 'function',
        ) ?? TOOL_TYPES[0],
      name: tool?.name || '',
      sourceCode: tool?.source_code || '',
      api: { auth: 'none', schema: tool?.open_api_schema ?? '' },
    },
    mode: 'onChange',
  });
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = formReturn;

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
        queryKey: [
          toolsQuery(
            organization.id,
            project.id,
            featureFlags.Knowledge,
          ).queryKey.at(0),
        ],
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
          queryKey: [
            toolsQuery(
              organization.id,
              project.id,
              featureFlags.Knowledge,
            ).queryKey.at(0),
          ],
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
      await mutateSaveTool({
        id: tool?.id,
        body: createSaveToolBody(data, tool),
      });
    },
    [mutateSaveTool, tool],
  );

  const toolType = watch('type');

  return (
    <Modal {...props} preventCloseOnClickOutside className={classes.modal}>
      <ModalHeader>
        <h2>{editMode ? 'Edit custom tool' : 'Create a custom tool'}</h2>
      </ModalHeader>
      <ModalBody>
        <FormProvider {...formReturn}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SettingsFormGroup>
              <div className={classes.group}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value, name } }) => (
                    <Dropdown
                      label="Type"
                      id={`${id}:${name}`}
                      items={TOOL_TYPES}
                      selectedItem={value}
                      titleText="Type"
                      // size="lg"
                      onChange={({
                        selectedItem,
                      }: {
                        selectedItem?: ToolType | null;
                      }) => onChange(selectedItem ?? null)}
                      itemToString={(item) => item?.label ?? ''}
                    />
                  )}
                />
              </div>

              {(tool || toolType.key === 'function') && (
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
              )}

              {toolType.key === 'api' ? (
                <>
                  {/* TODO: make available for update too, when the API is ready */}
                  {!tool && <ApiAuthenticationMethod />}

                  <div className={classes.group}>
                    <Controller
                      name="api.schema"
                      control={control}
                      rules={{
                        required: true,
                      }}
                      render={({ field }) => (
                        <>
                          <div className={classes.groupHeader}>
                            <FormLabel id={`${id}:${field.name}`}>
                              OpenAPI spec
                            </FormLabel>
                          </div>
                          <EditableSyntaxHighlighter
                            id={`${id}:${field.name}`}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Enter your OpenAPI schema here"
                            required
                            invalid={errors.api?.schema != null}
                            rows={16}
                            className={classes.apiSchemaField}
                          />
                        </>
                      )}
                    />
                  </div>
                </>
              ) : (
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
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder={EXAMPLE_SOURCE_CODE}
                        required
                        invalid={errors.sourceCode != null}
                        rows={16}
                      />
                    )}
                  />

                  <p className={classes.helperText}>
                    Do not share any authentication token in your Python
                    function. Exposing it can compromise any account.
                  </p>
                </div>
              )}

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
        </FormProvider>
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

function ApiAuthenticationMethod() {
  const id = useId();
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();
  const {
    field: { name, onChange, value },
  } = useController<FormValues, 'api.auth'>({ name: 'api.auth' });

  return (
    <>
      <div className={classes.group}>
        <RadioButtonGroup
          legendText="Authentication"
          name={name}
          onChange={onChange}
          valueSelected={value}
        >
          {API_AUTH_METHODS.map(({ key, label }) => (
            <RadioButton key={key} labelText={label} value={key} />
          ))}
        </RadioButtonGroup>
      </div>
      {value === 'api-key' && (
        <div className={classes.group}>
          <PasswordInput
            size="lg"
            id={`${id}:name`}
            labelText=""
            placeholder="Add your API key"
            invalid={errors.name != null}
            {...register('api.apiKey', {
              required: true,
            })}
          />
        </div>
      )}
    </>
  );
}

UserToolModal.View = function ViewUserToolModal({
  tool,
  ...props
}: {
  tool: Tool;
} & ModalProps) {
  const id = useId();

  const type: ToolTypeKey = tool.open_api_schema ? 'api' : 'function';

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
            <dt>{type === 'api' ? 'API calling' : 'Python function'}</dt>
          </div>

          <div>
            <dd>
              <FormLabel>Description</FormLabel>
            </dd>
            <dt>
              <ToolDescription description={tool.description} />
            </dt>
          </div>
        </dl>

        <EditableSyntaxHighlighter
          id={`${id}:code`}
          labelText={type === 'api' ? 'OpenAPI spec' : 'Python code'}
          value={
            (type === 'api' ? tool.open_api_schema : tool.source_code) ?? ''
          }
          required
          readOnly
          rows={16}
          className={type === 'api' ? classes.apiSchemaField : undefined}
        />
      </ModalBody>
    </Modal>
  );
};

function createSaveToolBody(
  { type, name, sourceCode, api }: FormValues,
  tool?: Tool,
): ToolsCreateBody {
  return type.key === 'function'
    ? {
        name,
        source_code: sourceCode ?? '',
      }
    : {
        ...(tool
          ? { name }
          : { api_key: api.auth === 'api-key' ? api.apiKey : undefined }),
        open_api_schema: api.schema ?? '',
      };
}
