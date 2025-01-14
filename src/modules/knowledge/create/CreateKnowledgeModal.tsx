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

import { createVectorStore } from '@/app/api/vector-stores';
import {
  VectorStore,
  VectorStoreCreateBody,
} from '@/app/api/vector-stores/types';
import { Modal } from '@/components/Modal/Modal';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useToast } from '@/layout/providers/ToastProvider';
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { KnowledgeFilesUpload } from '../files/KnowledgeFilesUpload';
import {
  useVectoreStoreFilesUpload,
  VectorStoreFilesUploadProvider,
} from '../files/VectorStoreFilesUploadProvider';
import { useVectorStoresQueries } from '../queries';
import classes from './CreateKnowledgeModal.module.scss';

export interface CreateKnowledgeValues {
  name: string;
}

interface Props {
  onCreateVectorStore: (vectorStore: VectorStore) => void;
  onSuccess?: () => void;
}

export function CreateKnowledgeModal({
  onCreateVectorStore,
  onSuccess,
  ...props
}: Props & ModalProps) {
  const handleSucces = () => {
    onSuccess?.();
    props.onRequestClose();
  };
  return (
    <Modal {...props} className={classes.modal}>
      <ModalHeader>
        <h2>Create new knowledge base</h2>
      </ModalHeader>
      <VectorStoreFilesUploadProvider>
        <CreateKnowledgeModalContent
          onCreateVectorStore={onCreateVectorStore}
          onSuccess={handleSucces}
        />
      </VectorStoreFilesUploadProvider>
    </Modal>
  );
}

interface ContentProps {
  onSuccess: () => void;
  onCreateVectorStore: (vectorStore: VectorStore) => void;
}

function CreateKnowledgeModalContent({
  onCreateVectorStore,
  onSuccess,
}: ContentProps) {
  const { addToast } = useToast();
  const { organization, project } = useAppContext();
  const vectorStoresQueries = useVectorStoresQueries();
  const { files, setFiles, onFileSubmit, setVectorStoreId } =
    useVectoreStoreFilesUpload();

  const htmlId = useId();

  const { mutateAsync } = useMutation({
    mutationFn: (body: VectorStoreCreateBody) =>
      createVectorStore(organization.id, project.id, body),
    onSuccess: (response) => {
      if (response) {
        setVectorStoreId(response.id);
        onCreateVectorStore(response);
      }
    },
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: {
        title: 'Failed to create the knowledge base',
        includeErrorMessage: true,
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateKnowledgeValues>({});

  const onSubmit = handleSubmit(async ({ name }) => {
    if (!files.length) {
      addToast({ title: 'Add some files first.', timeout: 5000 });
      return;
    }

    const vectorStore = await mutateAsync({ name });
    if (!vectorStore) {
      addToast({ title: 'Vector store creation failed', timeout: 5000 });
      return;
    }

    setVectorStoreId(vectorStore.id);

    files.forEach((file) => {
      onFileSubmit(file);
    });
  });

  const isUploading = files.some((file) => file.status === 'uploading');
  const isEmbedding = files.some((file) => file.status === 'embedding');
  const isPending = isSubmitting || isUploading || isEmbedding;

  const isComplete =
    !isSubmitting &&
    files.length &&
    files.every((file) => file.status === 'complete');

  useEffect(() => {
    if (isComplete) onSuccess();
  }, [isComplete, onSuccess]);

  return (
    <>
      <ModalBody>
        <div className={classes.body}>
          <TextInput
            id={`${htmlId}:name`}
            labelText="Knowledge base name"
            disabled={isPending}
            {...register('name', { required: true })}
          />
          <KnowledgeFilesUpload
            files={files}
            onSetFiles={setFiles}
            disabled={isPending}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <InlineLoading
              description={
                isUploading
                  ? 'Uploading files...'
                  : isEmbedding
                    ? 'Embedding...'
                    : 'Creating knowledge base...'
              }
            />
          ) : (
            'Create'
          )}
        </Button>
      </ModalFooter>
    </>
  );
}
