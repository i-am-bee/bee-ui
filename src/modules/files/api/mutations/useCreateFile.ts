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

import { createFile } from '@/app/api/files';
import { FileCreateResponse } from '@/app/api/files/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { VectoreStoreFileUpload } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { useMutation } from '@tanstack/react-query';

interface Props {
  onMutate?: (variables: FileCreateVariables) => void;
  onSuccess?: (
    data: FileCreateResponse | undefined,
    variables: FileCreateVariables,
  ) => void;
  onError?: (error: Error, variables: FileCreateVariables) => void;
}

interface FileCreateVariables {
  inputFile: VectoreStoreFileUpload;
  threadId?: string;
}

export function useCreateFile({ onMutate, onSuccess, onError }: Props = {}) {
  const { organization, project } = useAppContext();

  const mutation = useMutation({
    mutationFn: async ({ inputFile, threadId }: FileCreateVariables) =>
      createFile(organization.id, project.id, {
        file: inputFile.originalFile,
        purpose: 'assistants',
        depends_on_thread_id: threadId,
      }),
    onMutate,
    onSuccess,
    onError,
    meta: {
      errorToast: {
        title: 'Failed to upload file',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
