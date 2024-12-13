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

import fetchRetry from 'fetch-retry';
import { StatusCodes } from 'http-status-codes';
import createClient from 'openapi-fetch';
import type { paths } from './extended-schema';

export let API_URL = process.env.API_URL ?? '/api/';
if (!API_URL.endsWith('/')) {
  API_URL += '/';
}

export const client = createApiClient<paths>(API_URL);

client.use({
  onRequest: (req) => {
    if (req.method.toLocaleLowerCase() === 'delete') {
      req.headers.delete('Content-Type');
    }

    return req;
  },
});

export function createApiClient<T extends Record<string, any>>(
  baseUrl: string,
  path?: string,
) {
  return createClient<T>({
    baseUrl: `${baseUrl}${path ?? ''}`,
    fetch: fetchRetry(fetch, {
      retryOn: (_, __, response) => {
        // Concurrency limits (due to external factors) are hit
        if (response?.status === StatusCodes.TOO_MANY_REQUESTS) {
          const resetDuration = response?.headers.get('ratelimit-reset');
          return (
            !resetDuration || Number(resetDuration) < RETRY_ON_RESET_THRESHOLD
          );
        }

        const retryCodes = [
          StatusCodes.BAD_GATEWAY,
          StatusCodes.SERVICE_UNAVAILABLE,
          StatusCodes.CONFLICT,
          StatusCodes.GATEWAY_TIMEOUT,
          StatusCodes.REQUEST_TIMEOUT,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ];

        return Boolean(response && retryCodes.includes(response.status));
      },
      retryDelay: function (attempt) {
        return Math.pow(2, attempt) * 1000;
      },
    }),
  });
}

const RETRY_ON_RESET_THRESHOLD = 5; // seconds
