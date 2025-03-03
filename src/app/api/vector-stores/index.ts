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

import { fetchEntity } from '@/utils/fetchEntity';
import { client } from '../client';
import { assertSuccessResponse, getRequestHeaders } from '../utils';
import { VectorStoreCreateBody, VectorStoresListQuery } from './types';

export async function createVectorStore(
  organizationId: string,
  projectId: string,
  body: VectorStoreCreateBody,
) {
  const res = await client.POST('/v1/vector_stores', {
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateVectorStore(
  organizationId: string,
  projectId: string,
  id: string,
  body: VectorStoreCreateBody,
) {
  const res = await client.POST('/v1/vector_stores/{vector_store_id}', {
    params: { path: { vector_store_id: id } },
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readVectorStore(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.GET('/v1/vector_stores/{vector_store_id}', {
    params: { path: { vector_store_id: id } },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listVectorStores(
  organizationId: string,
  projectId: string,
  query: VectorStoresListQuery,
) {
  const res = await client.GET('/v1/vector_stores', {
    params: {
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteVectorStore(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.DELETE('/v1/vector_stores/{vector_store_id}', {
    params: {
      path: { vector_store_id: id },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function fetchVectorStore(
  organizationId: string,
  projectId: string,
  id?: string,
) {
  if (!id) return;

  return await fetchEntity(() =>
    readVectorStore(organizationId, projectId, id),
  );
}
