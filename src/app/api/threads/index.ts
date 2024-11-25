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
import {
  assertSuccessResponse,
  decodeEntityWithMetadata,
  getRequestHeaders,
} from '../utils';
import {
  Thread,
  ThreadCreateBody,
  ThreadsListQuery,
  ThreadUpdateBody,
} from './types';

export async function listThreads(projectId: string, query: ThreadsListQuery) {
  const res = await client.GET('/v1/threads', {
    params: {
      query,
    },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readThread(projectId: string, id: string) {
  const res = await client.GET('/v1/threads/{thread_id}', {
    params: {
      path: {
        thread_id: id,
      },
    },
    headers: getRequestHeaders(projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function createThread(projectId: string, body: ThreadCreateBody) {
  const res = await client.POST('/v1/threads', {
    body,
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateThread(
  projectId: string,
  id: string,
  body: ThreadUpdateBody,
) {
  const res = await client.POST('/v1/threads/{thread_id}', {
    body,
    params: { path: { thread_id: id } },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteThread(projectId: string, id: string) {
  const res = await client.DELETE('/v1/threads/{thread_id}', {
    params: { path: { thread_id: id } },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function fetchThread(projectId: string, id: string) {
  const thread = await fetchEntity(() => readThread(projectId, id));

  return thread ? decodeEntityWithMetadata<Thread>(thread) : thread;
}
