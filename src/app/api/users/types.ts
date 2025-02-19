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

import { ApiRequestBody, ApiResponse } from '@/@types/utils';
import { UserMetadata } from '@/store/user-profile/types';
import { EntityWithDecodedMetadata } from '../types';

export type UserResponse = ApiResponse<'/v1/users'>;

export type UserCreateBody = ApiRequestBody<'/v1/users'>;

export type UserUpdateBody = ApiRequestBody<'/v1/users', 'put'>;

export type UserEntity = EntityWithDecodedMetadata<UserResponse, UserMetadata>;
