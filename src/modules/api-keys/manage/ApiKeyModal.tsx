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

import { ApiKey } from '@/app/api/api-keys/types';
import { Project } from '@/app/api/projects/types';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { TextWithCopyButton } from '@/components/TextWithCopyButton/TextWithCopyButton';
import { useOnMount } from '@/hooks/useOnMount';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import { useListAllProjects } from '@/modules/projects/api/queries/useListAllProjects';
import { ProjectWithScope } from '@/modules/projects/types';
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
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useCreateApiKey } from '../api/mutations/useCreateApiKey';
import { useDeleteApiKey } from '../api/mutations/useDeleteApiKey';
import { useRegenerateApiKey } from '../api/mutations/useRegenerateApiKey';
import classes from './ApiKeyModal.module.scss';

interface FormValues {
  name: string;
  project: ProjectWithScope;
}

interface Props extends ModalProps {
  onSuccess?: () => void;
}

export function ApiKeyModal({ onSuccess, ...props }: Props) {
  const { onRequestClose } = props;
  const id = useId();
  const { openModal } = useModal();

  const { project } = useAppContext();

  const { projects, isLoading } = useListAllProjects({ withRole: true });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      project,
    },
    mode: 'onChange',
  });

  const { mutateAsync: createApiKey } = useCreateApiKey({
    onSuccess: (apiKey) => {
      if (apiKey) {
        onRequestClose();
        openModal((props) => <ApiKeyModal.View apiKey={apiKey} {...props} />);
      }
    },
  });

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      await createApiKey(values);
    },
    [createApiKey],
  );

  return (
    <Modal
      {...props}
      size="sm"
      preventCloseOnClickOutside
      className={clsx(classes.modal, classes.modalCreate)}
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
              {...register('name', { required: true })}
            />

            {isLoading ? (
              <DropdownSkeleton />
            ) : (
              <Controller
                name="project"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <ComboBox
                    id={`${id}:project`}
                    items={projects ?? []}
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

ApiKeyModal.Regenerate = function RegenerateModal({
  apiKey,
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  const { openModal } = useModal();

  const { mutate: regenerateApiKey } = useRegenerateApiKey({
    onSuccess: (apiKey) => {
      if (apiKey) {
        openModal((props) => <ApiKeyModal.View apiKey={apiKey} {...props} />);
      }
      props.onRequestClose();
    },
  });

  useOnMount(() => regenerateApiKey(apiKey));

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
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  return (
    <Modal
      {...props}
      size="sm"
      className={clsx(classes.modal, classes.modalView)}
    >
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
        <ApiKeyDetail apiKey={apiKey} isSecretVisible />
      </ModalBody>
    </Modal>
  );
};

ApiKeyModal.Delete = function DeleteModal({
  apiKey,
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  const { mutate: deleteApiKey, isPending } = useDeleteApiKey({
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
      <ModalBody className={classes.viewContent}>
        <ApiKeyDetail apiKey={apiKey} />
      </ModalBody>
      <ModalFooter>
        <Button kind="ghost" onClick={() => props.onRequestClose()}>
          Cancel
        </Button>

        <Button
          kind="danger"
          type="submit"
          disabled={isPending}
          onClick={() => deleteApiKey(apiKey)}
        >
          {isPending ? <InlineLoading title="Deleting..." /> : 'Delete key'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

function ApiKeyDetail({
  apiKey,
  isSecretVisible,
}: {
  apiKey: ApiKey;
  isSecretVisible?: boolean;
}) {
  const { name, project, secret } = apiKey;
  return (
    <div className={classes.viewContent}>
      <dl>
        <div>
          <dd>
            <FormLabel>Name</FormLabel>
          </dd>
          <dt>{name}</dt>
        </div>
        <div>
          <dd>
            <FormLabel>Workspace</FormLabel>
          </dd>
          <dt>{project.name}</dt>
        </div>
      </dl>
      {isSecretVisible ? (
        <TextWithCopyButton text={secret} isCode>
          {secret}
        </TextWithCopyButton>
      ) : (
        <code className={classes.secret}>{secret}</code>
      )}
    </div>
  );
}
