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

import { isNotNull } from '@/utils/helpers';
import { FetchResponse, HeadersOptions } from 'openapi-fetch';
import {
  ApiError,
  HttpError,
  UnauthenticatedError,
  UnauthorizedError,
} from './errors';
import {
  ApiErrorResponse,
  ApiMetadata,
  DataItemWithId,
  EntityMetadata,
  EntityResultWithMetadata,
  EntityWithEncodedMetadata,
} from './types';
import has from 'lodash/has';

export async function maybeGetJsonBody(response: Response): Promise<unknown> {
  const body = await response.text();
  try {
    const data = JSON.parse(body);
    return data;
  } catch {
    // noop
  }
  return body;
}

export function handleFailedResponse(response: Response, body: unknown): never {
  if (typeof body === 'object') {
    const data = body as unknown as ApiErrorResponse;
    if (response.status === 401) {
      throw new UnauthenticatedError('You are not authenticated.', response);
    }

    if (response.status === 403 && data.error.code === 'auth_error') {
      throw new UnauthorizedError('You are not authorized.', response);
    }
    throw new ApiError(response, data);
  }
  throw new Error('Invalid response from server', {
    cause: new HttpError(response, body),
  });
}

type SucessFetchResponse<T, O> = Extract<
  FetchResponse<T, O>,
  { error?: never }
>;

export function assertSuccessResponse<T, O>(
  res: FetchResponse<T, O>,
): asserts res is SucessFetchResponse<T, O> {
  if (res.error != null) {
    handleFailedResponse(res.response, res.error);
  }
}

const API_KEY_PREFIX = '$ui_';

export function encodeMetadata<T extends EntityMetadata>(
  metadata?: T,
): ApiMetadata {
  const encoded: ApiMetadata = {};

  for (const clientKey in metadata) {
    const value = metadata[clientKey];
    const apiKey = `${API_KEY_PREFIX}${clientKey}`;

    if (isNotNull(value)) {
      if (typeof value === 'boolean' || typeof value === 'object') {
        try {
          encoded[apiKey] = JSON.stringify(value);
        } catch {
          encoded[apiKey] = String(value);
        }
      } else {
        encoded[apiKey] = String(value);
      }
    }
  }

  return encoded;
}

export function decodeMetadata<T extends EntityMetadata>(
  metadata?: ApiMetadata | null,
): T {
  const decoded: EntityMetadata = {};

  for (const apiKey in metadata) {
    const value = metadata[apiKey];
    const clientKey = apiKey.startsWith(API_KEY_PREFIX)
      ? apiKey.slice(API_KEY_PREFIX.length)
      : apiKey;

    if (isNotNull(value)) {
      try {
        const parsedValue = JSON.parse(value);

        decoded[clientKey] = isNotNull(parsedValue) ? parsedValue : value;
      } catch {
        decoded[clientKey] = value;
      }
    }
  }

  return decoded as T;
}

export function decodeEntityWithMetadata<
  T extends { uiMetadata: EntityMetadata },
>(apiEntity: EntityResultWithMetadata<T>): T {
  const { metadata, ...rest } = apiEntity;

  return {
    ...rest,
    uiMetadata: decodeMetadata<T['uiMetadata']>(metadata),
  } as T;
}

export function encodeEntityWithMetadata<
  T extends { uiMetadata: EntityMetadata },
>(entity: T): EntityWithEncodedMetadata<T> {
  const { uiMetadata, ...rest } = entity;

  return { ...rest, metadata: encodeMetadata<T['uiMetadata']>(uiMetadata) };
}

export function getProjectHeaders(organizationId: string, projectId?: string) {
  return {
    'x-organization': organizationId,
    ...(projectId ? { 'x-project': projectId } : undefined),
  };
}

export function getRequestHeaders(
  organizationId: string,
  projectId?: string,
  additionalHeaders?: HeadersOptions,
) {
  return {
    ...getProjectHeaders(organizationId, projectId),
    ...additionalHeaders,
  };
}

export type FetchParamsOrderBy<
  K extends { order_by?: string; order?: string },
> = Pick<K, 'order_by' | 'order'>;

export const MAX_API_FETCH_LIMIT = 100;
