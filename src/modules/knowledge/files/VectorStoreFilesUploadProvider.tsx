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

import { createFile } from '@/app/api/files';
import { FileEntity } from '@/app/api/files/types';
import { createVectorStoreFile } from '@/app/api/vector-stores-files';
import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { useStateWithRef } from '@/hooks/useStateWithRef';
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
import { useWatchPendingVectorStoreFiles } from '../hooks/useWatchPendingVectoreStoreFiles';
import { vectorStoresFilesQuery } from '../queries';
import { Thread } from '@/app/api/threads/types';
import { useAppContext } from '@/layout/providers/AppProvider';

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
  vectorStoreId: string | null;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setVectorStoreId: Dispatch<SetStateAction<string | null>>;
  setFiles: Dispatch<SetStateAction<VectoreStoreFileUpload[]>>;
  onFileSubmit: (file: VectoreStoreFileUpload, thread?: Thread) => void;
}>({
  files: [],
  isPending: false,
  vectorStoreId: null,
  removeFile: noop,
  clearFiles: noop,
  setVectorStoreId: noop,
  setFiles: noop,
  onFileSubmit: noop,
});

interface Props {
  vectorStoreId?: string;
  projectId: string;
  onCreateFileSuccess?: (vectorStoreFile: VectorStoreFile) => void;
}

export const VectorStoreFilesUploadProvider = ({
  vectorStoreId: propsVectorStoreId,
  projectId,
  onCreateFileSuccess,
  children,
}: PropsWithChildren<Props>) => {
  const [files, setFiles] = useState<VectoreStoreFileUpload[]>([]);
  const [vectorStoreId, setVectorStoreId, vectorStoreIdRef] = useStateWithRef<
    string | null
  >(propsVectorStoreId ?? null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAppContext();

  const vectorStoreFiles = useWatchPendingVectorStoreFiles(
    organization.id,
    projectId,
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
              queryKey: [
                vectorStoresFilesQuery(
                  organization.id,
                  projectId,
                  vectorStoreId,
                ).queryKey.at(0),
              ],
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
    projectId,
    organization.id,
  ]);

  const { mutateAsync: mutateAddToVectorStore } = useMutation({
    mutationFn: ({
      vectorStoreId,
      inputFile,
    }: {
      vectorStoreId: string;
      inputFile: VectoreStoreFileUpload;
    }) =>
      createVectorStoreFile(organization.id, projectId, vectorStoreId, {
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
    meta: {
      errorTitle: 'Failed to add file to the knowledge base',
      includeErrorMessage: true,
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
      return await createFile(organization.id, projectId, {
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
        (file) => file.status === 'embedding' || file.status === 'uploading',
      ),
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
