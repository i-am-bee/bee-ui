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

import { Artifact } from '@/modules/apps/types';
import { fetchEntity } from '@/utils/fetchEntity';
import { client } from '../client';
import {
  assertSuccessResponse,
  decodeEntityWithMetadata,
  getRequestHeaders,
} from '../utils';
import {
  ArtifactCreateBody,
  ArtifactsListQuery,
  ArtifactUpdateBody,
} from './types';

export async function createArtifact(
  projectId: string,
  body: ArtifactCreateBody,
) {
  const res = await client.POST('/v1/artifacts', {
    body,
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateArtifact(
  projectId: string,
  id: string,
  body: ArtifactUpdateBody,
) {
  const res = await client.POST('/v1/artifacts/{artifact_id}', {
    params: { path: { artifact_id: id } },
    body,
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readArtifact(projectId: string, id: string) {
  const res = await client.GET('/v1/artifacts/{artifact_id}', {
    params: { path: { artifact_id: id } },
    headers: getRequestHeaders(projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function readSharedArtifact(
  projectId: string,
  secret: string,
  id: string,
) {
  const res = await client.GET('/v1/artifacts/{artifact_id}/shared', {
    params: { path: { artifact_id: id }, query: { secret } },
    headers: getRequestHeaders(projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function listArtifacts(
  projectId: string,
  query: ArtifactsListQuery,
) {
  const res = await client.GET('/v1/artifacts', {
    params: {
      query,
    },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteArtifact(projectId: string, id: string) {
  const res = await client.DELETE('/v1/artifacts/{artifact_id}', {
    params: {
      path: { artifact_id: id },
    },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
}

export async function fetchArtifact(projectId: string, id?: string) {
  if (!id) return;

  const artifact = await fetchEntity(() => readArtifact(projectId, id));

  return artifact ? decodeEntityWithMetadata<Artifact>(artifact) : artifact;
}

export async function fetchSharedArtifact(
  projectId: string,
  id?: string,
  secret?: string,
) {
  if (!id || !secret) return;

  return await fetchEntity(() => readSharedArtifact(projectId, secret, id));
}
