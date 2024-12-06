import {
  ArtifactCreateBody,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import { Project } from '@/app/api/projects/types';
import { decodeEntityWithMetadata, encodeMetadata } from '@/app/api/utils';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useLayoutActions } from '@/store/layout';
import {
  Button,
  InlineLoading,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
} from '@carbon/react';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useId } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { AppIconName } from '../AppIcon';
import { AppIconSelector } from '../builder/AppIconSelector';
import { useSaveArtifact } from '../hooks/useSaveArtifact';
import { Artifact, ArtifactMetadata } from '../types';
import { extractAppNameFromStliteCode } from '../utils';

export type AppFormValues = {
  name: string;
  icon?: AppIconName;
  description?: string;
};

interface Props extends ModalProps {
  project: Project;
  artifact?: Artifact | null;
  messageId?: string;
  code?: string;
  onSaveSuccess?: (artifact: Artifact) => void;
}

export function SaveAppModal({
  project,
  artifact: artifactProp,
  messageId,
  code,
  onSaveSuccess,
  ...props
}: Props) {
  const { onRequestClose } = props;
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();
  const { setLayout } = useLayoutActions();
  const isUpdating = !!artifactProp;

  const {
    mutateAsync: mutateSave,
    isError: isSaveError,
    error: saveError,
  } = useSaveArtifact({
    project,
    onSuccess: (result) => {
      const artifact = decodeEntityWithMetadata<Artifact>(result);

      setLayout({
        navbarProps: {
          type: 'app-builder',
          artifact,
        },
      });

      if (!isUpdating) {
        window.history.pushState(
          null,
          '',
          `/${project.id}/apps/builder/a/${artifact.id}`,
        );
      }

      onSaveSuccess?.(artifact);
      onRequestClose();
    },
  });

  const formReturn = useForm<AppFormValues>({
    defaultValues: isUpdating
      ? {
          name: artifactProp.name || '',
          description: artifactProp.description || '',
          icon: artifactProp.uiMetadata.icon,
        }
      : { name: extractAppNameFromStliteCode(code ?? '') },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = formReturn;

  useConfirmModalCloseOnDirty(!isEmpty(dirtyFields), 'app');

  console.log(messageId);

  const onSubmit: SubmitHandler<AppFormValues> = useCallback(
    async (data) => {
      await mutateSave(
        isUpdating
          ? {
              id: artifactProp.id,
              body: createUpdateArtifactBody({
                formValues: data,
                artifact: artifactProp,
                messageId: messageId ?? '',
                code: code ?? '',
              }),
            }
          : {
              body: createNewArtifactBody({
                formValues: data,
                messageId: messageId ?? '',
                code: code ?? '',
              }),
            },
      );
    },
    [isUpdating, artifactProp, messageId, code, mutateSave],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside>
      <ModalHeader>
        <h2>{artifactProp ? 'Edit app' : 'Save'}</h2>
      </ModalHeader>
      <ModalBody>
        <FormProvider {...formReturn}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SettingsFormGroup>
              <AppIconSelector />

              <div>
                <TextInput
                  size="lg"
                  id={`${id}:name`}
                  labelText="Name"
                  placeholder="Name your app"
                  invalid={errors.name != null}
                  {...register('name', {
                    required: true,
                  })}
                />
              </div>

              <div>
                <TextArea
                  id={`${id}:description`}
                  labelText="Description"
                  placeholder="Describe your app"
                  invalid={errors.description != null}
                  {...register('description')}
                />
              </div>

              {isSaveError && (
                <InlineNotification
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
        <Button kind="ghost" onClick={() => onRequestCloseSafe()}>
          Cancel
        </Button>

        <Button
          kind="secondary"
          type="submit"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? <InlineLoading description="Saving..." /> : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function createNewArtifactBody({
  formValues: { name, description, icon },
  messageId,
  code,
}: {
  formValues: AppFormValues;
  messageId: string;
  code: string;
}): ArtifactCreateBody {
  return {
    name,
    description,
    message_id: messageId,
    source_code: code,
    type: 'app',
    metadata: encodeMetadata<ArtifactMetadata>({
      icon,
    }),
  };
}

function createUpdateArtifactBody({
  formValues: { name, description, icon },
  artifact,
  messageId,
  code,
}: {
  formValues: AppFormValues;
  artifact: Artifact;
  messageId: string;
  code: string;
}): ArtifactUpdateBody {
  return {
    name,
    description,
    message_id: messageId,
    source_code: code,
    shared: Boolean(artifact.share_url),
    metadata: encodeMetadata<ArtifactMetadata>({
      icon,
    }),
  };
}
