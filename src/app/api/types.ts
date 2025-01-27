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

import type { components, paths } from './schema';

export type ApiErrorResponse = components['schemas']['ErrorResponse'];

export type ApiErrorCode = ApiErrorResponse['error']['code'];

export type GenerateChatBody = NonNullable<
  paths['/v1/threads/{thread_id}/runs']['post']['requestBody']
>['content']['application/json'];

export type GenerateParams = Pick<GenerateChatBody, 'tools' | 'assistant_id'>;
export type AssistantTools = NonNullable<GenerateParams['tools']>;

export type GenerateChatResponse = NonNullable<
  paths['/v1/threads/{thread_id}/runs']['post']['responses']['200']['content']['text/event-stream']
>;

export type LinkPreview = {
  title: string;
  icon: string;
};

export type EntityMetadata = {
  [key: string]: any;
};

export type ApiMetadata = {
  [key: string]: string;
};

export type EntityResultWithMetadata<T> = Omit<T, 'uiMetadata'> & {
  metadata?: ApiMetadata | null;
};

export type EntityWithEncodedMetadata<T> = Omit<T, 'uiMetadata'> & {
  metadata: ApiMetadata;
};

export type EntityWithDecodedMetadata<T, M> = Omit<T, 'metadata'> & {
  uiMetadata: M;
};

export const METADATA_MAX_LENGTH = 512;
