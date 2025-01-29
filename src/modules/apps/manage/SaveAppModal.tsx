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

import {
  ArtifactCreateBody,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import { encodeMetadata } from '@/app/api/utils';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useRoutes } from '@/routes';
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
import { useSaveArtifact } from '../api/mutations/useSaveArtifact';
import { AppIconName } from '../AppIcon';
import { AppIconSelector } from '../builder/AppIconSelector';
import { Artifact, ArtifactMetadata } from '../types';
import { extractAppMetadataFromStreamlitCode } from '../utils';
import classes from './SaveAppModal.module.scss';

export type AppFormValues = {
  name: string;
  icon?: AppIconName;
  description?: string;
};

interface Props extends ModalProps {
  artifact?: Artifact | null;
  messageId?: string;
  code?: string;
  isConfirmation?: boolean;
  onSaveSuccess?: (artifact: Artifact) => void;
  additionalMetadata?: Partial<ArtifactMetadata>;
}

export function SaveAppModal({
  artifact: artifactProp,
  messageId,
  code,
  isConfirmation,
  onSaveSuccess,
  additionalMetadata,
  ...props
}: Props) {
  const { routes, navigate } = useRoutes();
  const { onRequestClose } = props;
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();

  const isUpdating = !!artifactProp;

  const {
    mutateAsync: saveArtifact,
    isError: isSaveError,
    error: saveError,
  } = useSaveArtifact({
    onSuccess: (artifact) => {
      if (artifact) {
        if (isConfirmation) {
          navigate(routes.artifacts());
        } else {
          if (!isUpdating) {
            window.history.pushState(
              null,
              '',
              routes.artifactBuilder({ artifactId: artifact.id }),
            );
          }
        }

        onSaveSuccess?.(artifact);
      }

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
      : { ...extractAppMetadataFromStreamlitCode(code ?? ''), icon: 'Rocket' },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = formReturn;

  useConfirmModalCloseOnDirty(!isEmpty(dirtyFields), 'app');

  const onSubmit: SubmitHandler<AppFormValues> = useCallback(
    async (data) => {
      await saveArtifact(
        isUpdating
          ? {
              id: artifactProp.id,
              body: createUpdateArtifactBody({
                formValues: data,
                artifact: artifactProp,
                messageId: messageId ?? '',
                code: code ?? '',
                additionalMetadata,
              }),
            }
          : {
              body: createNewArtifactBody({
                formValues: data,
                messageId: messageId ?? '',
                code: code ?? '',
                additionalMetadata,
              }),
            },
      );
    },
    [
      isUpdating,
      additionalMetadata,
      artifactProp,
      messageId,
      code,
      saveArtifact,
    ],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside className={classes.root}>
      <ModalHeader>
        <h2>
          {isConfirmation
            ? 'Unsaved changes'
            : artifactProp
              ? 'Edit app'
              : 'Save'}
        </h2>
        {isConfirmation && (
          <p>Progress will be lost if you do not save your app</p>
        )}
      </ModalHeader>
      <ModalBody>
        {(!isConfirmation || !artifactProp) && (
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
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          kind="ghost"
          onClick={() => {
            if (isConfirmation) {
              navigate(routes.artifacts());
            }

            onRequestCloseSafe();
          }}
        >
          {isConfirmation ? 'Discard changes' : 'Cancel'}
        </Button>

        <Button
          kind="secondary"
          type="submit"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? (
            <InlineLoading description="Saving..." />
          ) : !artifactProp ? (
            'Save to apps'
          ) : (
            'Save'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function createNewArtifactBody({
  formValues: { name, description, icon },
  messageId,
  code,
  additionalMetadata,
}: {
  formValues: AppFormValues;
  messageId: string;
  code: string;
  additionalMetadata?: Partial<ArtifactMetadata>;
}): ArtifactCreateBody {
  return {
    name,
    description,
    message_id: messageId,
    source_code: code,
    type: 'app',
    metadata: encodeMetadata<ArtifactMetadata>({
      ...additionalMetadata,
      icon,
    }),
  };
}

function createUpdateArtifactBody({
  formValues: { name, description, icon },
  artifact,
  messageId,
  code,
  additionalMetadata,
}: {
  formValues: AppFormValues;
  artifact: Artifact;
  messageId: string;
  code: string;
  additionalMetadata?: Partial<ArtifactMetadata>;
}): ArtifactUpdateBody {
  return {
    name,
    description,
    message_id: messageId,
    source_code: code,
    shared: Boolean(artifact.share_url),
    metadata: encodeMetadata<ArtifactMetadata>({
      ...additionalMetadata,
      icon,
    }),
  };
}
