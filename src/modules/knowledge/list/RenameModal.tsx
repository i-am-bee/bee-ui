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

import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { updateVectorStore } from '@/app/api/vector-stores';
import { VectorStore } from '@/app/api/vector-stores/types';
import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useMutation } from '@tanstack/react-query';
import { CODE_ENTER } from 'keycode-js';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useVectorStoresQueries } from '../api';

interface Props extends ModalProps {
  vectorStore: VectorStore;
  project: Project;
  organization: Organization;
  onSuccess: (store: VectorStore) => void;
}

export function RenameModal({
  vectorStore,
  project,
  organization,
  onSuccess,
  ...props
}: Props) {
  const htmlId = useId();
  const vectorStoresQueries = useVectorStoresQueries();
  const { id, name } = vectorStore;

  const { mutateAsync } = useMutation({
    mutationFn: (newName: string) =>
      updateVectorStore(organization.id, project.id, id, { name: newName }),
    onSuccess: (store) => {
      store && onSuccess(store);
      props.onRequestClose();
    },
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: {
        title: 'Failed to rename the knowledge base',
        includeErrorMessage: true,
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name },
  });

  const onSubmit = async ({ name }: FormValues) => {
    await mutateAsync(name);
  };

  return (
    <Modal {...props}>
      <ModalHeader>
        <h2>Rename knowledge base</h2>
      </ModalHeader>
      <ModalBody>
        <TextInput
          id={`${htmlId}:name`}
          labelText="Knowledge base name"
          onKeyDown={(e) => e.code === CODE_ENTER && handleSubmit(onSubmit)()}
          {...register('name', { required: true })}
          data-modal-primary-focus
        />
      </ModalBody>
      <ModalFooter>
        <Button
          kind="secondary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <InlineLoading description="Saving..." />
          ) : (
            'Rename knowledge base'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface FormValues {
  name: string;
}
