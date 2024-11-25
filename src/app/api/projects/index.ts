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
import { ProjectCreateBody, ProjectsListQuery } from './types';

export async function createProject(body: ProjectCreateBody) {
  const res = await client.POST('/v1/organization/projects', {
    body,
    headers: getRequestHeaders(),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateProject(id: string, body: ProjectCreateBody) {
  const res = await client.POST('/v1/organization/projects/{project_id}', {
    params: { path: { project_id: id } },
    body,
    headers: getRequestHeaders(id),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readProject(id: string) {
  const res = await client.GET('/v1/organization/projects/{project_id}', {
    params: { path: { project_id: id } },
    headers: getRequestHeaders(),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function archiveProject(id: string) {
  const res = await client.POST(
    '/v1/organization/projects/{project_id}/archive',
    {
      params: { path: { project_id: id } },
      headers: getRequestHeaders(id, { 'Content-type': null as any }),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function listProjects(query: ProjectsListQuery) {
  const res = await client.GET('/v1/organization/projects', {
    params: {
      query,
    },
    headers: getRequestHeaders(),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function fetchProject(id: string) {
  return await fetchEntity(() => readProject(id));
}
