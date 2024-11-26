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

import { Assistant } from '@/modules/assistants/types';
import { ThreadAssistant } from '@/modules/chat/types';
import { fetchEntity } from '@/utils/fetchEntity';
import { checkErrorDigest, handleApiError } from '@/utils/handleApiError';
import { client } from '../client';
import { ApiError } from '../errors';
import { listRuns } from '../threads-runs';
import {
  assertSuccessResponse,
  decodeEntityWithMetadata,
  getRequestHeaders,
} from '../utils';
import { AssistantCreateBody, AssistantsListQuery } from './types';

export async function createAssistant(
  projectId: string,
  body: AssistantCreateBody,
) {
  const res = await client.POST('/v1/assistants', {
    body,
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateAssistant(
  projectId: string,
  id: string,
  body: AssistantCreateBody,
) {
  const res = await client.POST('/v1/assistants/{assistant_id}', {
    params: { path: { assistant_id: id } },
    body,
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readAssistant(projectId: string, id: string) {
  const res = await client.GET('/v1/assistants/{assistant_id}', {
    params: { path: { assistant_id: id } },
    headers: getRequestHeaders(projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function listAssistants(
  projectId: string,
  query: AssistantsListQuery,
) {
  const res = await client.GET('/v1/assistants', {
    params: {
      query,
    },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listLastAssistants(projectId: string) {
  const res = await client.GET('/v1/ui/last_assistants', {
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteAssistant(projectId: string, id: string) {
  const res = await client.DELETE('/v1/assistants/{assistant_id}', {
    params: {
      path: { assistant_id: id },
    },
    headers: getRequestHeaders(projectId),
  });
  assertSuccessResponse(res);
}

export async function fetchAssistant(projectId: string, id?: string) {
  if (!id) return;

  const assistant = await fetchEntity(() => readAssistant(projectId, id));

  return assistant ? decodeEntityWithMetadata<Assistant>(assistant) : assistant;
}

export async function fetchThreadAssistant(
  projectId: string,
  threadId: string,
  threadAssistantId?: string,
) {
  const threadAssistant: ThreadAssistant = { data: null };

  try {
    const assistantId =
      threadAssistantId ??
      (
        await listRuns(projectId, threadId, {
          limit: 1,
          order: 'desc',
          order_by: 'created_at',
        })
      )?.data.at(0)?.assistant_id;

    threadAssistant.data =
      (await fetchAssistant(projectId, assistantId)) ?? null;
  } catch (error) {
    if (
      (error instanceof ApiError && error.code === 'not_found') ||
      checkErrorDigest(error) === 'NEXT_NOT_FOUND'
    ) {
      threadAssistant.isDeleted = true;
    } else {
      const apiError = handleApiError(error);

      if (apiError) {
        throw new ApiError(null, apiError);
      }
    }
  }

  return threadAssistant;
}
