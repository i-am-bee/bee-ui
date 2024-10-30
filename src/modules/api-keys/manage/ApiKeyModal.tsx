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

import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import {
  Button,
  ComboBox,
  DropdownSkeleton,
  FormLabel,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import classes from './ApiKeyModal.module.scss';
import { Project } from '@/app/api/projects/types';
import { ApiKey, ApiKeysCreateBody } from '@/app/api/api-keys/types';
import { apiKeysQuery } from '../api/queries';
import { createApiKey, deleteApiKey } from '@/app/api/api-keys';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { TextWithCopyButton } from '@/components/TextWithCopyButton/TextWithCopyButton';
import { useDeleteApiKey } from '../api/useDeleteApiKey';

interface FormValues {
  name: string;
  project: Project;
}

interface Props extends ModalProps {
  project: Project;
  onSuccess?: () => void;
}

export function ApiKeyModal({ project, onSuccess, ...props }: Props) {
  const { onRequestClose } = props;
  const id = useId();
  // const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const { openModal } = useModal();

  const queryClient = useQueryClient();

  const { projects, isLoading, isFetching, hasNextPage, fetchNextPage } =
    useProjects({ withRole: true });

  useEffect(() => {
    if (!isFetching && hasNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const editableProjects = useMemo(
    () => projects?.filter(({ readOnly }) => !readOnly),
    [projects],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const { mutateAsync: mutateSaveTool } = useMutation({
    mutationFn: ({ project, ...body }: FormValues) =>
      createApiKey(project.id, body),
    onSuccess: (result, { project }) => {
      queryClient.invalidateQueries({
        queryKey: [apiKeysQuery(project.id).queryKey.at(0)],
      });

      if (result) {
        onRequestClose();
        openModal((props) => (
          <ApiKeyModal.View apiKey={result} project={project} {...props} />
        ));
      }
    },
    meta: {
      errorToast: {
        title: 'Failed to create API key',
        includeErrorMessage: true,
      },
    },
  });

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      await mutateSaveTool(values);
    },
    [mutateSaveTool],
  );

  return (
    <Modal
      {...props}
      size="sm"
      preventCloseOnClickOutside
      className={classes.modal}
    >
      <ModalHeader>
        <h2>Create a new API key</h2>
        <p className={classes.subheading}>Name your API key to generate</p>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SettingsFormGroup>
            <TextInput
              size="lg"
              id={`${id}:name`}
              labelText="Name"
              invalid={errors.name != null}
              {...register('name')}
            />

            {isLoading ? (
              <DropdownSkeleton />
            ) : (
              <Controller
                name="project"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value, ref } }) => (
                  <ComboBox
                    id={`${id}:project`}
                    items={editableProjects ?? []}
                    selectedItem={value}
                    titleText="Workspace"
                    placeholder="Choose an option"
                    size="lg"
                    onChange={({
                      selectedItem,
                    }: {
                      selectedItem?: Project | null;
                    }) => onChange(selectedItem ?? null)}
                    itemToString={(item) => item?.name ?? ''}
                  />
                )}
              />
            )}
          </SettingsFormGroup>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => onRequestClose()}>
          Cancel
        </Button>

        <Button
          kind="secondary"
          type="submit"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? (
            <InlineLoading description="Generating..." />
          ) : (
            'Generate key'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

ApiKeyModal.Regenerate = function ViewModal({
  apiKey,
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  const {} = useMutation({
    mutationFn: async () => {
      // TODO:
      // await createApiKey(project.id, { name: apiKey.name });
      // await deleteApiKey(apiKey)
    },
  });

  return (
    <Modal {...props} size="sm">
      <ModalHeader>
        <h2>Regenerating {apiKey.name}</h2>
      </ModalHeader>
      <ModalBody>
        <InlineLoading description="Regenerating key" />
      </ModalBody>
    </Modal>
  );
};

ApiKeyModal.View = function ViewModal({
  apiKey,
  project,
  ...props
}: {
  apiKey: ApiKey;
  project: Project;
} & ModalProps) {
  return (
    <Modal {...props} size="sm" className={classes.modal}>
      <ModalHeader>
        <h2>Save your key</h2>
        <p>
          You&apos;ve got your API key! Please save it in a safe and accessible
          spot - for security reasons, we won&apos;t be able to show it to you
          again. If you misplace it, don&apos;t worry, you can always generate a
          new one.
        </p>
      </ModalHeader>
      <ModalBody>
        <ApiKeyDetail apiKey={apiKey} project={project} isSecretVisible />
      </ModalBody>
    </Modal>
  );
};

ApiKeyModal.Delete = function ViewModal({
  apiKey,
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  const { mutate } = useDeleteApiKey({
    onSuccess: () => props.onRequestClose(),
  });

  return (
    <Modal {...props} size="sm" className={classes.modal}>
      <ModalHeader>
        <h2>Delete API key</h2>
        <p>
          Once deleted, All API requests using this key will be rejected,
          causing any dependent systems to break. This key will be permanently
          removed and can&apos;t be recovered or modified.
        </p>
      </ModalHeader>
      <ModalBody>
        <ApiKeyDetail apiKey={apiKey} project={apiKey.project} />
      </ModalBody>
      <ModalFooter>
        <Button kind="ghost" onClick={() => props.onRequestClose()}>
          Cancel
        </Button>

        <Button
          kind="danger"
          type="submit"
          onClick={() =>
            mutate({ id: apiKey.id, projectId: apiKey.project.id })
          }
        >
          Delete key
        </Button>
      </ModalFooter>
    </Modal>
  );
};

function ApiKeyDetail({
  apiKey,
  project,
  isSecretVisible,
}: {
  apiKey: ApiKey;
  project: Project;
  isSecretVisible?: boolean;
}) {
  return (
    <div className={classes.viewContent}>
      <dl>
        <div>
          <dd>
            <FormLabel>Name</FormLabel>
          </dd>
          <dt>{apiKey.name}</dt>
        </div>
        <div>
          <dd>
            <FormLabel>Workspace</FormLabel>
          </dd>
          <dt>{project.name}</dt>
        </div>
      </dl>
      {isSecretVisible ? (
        <TextWithCopyButton text={apiKey.secret} isCode>
          {apiKey.secret}
        </TextWithCopyButton>
      ) : (
        <code>{apiKey.secret}</code>
      )}
    </div>
  );
}
