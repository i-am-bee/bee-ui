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
import { useCallback, useId } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { ArtifactCreateBody, ArtifactResult } from '@/app/api/artifacts/types';
import isEmpty from 'lodash/isEmpty';
import { useCreateArtifact } from '../hooks/useCreateArtifact';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { Organization } from '@/app/api/organization/types';

interface FormValues {
  icon: string;
  name: string;
  description?: string;
}

interface Props extends ModalProps {
  project: Project;
  organization: Organization;
  messageId?: string;
  code?: string;
  onSaveSuccess?: (artifact: ArtifactResult) => void;
}

export function CreateAppModal({
  project,
  organization,
  messageId,
  code,
  onSaveSuccess,
  ...props
}: Props) {
  const { onRequestClose } = props;
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();

  const {
    mutateAsync: mutateSave,
    isError: isSaveError,
    error: saveError,
  } = useCreateArtifact({
    project,
    organization,
    onSaveSuccess: (artifact) => {
      onRequestClose();
      onSaveSuccess?.(artifact);
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  useConfirmModalCloseOnDirty(!isEmpty(dirtyFields), 'app');

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (data) => {
      await mutateSave(
        createNewArtifactBody(data, messageId ?? '', code ?? ''),
      );
    },
    [code, messageId, mutateSave],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside>
      <ModalHeader>
        <h2>Save</h2>
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

function createNewArtifactBody(
  { name, description }: FormValues,
  messageId: string,
  code: string,
): ArtifactCreateBody {
  return {
    name,
    description,
    message_id: messageId,
    source_code: code,
    type: 'app',
  };
}
