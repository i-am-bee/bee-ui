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

'use client';
import { Container } from '@/components/Container/Container';
import { useAppContext } from '@/layout/providers/AppProvider';
import { memo } from 'react';
import { AssistantIcon } from '../assistants/icons/AssistantIcon';
import classes from './EmptyChatView.module.scss';
import { AssistantAvatar } from './layout/AssistantAvatar';
import { FilesDropzone } from './layout/FilesDropzone';
import { InputBar } from './layout/InputBar';
import { SendMessageResult, useChat } from './providers/ChatProvider';
import { useFilesUpload } from './providers/FilesUploadProvider';
import { useUserProfile } from './providers/UserProfileProvider';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!;

interface Props {
  onMessageSent?: (result: SendMessageResult) => void;
}

export const EmptyChatView = memo(function EmptyChatView({
  onMessageSent,
}: Props) {
  const {
    dropzone: { isDragActive, getRootProps },
  } = useFilesUpload();
  const { firstName } = useUserProfile();
  const { assistant: appAssistant } = useAppContext();
  const { assistant: chatAssistant } = useChat();

  const assistant = chatAssistant.data ?? appAssistant;
  const assistantName = assistant?.name ?? APP_NAME;

  return (
    <div
      {...getRootProps({
        className: classes.root,
      })}
    >
      <Container size="sm" className={classes.content}>
        {assistant ? (
          <AssistantAvatar assistant={assistant} size="xl" />
        ) : (
          <AssistantIcon assistant={assistant} size="xl" />
        )}

        <div className={classes.heading}>
          <h1>
            Hi {firstName}, I&apos;m {assistantName}!
          </h1>
          <p>
            {assistant?.description
              ? assistant.description
              : 'How can I assist you?'}
          </p>
        </div>

        <div>
          <InputBar onMessageSent={onMessageSent} showSuggestions />
        </div>
      </Container>

      {isDragActive && <FilesDropzone />}
    </div>
  );
});
