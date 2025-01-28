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

import {
  createVectorStoreFile,
  deleteVectorStoreFile,
  listVectorStoreFiles,
} from '.';
import { paths } from '../schema';

export type VectorStoreFileCreateBody = NonNullable<
  paths['/v1/vector_stores/{vector_store_id}/files']['post']['requestBody']
>['content']['application/json'];

export type VectorStoreFilesListQuery = NonNullable<
  paths['/v1/vector_stores/{vector_store_id}/files']['get']['parameters']['query']
>;

export type VectorStoreFilesListQueryOrder = NonNullable<
  VectorStoreFilesListQuery['order']
>;

export type VectorStoreFilesCreateResponse = Awaited<
  ReturnType<typeof createVectorStoreFile>
>;

export type VectorStoreFilesDeleteResponse = Awaited<
  ReturnType<typeof deleteVectorStoreFile>
>;

export type VectorStoreFilesListResponse = NonNullable<
  Awaited<ReturnType<typeof listVectorStoreFiles>>
>;

export type VectorStoreFile =
  paths['/v1/vector_stores/{vector_store_id}/files/{file_id}']['get']['responses']['200']['content']['application/json'];
