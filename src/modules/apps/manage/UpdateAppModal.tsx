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
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps } from '@/layout/providers/ModalProvider';
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
import { useCallback, useEffect, useId } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { Artifact } from '../types';
import { ArtifactResult, ArtifactUpdateBody } from '@/app/api/artifacts/types';
import isEmpty from 'lodash/isEmpty';
import { useUpdateArtifact } from '../hooks/useUpdateArtifact';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';

interface FormValues {
  icon: string;
  name: string;
  description?: string;
}

interface Props extends ModalProps {
  artifact: Artifact;
  project: Project;
  onSaveSuccess?: (artifact: ArtifactResult) => void;
}

export function UpdateAppModal({
  artifact,
  project,
  onSaveSuccess,
  ...props
}: Props) {
  const { onRequestClose } = props;
  const id = useId();
  const {
    setConfirmOnRequestClose,
    clearConfirmOnRequestClose,
    onRequestCloseSafe,
  } = useModalControl();

  const {
    mutateAsync: mutateSave,
    isError: isSaveError,
    error: saveError,
  } = useUpdateArtifact({
    project,
    artifact,
    onSaveSuccess: (artifact) => {
      onRequestClose();
      onSaveSuccess?.(artifact);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    defaultValues: {
      name: artifact?.name || '',
      description: artifact?.description || '',
    },
    mode: 'onChange',
  });

  useConfirmModalCloseOnDirty(!isEmpty(dirtyFields), 'app');

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (data) => {
      await mutateSave(createUpdateArtifactBody(artifact, data));
    },
    [artifact, mutateSave],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside>
      <ModalHeader>
        <h2>Edit app</h2>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SettingsFormGroup>
            {/* TODO: icon */}

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

function createUpdateArtifactBody(
  artifact: Artifact,
  { name, description }: FormValues,
): ArtifactUpdateBody {
  return {
    name,
    description,
    shared: Boolean(artifact.share_url),
  };
}
