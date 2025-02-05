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

import { createVectorStoreFile } from '@/app/api/vector-stores-files';
import { VectorStoreFileCreateResponse } from '@/app/api/vector-stores-files/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useVectorStoresQueries } from '..';
import { VectoreStoreFileUpload } from '../../files/VectorStoreFilesUploadProvider';

interface Props {
  onSuccess?: (
    data: VectorStoreFileCreateResponse | undefined,
    variables: VectorStoreFileCreateVariables,
  ) => void;
  onError?: (error: Error, variables: VectorStoreFileCreateVariables) => void;
}

interface VectorStoreFileCreateVariables {
  vectorStoreId: string;
  inputFile: VectoreStoreFileUpload;
}

export function useCreateVectorStoreFile({ onSuccess, onError }: Props = {}) {
  const { organization, project } = useWorkspace();
  const vectorStoresQueries = useVectorStoresQueries();

  const mutation = useMutation({
    mutationFn: ({
      vectorStoreId,
      inputFile,
    }: VectorStoreFileCreateVariables) =>
      createVectorStoreFile(organization.id, project.id, vectorStoreId, {
        file_id: inputFile.file?.id ?? '',
      }),
    onSuccess,
    onError,
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: false,
    },
  });

  return mutation;
}
