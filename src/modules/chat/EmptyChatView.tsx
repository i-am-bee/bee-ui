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
import { useUserProfile } from '@/store/user-profile';
import { memo } from 'react';
import { AssistantIcon } from '../assistants/icons/AssistantIcon';
import classes from './EmptyChatView.module.scss';
import { AssistantAvatar } from './layout/AssistantAvatar';
import { FilesDropzone } from './layout/FilesDropzone';
import { InputBar } from './layout/InputBar';
import { SendMessageResult, useChat } from './providers/ChatProvider';
import { useFilesUpload } from './providers/FilesUploadProvider';
import { Disclaimer } from './layout/Disclaimer';
import clsx from 'clsx';

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
  const firstName = useUserProfile((state) => state.firstName);
  const { assistant: appAssistant } = useAppContext();
  const { assistant: chatAssistant, builderState } = useChat();

  const assistant = chatAssistant.data ?? appAssistant;
  const assistantName =
    (builderState ? builderState.name : assistant?.name) ?? APP_NAME;
  const assistantDescription =
    (builderState ? builderState.description : assistant?.description) ??
    'How can I assist you?';

  return (
    <div
      {...getRootProps({
        className: clsx(classes.root, { [classes.builderMode]: builderState }),
      })}
    >
      <div className={classes.content}>
        <Container size="sm" className={classes.chat}>
          {builderState ? (
            <AssistantIcon
              assistant={assistant}
              initialLetter={builderState.name.at(0) ?? 'N'}
              color={builderState.icon?.color}
              iconName={builderState.icon?.name}
              size="xxl"
            />
          ) : assistant ? (
            <AssistantAvatar assistant={assistant} size="xxl" />
          ) : (
            <AssistantIcon assistant={assistant} size="xxl" />
          )}

          <div className={classes.heading}>
            <h1>
              Hi {firstName}, I&apos;m {assistantName}!
            </h1>
            <p>{assistantDescription}</p>
          </div>

          <div>
            <InputBar onMessageSent={onMessageSent} showSuggestions />
          </div>
        </Container>
      </div>

      <Disclaimer />

      {isDragActive && <FilesDropzone />}
    </div>
  );
});
