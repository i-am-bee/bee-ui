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
  MessageAttachments,
  MessageResult,
} from '@/app/api/threads-messages/types';
import { Assistant } from '../assistants/types';
import { AssistantPlan, ThreadRun } from '@/app/api/threads-runs/types';
import { VectoreStoreFileUpload } from '../knowledge/files/VectorStoreFilesUploadProvider';
import { EntityWithDecodedMetadata } from '@/app/api/types';
import { Thread } from '@/app/api/threads/types';

export interface ThreadAssistant {
  name?: string;
  data: Assistant | null;
  isDeleted?: boolean;
}

export interface MessageMetadata {
  type?: 'code-update' | 'report-error';
}

export type Message = EntityWithDecodedMetadata<MessageResult, MessageMetadata>;

export type MessageWithFiles = MessageResult & {
  files?: Partial<VectoreStoreFileUpload>[];
};

export type ChatMessageBase = Omit<
  MessageWithFiles,
  'id' | 'content' | 'object' | 'metadata' | 'attachments'
> & {
  key: string;
  id?: string;
  content: string;
  error?: Error;
  attachments?: MessageAttachments | null;
};

export type UserChatMessage = ChatMessageBase & {
  role: 'user';
};

export type BotChatMessage = ChatMessageBase & {
  role: 'assistant';
  plan?: AssistantPlan;
  pending: boolean;
  previousRun?: ThreadRun;
  run?: ThreadRun;
};

export type ChatMessage = UserChatMessage | BotChatMessage;

export type ToolApprovalValue = 'always' | 'once' | 'decline';
