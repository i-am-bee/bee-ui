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

import { client } from '../client';
import { assertSuccessResponse, getRequestHeaders } from '../utils';
import { FileCreateBody } from './types';

export async function createFile(
  organizationId: string,
  projectId: string,
  body: Omit<FileCreateBody, 'file'> & { file: File },
) {
  const res = await client.POST('/v1/files', {
    body: body as unknown as FileCreateBody,
    headers: getRequestHeaders(organizationId, projectId),
    bodySerializer: (body) => {
      const formData = new FormData();

      formData.append('purpose', body.purpose);
      if (body.depends_on_thread_id)
        formData.append('depends_on_thread_id', body.depends_on_thread_id);
      formData.append('file', body.file);

      return formData;
    },
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readFile(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.GET('/v1/files/{file_id}', {
    params: {
      path: {
        file_id: id,
      },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteFile(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.DELETE('/v1/files/{file_id}', {
    params: {
      path: {
        file_id: id,
      },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readFileContent(
  organizationId: string,
  projectId: string,
  id: string,
): Promise<string | null> {
  const res = await client.GET('/v1/files/{file_id}/content', {
    params: {
      path: {
        file_id: id,
      },
    },
    headers: getRequestHeaders(organizationId, projectId),
    parseAs: 'blob',
  });
  assertSuccessResponse(res);
  if (!res.data) return null;
  const reader = new FileReader();
  reader.readAsDataURL(res.data);
  return new Promise((resolve) => {
    reader.onloadend = () => {
      resolve(String(reader.result));
    };
  });
}
