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

import { AssistantResult } from '@/app/api/assistants/types';
import {
  AssistantIconColor,
  AssitantIconName,
} from './icons/AssistantBaseIcon';
import { EntityWithDecodedMetadata } from '@/app/api/types';

export const STARTER_QUESTION_KEY_PREFIX = 'starterQuestion_';

export interface AssistantMetadata extends StarterQuestionsMetadata {
  icon?: AssitantIconName;
  color?: AssistantIconColor;
}

export type Assistant = EntityWithDecodedMetadata<
  AssistantResult,
  AssistantMetadata
>;

export interface StarterQuestionsMetadata {
  [key: `${typeof STARTER_QUESTION_KEY_PREFIX}${string}`]: string;
}
