/**
 * Copyright 2025 IBM Corp.
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

import { paths } from '@/app/api/schema';

export type ApiResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path] & ('get' | 'post' | 'delete') = 'get',
  ContentType extends
    | 'application/json'
    | 'text/event-stream' = 'application/json',
> = paths[Path][Method] extends {
  responses: {
    200: {
      content: {
        'application/json'?: infer JSON;
        'text/event-stream'?: infer EventStream;
      };
    };
  };
}
  ? ContentType extends 'application/json'
    ? JSON extends Record<string, any>
      ? JSON
      : never
    : EventStream extends Record<string, any>
      ? EventStream
      : never
  : never;

export type ApiRequestBody<
  Path extends keyof paths,
  Method extends keyof paths[Path] &
    ('get' | 'post' | 'delete' | 'put') = 'post',
  ContentType extends
    | 'application/json'
    | 'multipart/form-data' = 'application/json',
> = paths[Path][Method] extends {
  requestBody?: {
    content: {
      'application/json'?: infer JSON;
      'multipart/form-data'?: infer FormData;
    };
  };
}
  ? ContentType extends 'application/json'
    ? JSON extends Record<string, any>
      ? JSON
      : never
    : FormData extends Record<string, any>
      ? FormData
      : never
  : never;

export type ApiQuery<
  Path extends keyof paths,
  Method extends keyof paths[Path] & 'get' = 'get',
> = paths[Path][Method] extends {
  parameters: { query?: infer Q };
}
  ? Q extends Record<string, any>
    ? Q
    : never
  : never;
