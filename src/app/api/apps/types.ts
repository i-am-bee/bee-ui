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

import { paths } from '../schema';

export type ChatCompletionResponse =
  paths['/v1/chat/completions']['post']['responses']['200']['content']['application/json'];

export type ChatCompletionCreateBody = NonNullable<
  paths['/v1/chat/completions']['post']['requestBody']
>['content']['application/json'];
