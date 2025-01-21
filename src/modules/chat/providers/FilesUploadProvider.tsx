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
import { MessageAttachments } from '@/app/api/threads-messages/types';
import { Thread } from '@/app/api/threads/types';
import { useHandleError } from '@/layout/hooks/useHandleError';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useDeleteFile } from '@/modules/files/api/mutations/useDeleteFile';
import { isMimeTypeReadable } from '@/modules/files/utils';
import { useCreateVectorStore } from '@/modules/knowledge/api/mutations/useCreateVectorStore';
import { useDeleteVectorStoreFile } from '@/modules/knowledge/api/mutations/useDeleteVectorStoreFile';
import {
  useVectoreStoreFilesUpload,
  VectoreStoreFileUpload,
} from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { isNotNull, noop } from '@/utils/helpers';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DropzoneState,
  ErrorCode,
  FileRejection,
  useDropzone,
} from 'react-dropzone';
import { v4 as uuid } from 'uuid';

const FilesUploadContext = createContext<{
  files: VectoreStoreFileUpload[];
  attachments: MessageAttachments | null;
  isPending: boolean;
  hasFilesToUpload: boolean;
  dropzone?: DropzoneState;
  vectorStoreId: string | null;
  removeFile: (id: string) => void;
  reset: () => void;
  clearFiles: () => void;
  setVectorStoreId: Dispatch<SetStateAction<string | null>>;
  ensureThreadRef: MutableRefObject<() => Promise<Thread>> | null;
}>({
  files: [],
  attachments: null,
  isPending: false,
  hasFilesToUpload: false,
  vectorStoreId: null,
  removeFile: noop,
  reset: noop,
  clearFiles: noop,
  setVectorStoreId: noop,
  ensureThreadRef: null,
});

export const CHAT_MAX_FILES_UPLOAD = 5;

const ERROR_MESSAGES = {
  [ErrorCode.TooManyFiles]: `You may only upload ${CHAT_MAX_FILES_UPLOAD} files at a time.`,
};

export const FilesUploadProvider = ({ children }: PropsWithChildren) => {
  const { assistant, featureFlags } = useAppContext();
  const {
    files,
    setFiles,
    onFileSubmit,
    isPending,
    hasFilesToUpload,
    clearFiles,
    setVectorStoreId,
    vectorStoreId,
  } = useVectoreStoreFilesUpload();
  const [attachments, setAttachments] = useState<MessageAttachments | null>(
    null,
  );
  const handleError = useHandleError();
  const ensureThreadRef = useRef<() => Promise<Thread>>(() => {
    throw Error('Thread retrieval function not defined');
  });

  useEffect(() => {
    const attachments: MessageAttachments = files
      .map(({ file, isReadable }) => {
        if (!file) return null;

        return {
          file_id: file.id,
          tools: [
            { type: 'code_interpreter' as const },
            isReadable ? { type: 'system' as const, id: 'read_file' } : null,
          ].filter(isNotNull),
        };
      })
      .filter(isNotNull);

    setAttachments(attachments);
  }, [files]);

  const { mutateAsync: mutateCreateVectorStore } = useCreateVectorStore({
    onSuccess: (result) => {
      if (result) {
        setVectorStoreId(result.id);
      }
    },
  });
  const { mutateAsync: mutateDeleteFile } = useDeleteFile();
  const { mutateAsync: mutateDeleteStoreFile } = useDeleteVectorStoreFile();

  const removeFile = useCallback(
    (id: string) => {
      const fileToRemove = files.find((file) => file.id === id);
      const fileId = fileToRemove?.file?.id;
      if (fileId) {
        const vectorFileId = fileToRemove.vectorStoreFile?.id;
        if (vectorStoreId && vectorFileId)
          mutateDeleteStoreFile({ vectorStoreId, id: vectorFileId });

        mutateDeleteFile(fileId);
      }

      setFiles((files) => files.filter((file) => file.id !== id));
    },
    [files, setFiles, vectorStoreId, mutateDeleteStoreFile, mutateDeleteFile],
  );

  const onDropAccepted = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: VectoreStoreFileUpload[] = acceptedFiles.map((file) => ({
        id: uuid(),
        originalFile: file,
        status: 'new' as const,
        isReadable:
          featureFlags.Knowledge &&
          isMimeTypeReadable(file.type, featureFlags.TextExtraction),
      }));

      setFiles((files) => [...files, ...newFiles]);

      const isVectorStoreNeeded = newFiles.some((file) => file.isReadable);
      const thread = await ensureThreadRef.current();
      if (isVectorStoreNeeded && !vectorStoreId) {
        await mutateCreateVectorStore({
          depends_on: { thread: { id: thread.id } },
        });
      }

      newFiles.forEach((inputFile) => {
        onFileSubmit(inputFile, thread);
      });
    },
    [
      mutateCreateVectorStore,
      onFileSubmit,
      setFiles,
      vectorStoreId,
      featureFlags.Knowledge,
      featureFlags.TextExtraction,
    ],
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      const errors = fileRejections.reduce(
        (acc, { file, errors }) => {
          errors.forEach(({ code, message }) => {
            acc[code] = acc[code] || {
              files: [],
              message,
            };
            acc[code].files.push(file.name);
          });

          return acc;
        },
        {} as Record<string, { files: string[]; message: string }>,
      );

      Object.entries(errors).forEach(([code, { message }]) => {
        handleError(
          new Error(
            ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || message,
          ),
        );
      });
    },
    [handleError],
  );

  const reset = useCallback(() => {
    clearFiles();
    setVectorStoreId(null);
  }, [clearFiles, setVectorStoreId]);

  const dropzone = useDropzone({
    noClick: true,
    noKeyboard: true,
    maxFiles: CHAT_MAX_FILES_UPLOAD,
    disabled: !featureFlags.Files || !assistant,
    onDropAccepted,
    onDropRejected,
  });

  const value = useMemo(() => {
    return {
      files,
      attachments,
      isPending,
      hasFilesToUpload,
      dropzone,
      vectorStoreId,
      removeFile,
      reset,
      clearFiles,
      setVectorStoreId,
      ensureThreadRef,
    };
  }, [
    files,
    attachments,
    isPending,
    hasFilesToUpload,
    dropzone,
    vectorStoreId,
    removeFile,
    reset,
    clearFiles,
    setVectorStoreId,
  ]);

  return (
    <FilesUploadContext.Provider value={value}>
      {children}
    </FilesUploadContext.Provider>
  );
};

export const useFilesUpload = () => {
  const context = useContext(FilesUploadContext);

  if (!context) {
    throw new Error('useFiles must be used within a FilesUploadProvider');
  }
  return context;
};
