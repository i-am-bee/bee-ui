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
  organizationId: string,
  projectId: string,
  body: AssistantCreateBody,
) {
  const res = await client.POST('/v1/assistants', {
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function updateAssistant(
  organizationId: string,
  projectId: string,
  id: string,
  body: AssistantCreateBody,
) {
  const res = await client.POST('/v1/assistants/{assistant_id}', {
    params: { path: { assistant_id: id } },
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readAssistant(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.GET('/v1/assistants/{assistant_id}', {
    params: { path: { assistant_id: id } },
    headers: getRequestHeaders(organizationId, projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function listAssistants(
  organizationId: string,
  projectId: string,
  query: AssistantsListQuery,
) {
  const res = await client.GET('/v1/assistants', {
    params: {
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listLastAssistants(
  organizationId: string,
  projectId: string,
) {
  const res = await client.GET('/v1/ui/last_assistants', {
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteAssistant(
  organizationId: string,
  projectId: string,
  id: string,
) {
  const res = await client.DELETE('/v1/assistants/{assistant_id}', {
    params: {
      path: { assistant_id: id },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
}

export async function fetchAssistant(
  organizationId: string,
  projectId: string,
  id?: string,
) {
  if (!id) return;

  const assistant = await fetchEntity(() =>
    readAssistant(organizationId, projectId, id),
  );

  return assistant ? decodeEntityWithMetadata<Assistant>(assistant) : assistant;
}

export async function fetchThreadAssistant(
  organizationId: string,
  projectId: string,
  threadId: string,
  threadAssistantId?: string,
) {
  const threadAssistant: ThreadAssistant = { data: null };

  try {
    const assistantId =
      threadAssistantId ??
      (
        await listRuns(organizationId, projectId, threadId, {
          limit: 1,
          order: 'desc',
          order_by: 'created_at',
        })
      )?.data.at(0)?.assistant_id;

    threadAssistant.data =
      (await fetchAssistant(organizationId, projectId, assistantId)) ?? null;
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

export async function ensureAppBuilderAssistant(
  organizationId: string,
  projectId: string,
) {
  let result = null;
  try {
    result = (
      await listAssistants(organizationId, projectId, {
        limit: 1,
        agent: 'streamlit',
      })
    )?.data.at(0);

    if (!result) {
      result = await createAssistant(organizationId, projectId, {
        agent: 'streamlit',
        name: 'App Builder',
        tool_resources: undefined,
      });
    }
  } catch (error) {
    const apiError = handleApiError(error);

    if (apiError) {
      throw new ApiError(null, apiError);
    }
  }

  return result ? decodeEntityWithMetadata<Assistant>(result) : null;
}
