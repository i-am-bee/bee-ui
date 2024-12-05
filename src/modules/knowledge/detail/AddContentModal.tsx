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
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@carbon/react';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { VectorStore } from '@/app/api/vector-stores/types';
import classes from '../create/CreateKnowledgeModal.module.scss';
import { KnowledgeFilesUpload } from '../files/KnowledgeFilesUpload';
import { useCallback, useEffect } from 'react';
import {
  useVectoreStoreFilesUpload,
  VectorStoreFilesUploadProvider,
} from '../files/VectorStoreFilesUploadProvider';
import { VectorStoreFile } from '@/app/api/vector-stores-files/types';

interface Props extends ModalProps {
  vectorStore: VectorStore;
  organizationId: string;
  projectId: string;
  onCreateSuccess: (vectorStoreFile?: VectorStoreFile) => void;
}

export function AddContentModal({
  vectorStore,
  organizationId,
  projectId,
  onCreateSuccess,
  ...props
}: Props) {
  const handleSuccess = () => {
    onCreateSuccess();
    props.onRequestClose();
  };

  return (
    <Modal {...props} className={classes.modal}>
      <ModalHeader>
        <h2>Add content to {vectorStore.name}</h2>
      </ModalHeader>
      <VectorStoreFilesUploadProvider
        organizationId={organizationId}
        projectId={projectId}
        vectorStoreId={vectorStore.id}
        onCreateFileSuccess={onCreateSuccess}
      >
        <AddContentModalContent onSuccess={handleSuccess} />
      </VectorStoreFilesUploadProvider>
    </Modal>
  );
}

function AddContentModalContent({ onSuccess }: { onSuccess: () => void }) {
  const { isPending, files, setFiles, onFileSubmit } =
    useVectoreStoreFilesUpload();

  const handleSubmit = useCallback(() => {
    files.forEach((file) => {
      onFileSubmit(file);
    });
  }, [files, onFileSubmit]);

  const isComplete =
    files.length && files.every((file) => file.status === 'complete');

  useEffect(() => {
    if (isComplete) onSuccess();
  }, [isComplete, onSuccess]);

  return (
    <>
      <ModalBody>
        <KnowledgeFilesUpload files={files} onSetFiles={setFiles} />
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <InlineLoading description="Adding files..." />
          ) : (
            'Add to knowledge base'
          )}
        </Button>
      </ModalFooter>
    </>
  );
}
