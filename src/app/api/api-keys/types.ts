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

export type ApiKeysListResponse =
  ApiResponse<'/v1/organization/projects/{project_id}/api_keys'>;

export type ApiKeyResponse =
  ApiResponse<'/v1/organization/projects/{project_id}/api_keys/{api_key_id}'>;

export type ApiKeyDeleteResponse = ApiResponse<
  '/v1/organization/projects/{project_id}/api_keys/{api_key_id}',
  'delete'
>;

export type ApiKeyCreateBody =
  ApiRequestBody<'/v1/organization/projects/{project_id}/api_keys'>;

export type ApiKeysListQuery = ApiQuery<'/v1/organization/api_keys'>;
