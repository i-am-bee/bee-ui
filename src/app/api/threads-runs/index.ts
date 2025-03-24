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
import { RunsListQuery, RunStepsListQuery, RunUpdateBody } from './types';

export async function listRuns(
  organizationId: string,
  projectId: string,
  threadId: string,
  query?: RunsListQuery,
) {
  const res = await client.GET('/v1/threads/{thread_id}/runs', {
    params: {
      path: { thread_id: threadId },
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function readRun(
  organizationId: string,
  projectId: string,
  threadId: string,
  runId: string,
) {
  const res = await client.GET('/v1/threads/{thread_id}/runs/{run_id}', {
    params: {
      path: { thread_id: threadId, run_id: runId },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function cancelRun(
  organizationId: string,
  projectId: string,
  threadId: string,
  runId: string,
) {
  const res = await client.POST(
    '/v1/threads/{thread_id}/runs/{run_id}/cancel',
    {
      params: { path: { thread_id: threadId, run_id: runId } },
      body: {} as unknown as undefined,
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function updateRun(
  organizationId: string,
  projectId: string,
  threadId: string,
  runId: string,
  body: RunUpdateBody,
) {
  const res = await client.POST('/v1/threads/{thread_id}/runs/{run_id}', {
    params: {
      path: {
        thread_id: threadId,
        run_id: runId,
      },
    },
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listRunSteps(
  organizationId: string,
  projectId: string,
  threadId: string,
  runId: string,
  query?: RunStepsListQuery,
) {
  const res = await client.GET('/v1/threads/{thread_id}/runs/{run_id}/steps', {
    params: {
      path: { thread_id: threadId, run_id: runId },
      query,
    },
    headers: getRequestHeaders(organizationId, projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}

export async function readTrace(
  organizationId: string,
  projectId: string,
  threadId: string,
  runId: string,
) {
  const res = await client.GET('/v1/threads/{thread_id}/runs/{run_id}/trace', {
    params: {
      path: { thread_id: threadId, run_id: runId },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });

  assertSuccessResponse(res);
  return res.data;
}
