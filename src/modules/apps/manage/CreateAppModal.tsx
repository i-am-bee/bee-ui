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
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
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
import {
  ArtifactCreateBody,
  ArtifactResult,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import isEmpty from 'lodash/isEmpty';
import { useCreateArtifact } from '../hooks/useCreateArtifact';
import { useConfirmModalCloseOnDirty } from '@/layout/hooks/useConfirmModalCloseOnDirtyFields';
import { extractAppNameFromStliteCode } from '../utils';
import { useLayoutActions } from '@/store/layout';
import { useRouter } from 'next-nprogress-bar';
import { decodeEntityWithMetadata } from '@/app/api/utils';

interface FormValues {
  icon: string;
  name: string;
  description?: string;
}

interface Props extends ModalProps {
  project: Project;
  messageId?: string;
  code?: string;
}

export function CreateAppModal({ project, messageId, code, ...props }: Props) {
  const { onRequestClose } = props;
  const id = useId();
  const { onRequestCloseSafe } = useModalControl();
  const { setLayout } = useLayoutActions();

  const {
    mutateAsync: mutateSave,
    isError: isSaveError,
    error: saveError,
  } = useCreateArtifact({
    project,
    onSaveSuccess: (artifact) => {
      setLayout({
        navbarProps: {
          type: 'app-builder',
          artifact: decodeEntityWithMetadata<Artifact>(artifact),
        },
      });

      onRequestClose();

      window.history.pushState(
        null,
        '',
        `/${project.id}/apps/builder/a/${artifact.id}`,
      );
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name: extractAppNameFromStliteCode(code ?? '') },
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
