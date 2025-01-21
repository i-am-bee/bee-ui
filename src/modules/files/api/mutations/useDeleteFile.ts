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

import { deleteFile } from '@/app/api/files';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation } from '@tanstack/react-query';

export function useDeleteFile() {
  const { organization, project } = useAppContext();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteFile(organization.id, project.id, id),
  });

  return mutation;
}
