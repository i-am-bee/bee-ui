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

export type MessagesListResponse =
  ApiResponse<'/v1/threads/{thread_id}/messages'>;

export type MessageResponse =
  ApiResponse<'/v1/threads/{thread_id}/messages/{message_id}'>;

export type MessageCreateBody =
  ApiRequestBody<'/v1/threads/{thread_id}/messages'>;

export type MessageUpdateBody =
  ApiRequestBody<'/v1/threads/{thread_id}/messages/{message_id}'>;

export type MessagesListQuery = ApiQuery<'/v1/threads/{thread_id}/messages'>;

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

export type MessageFeedbackCategory =
  (typeof MessageFeedbackCategories)[number];

export type MessageFeedback = {
  categories?: MessageFeedbackCategory[];
  comment?: string;
  vote?: 'up' | 'down';
};
