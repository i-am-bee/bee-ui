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

'use client';

import { ApiError } from '@/app/api/errors';
import { createFile } from '@/app/api/files';
import { FileEntity } from '@/app/api/files/types';
import { Thread } from '@/app/api/threads/types';
import { createVectorStoreFile } from '@/app/api/vector-stores-files';
import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { UsageLimitModal } from '@/components/UsageLimitModal/UsageLimitModal';
import { useStateWithRef } from '@/hooks/useStateWithRef';
import { useHandleError } from '@/layout/hooks/useHandleError';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useToast } from '@/layout/providers/ToastProvider';
import { isNotNull, noop } from '@/utils/helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useVectorStoresQueries } from '../api';
import { useWatchPendingVectorStoreFiles } from '../api/queries/useWatchPendingVectoreStoreFiles';

export type VectoreStoreFileUpload = {
  id: string;
  originalFile: File;
  status: 'new' | 'uploading' | 'embedding' | 'complete';
  isReadable?: boolean;
  file?: FileEntity;
  vectorStoreFile?: VectorStoreFile;
};

const Context = createContext<{
  files: VectoreStoreFileUpload[];
  isPending: boolean;
  hasFilesToUpload: boolean;
  vectorStoreId: string | null;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setVectorStoreId: Dispatch<SetStateAction<string | null>>;
  setFiles: Dispatch<SetStateAction<VectoreStoreFileUpload[]>>;
  onFileSubmit: (file: VectoreStoreFileUpload, thread?: Thread) => void;
}>({
  files: [],
  isPending: false,
  hasFilesToUpload: false,
  vectorStoreId: null,
  removeFile: noop,
  clearFiles: noop,
  setVectorStoreId: noop,
  setFiles: noop,
  onFileSubmit: noop,
});

interface Props {
  vectorStoreId?: string;
  onCreateFileSuccess?: (vectorStoreFile: VectorStoreFile) => void;
}

export const VectorStoreFilesUploadProvider = ({
  vectorStoreId: propsVectorStoreId,
  onCreateFileSuccess,
  children,
}: PropsWithChildren<Props>) => {
  const [files, setFiles] = useState<VectoreStoreFileUpload[]>([]);
  const [vectorStoreId, setVectorStoreId, vectorStoreIdRef] = useStateWithRef<
    string | null
  >(propsVectorStoreId ?? null);
  const { addToast } = useToast();
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();
  const vectorStoresQueries = useVectorStoresQueries();

  const vectorStoreFiles = useWatchPendingVectorStoreFiles(
    vectorStoreId,
    files.map(({ vectorStoreFile }) => vectorStoreFile).filter(isNotNull),
  );

  useEffect(() => {
    files
      .filter(
        ({ status, vectorStoreFile }) =>
          status === 'embedding' && vectorStoreFile,
      )
      .forEach((file) => {
        const vectorStoreFile = vectorStoreFiles?.find(
          ({ id }) => id === file.vectorStoreFile?.id,
        );

        if (vectorStoreFile && vectorStoreFile.status !== 'in_progress') {
          if (vectorStoreFile.last_error) {
            addToast({
              title: `Processing of '${file.file?.filename}' was not successful.`,
              subtitle: vectorStoreFile.last_error.message,
              timeout: 6000,
            });
          }

          if (vectorStoreId) {
            queryClient.invalidateQueries({
              queryKey: vectorStoresQueries.filesLists(vectorStoreId),
            });
          }

          setFiles((files) =>
            files.map((item) =>
              item.id === file.id
                ? {
                    ...item,
                    status: 'complete',
                    vectorStoreFile,
                  }
                : item,
            ),
          );
        }
      });
  }, [
    addToast,
    files,
    vectorStoreFiles,
    queryClient,
    vectorStoreId,
    organization.id,
    project.id,
    vectorStoresQueries,
  ]);

  const handleError = useHandleError();
  const { openModal } = useModal();

  const { mutateAsync: mutateAddToVectorStore } = useMutation({
    mutationFn: ({
      vectorStoreId,
      inputFile,
    }: {
      vectorStoreId: string;
      inputFile: VectoreStoreFileUpload;
    }) =>
      createVectorStoreFile(organization.id, project.id, vectorStoreId, {
        file_id: inputFile.file?.id ?? '',
      }),
    onSuccess: (response, { inputFile }) => {
      if (!response) return;

      setFiles((files) =>
        files.map((file) =>
          file.id === inputFile.id
            ? {
                ...file,
                vectorStoreFile: response,
              }
            : file,
        ),
      );

      onCreateFileSuccess?.(response);
    },
    onError: (error, { inputFile }) => {
      removeFile(inputFile.id);
      if (error instanceof ApiError && error.code === 'too_many_requests') {
        openModal((props) => <UsageLimitModal {...props} />);
      } else {
        handleError(error, {
          toast: {
            title: 'Failed to add file to the knowledge base',
            includeErrorMessage: true,
          },
        });
      }
    },
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: false,
    },
  });

  const { mutateAsync: mutateCreateFile } = useMutation({
    mutationFn: async ({
      inputFile,
      thread,
    }: {
      inputFile: VectoreStoreFileUpload;
      thread?: Thread;
    }) => {
      return await createFile(organization.id, project.id, {
        file: inputFile.originalFile,
        purpose: 'assistants',
        depends_on_thread_id: thread?.id,
      });
    },
    onMutate: ({ inputFile }) => {
      inputFile.status = 'uploading';
      setFiles((files) =>
        files.map((file) => (file.id === inputFile.id ? inputFile : file)),
      );
    },
    onSuccess: (response, { inputFile }) => {
      if (!response) {
        removeFile(inputFile.id);
        return;
      }

      inputFile.file = response;

      const vectorStoreId = vectorStoreIdRef.current;
      if (vectorStoreId && inputFile.isReadable) {
        inputFile.status = 'embedding';
        mutateAddToVectorStore({ vectorStoreId, inputFile });
      } else {
        inputFile.status = 'complete';
      }

      setFiles((files) =>
        files.map((file) => (file.id === inputFile.id ? inputFile : file)),
      );
    },
    onError: (error, { inputFile }) => {
      removeFile(inputFile.id);
    },
    meta: {
      errorToast: {
        title: 'Failed to upload file',
        includeErrorMessage: true,
      },
    },
  });

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const removeFile = (id: string) =>
    setFiles((files) => files.filter((item) => id !== item.id));

  const value = useMemo(() => {
    return {
      files,
      isPending: files.some(
        (file) => file.status === 'uploading' || file.status === 'embedding',
      ),
      hasFilesToUpload: files.some((file) => file.status === 'new'),
      vectorStoreId,
      onFileSubmit: (inputFile: VectoreStoreFileUpload, thread?: Thread) => {
        if (inputFile.isReadable && !vectorStoreIdRef.current)
          throw Error('Vector store id is not set!');
        mutateCreateFile({ inputFile, thread });
      },
      clearFiles,
      setVectorStoreId,
      removeFile,
      setFiles,
    };
  }, [
    files,
    vectorStoreId,
    clearFiles,
    setVectorStoreId,
    vectorStoreIdRef,
    mutateCreateFile,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useVectoreStoreFilesUpload = () => {
  const context = useContext(Context);

  return context;
};
