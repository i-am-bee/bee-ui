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

import { ApiQuery, ApiRequestBody, ApiResponse } from '@/@types/utils';
import { FetchParamsOrderBy } from '../utils';

export type VectorStoresListResponse = ApiResponse<'/v1/vector_stores'>;

export type VectorStoreResponse =
  ApiResponse<'/v1/vector_stores/{vector_store_id}'>;

export type VectorStoreCreateResponse = ApiResponse<
  '/v1/vector_stores',
  'post'
>;

export type VectorStoreDeleteResponse = ApiResponse<
  '/v1/vector_stores/{vector_store_id}',
  'delete'
>;

export type VectorStoreCreateBody = ApiRequestBody<'/v1/vector_stores'>;

export type VectorStoresListQuery = ApiQuery<'/v1/vector_stores'>;

export type VectorStoresListQueryOrderBy =
  FetchParamsOrderBy<VectorStoresListQuery>;
