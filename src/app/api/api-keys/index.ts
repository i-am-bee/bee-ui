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
import { ApiKeysCreateBody, ApiKeysListQuery } from './types';

export async function createApiKey(
  organizationId: string,
  projectId: string,
  body: ApiKeysCreateBody,
) {
  const res = await client.POST(
    '/v1/organization/projects/{project_id}/api_keys',
    {
      body,
      params: { path: { project_id: projectId } },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function listApiKeys(
  organizationId: string,
  query: ApiKeysListQuery,
) {
  const res = await client.GET('/v1/organization/api_keys', {
    params: {
      query,
    },
    headers: getRequestHeaders(organizationId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readApiKey(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.GET(
    '/v1/organization/projects/{project_id}/api_keys/{api_key_id}',
    {
      params: {
        path: { project_id: id, api_key_id: id },
      },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function updateApiKey(
  organizationId: string,
  projectId: string,
  id: string,
  body: ApiKeysCreateBody,
) {
  const res = await client.POST(
    '/v1/organization/projects/{project_id}/api_keys/{api_key_id}',
    {
      params: {
        path: { project_id: projectId, api_key_id: id },
      },
      body,
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteApiKey(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.DELETE(
    '/v1/organization/projects/{project_id}/api_keys/{api_key_id}',
    {
      params: {
        path: { project_id: projectId, api_key_id: id },
      },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
}
