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

export type ArtifactsListResponse = ApiResponse<'/v1/artifacts'>;

export type ArtifactResponse = ApiResponse<'/v1/artifacts/{artifact_id}'>;

export type ArtifactDeleteResponse = ApiResponse<
  '/v1/artifacts/{artifact_id}',
  'delete'
>;

export type ArtifactCreateBody = ApiRequestBody<'/v1/artifacts'>;

export type ArtifactUpdateBody = ApiRequestBody<'/v1/artifacts/{artifact_id}'>;

export type ArtifactsListQuery = ApiQuery<'/v1/artifacts'>;

export type ArtifactsListQueryOrderBy = FetchParamsOrderBy<ArtifactsListQuery>;
