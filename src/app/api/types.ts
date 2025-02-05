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

import type { components } from './schema';

export type ApiErrorResponse = components['schemas']['ErrorResponse'];

export type ApiErrorCode = ApiErrorResponse['error']['code'];

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

export interface DataItemWithId {
  id: string;
}
export interface ListDataResponse {
  data: DataItemWithId[];
  first_id: string | null;
  has_more: boolean;
  last_id: string | null;
  total_count: number;
}

export const METADATA_MAX_LENGTH = 512;
