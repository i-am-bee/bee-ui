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
import { VectorStoreFileCreateBody, VectorStoreFilesListQuery } from './types';

export async function listVectorStoreFiles(
  organizationId: string,
  projectId: string,
  storeId: string,
  query: VectorStoreFilesListQuery,
) {
  const res = await client.GET('/v1/vector_stores/{vector_store_id}/files', {
    params: {
      path: { vector_store_id: storeId },
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function createVectorStoreFile(
  organizationId: string,
  projectId: string,
  storeId: string,
  body: VectorStoreFileCreateBody,
) {
  const res = await client.POST('/v1/vector_stores/{vector_store_id}/files', {
    body,
    params: { path: { vector_store_id: storeId } },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteVectorStoreFile(
  organizationId: string,
  projectId: string,
  storeId: string,
  id: string,
) {
  const res = await client.DELETE(
    '/v1/vector_stores/{vector_store_id}/files/{file_id}',
    {
      params: {
        path: { vector_store_id: storeId, file_id: id },
      },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function readVectorStoreFile(
  organizationId: string,
  projectId: string,
  storeId: string,
  fileId: string,
) {
  const res = await client.GET(
    '/v1/vector_stores/{vector_store_id}/files/{file_id}',
    {
      params: { path: { vector_store_id: storeId, file_id: fileId } },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}
