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

import { createVectorStore, deleteVectorStore, listVectorStores } from '.';
import { paths } from '../schema';
import { FetchParamsOrderBy } from '../utils';

export type VectorStoreCreateBody = NonNullable<
  paths['/v1/vector_stores']['post']['requestBody']
>['content']['application/json'];

export type VectorStoreCreateResponse = NonNullable<
  Awaited<ReturnType<typeof createVectorStore>>
>;

export type VectorStoreDeleteResponse = NonNullable<
  Awaited<ReturnType<typeof deleteVectorStore>>
>;

export type VectorStoresListResponse = NonNullable<
  Awaited<ReturnType<typeof listVectorStores>>
>;

export type VectorStoresListQuery = NonNullable<
  paths['/v1/vector_stores']['get']['parameters']['query']
>;

export type VectorStore =
  paths['/v1/vector_stores/{vector_store_id}']['get']['responses']['200']['content']['application/json'];

export type VectorStoresListQueryOrderBy =
  FetchParamsOrderBy<VectorStoresListQuery>;
