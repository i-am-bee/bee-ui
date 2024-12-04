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

export type MessageCreateBody = NonNullable<
  paths['/v1/threads/{thread_id}/messages']['post']['requestBody']['content']['application/json']
>;

export type MessagesListResponse = NonNullable<
  paths['/v1/threads/{thread_id}/messages']['get']['responses']['200']['content']['application/json']
>;

export type MessagesListQuery = NonNullable<
  paths['/v1/threads/{thread_id}/messages']['get']['parameters']['query']
>;

export type MessageUpdateBody = NonNullable<
  paths['/v1/threads/{thread_id}/messages/{message_id}']['post']['requestBody']
>['content']['application/json'];

export type MessageResult = MessagesListResponse['data'][number];

export type MessageAttachments = NonNullable<MessageCreateBody['attachments']>;

const MessageFeedbackCategories = [
  'inaccurate',
  'not_relevant',
  'offensive_harmful',
  'knowledge_gap',
  'other_content',
  'too_long',
  'too_short',
  'wrong_tone',
  'wrong_format',
  'other_style',
  'correct_content',
  'correct_style',
  'accuracy',
  'sophistication',
  'information_retrieval',
  'comprehensiveness',
  'latency',
] as const;

export type MessageFeedbackCategories =
  (typeof MessageFeedbackCategories)[number];

export type MessageFeedback = {
  categories?: MessageFeedbackCategories[];
  comment?: string;
  vote?: 'up' | 'down';
};
