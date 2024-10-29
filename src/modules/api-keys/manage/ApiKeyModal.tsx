import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps } from '@/layout/providers/ModalProvider';
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
import { useCallback, useEffect, useId, useMemo } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import classes from './ApiKeyModal.module.scss';
import { Project } from '@/app/api/projects/types';
import { ApiKey, ApiKeysCreateBody } from '@/app/api/api-keys/types';
import { apiKeysQuery } from '../queries';
import { createApiKey } from '@/app/api/api-keys';
import { useProjects } from '@/modules/projects/hooks/useProjects';

interface FormValues {
  name: string;
  project?: Project;
}

interface Props extends ModalProps {
  project: Project;
  onSuccess?: () => void;
}

export function ApiKeyModal({ project, onSuccess, ...props }: Props) {
  const { onRequestClose } = props;
  const id = useId();

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
    mutationFn: (body: ApiKeysCreateBody) => createApiKey(project.id, body),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [apiKeysQuery(project.id).queryKey.at(0)],
      });

      onRequestClose();
    },
    meta: {
      errorToast: {
        title: 'Failed to create API key',
        includeErrorMessage: true,
      },
    },
  });

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async ({ name }) => {
      await mutateSaveTool({ name });
    },
    [mutateSaveTool],
  );

  return (
    <Modal
      {...props}
      size="md"
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

ApiKeyModal.Delete = function ViewModal({
  apiKey,
  ...props
}: {
  apiKey: ApiKey;
} & ModalProps) {
  const id = useId();
  return (
    <Modal {...props} size="lg" className={classes.modal}>
      <ModalHeader>
        <h2>Delete API key</h2>
      </ModalHeader>
      <ModalBody className={classes.viewContent}>
        <p>
          Once deleted, All API requests using this key will be rejected,
          causing any dependent systems to break. This key will be permanently
          removed and can&apos;t be recovered or modified.
        </p>
        <dl>
          <div>
            <dd>
              <FormLabel>Name</FormLabel>
            </dd>
            <dt>{apiKey.name}</dt>
          </div>
        </dl>
      </ModalBody>
    </Modal>
  );
};
