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
import { ToolCreateBody, ToolsListQuery, ToolUpdateBody } from './types';

export async function createTool(
  organizationId: string,
  projectId: string,
  body: ToolCreateBody,
) {
  const res = await client.POST('/v1/tools', {
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listTools(
  organizationId: string,
  projectId: string,
  query: ToolsListQuery,
) {
  const res = await client.GET('/v1/tools', {
    params: {
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readTool(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.GET('/v1/tools/{tool_id}', {
    params: {
      path: { tool_id: id },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateTool(
  organizationId: string,
  projectId: string,
  id: string,
  body: ToolUpdateBody,
) {
  const res = await client.POST('/v1/tools/{tool_id}', {
    params: {
      path: { tool_id: id },
    },
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteTool(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.DELETE('/v1/tools/{tool_id}', {
    params: {
      path: { tool_id: id },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}
