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
import { IconButton } from '@carbon/react';
import { ArrowDown } from '@carbon/react/icons';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ConversationHeader } from './ConversationHeader';
import classes from './ConversationView.module.scss';
import { FilesDropzone } from './layout/FilesDropzone';
import { InputBar } from './layout/InputBar';
import { Message } from './message/Message';
import { useChat, useChatMessages } from './providers/ChatProvider';
import { useFilesUpload } from './providers/FilesUploadProvider';
import clsx from 'clsx';
import { getNewRunSetup, getRunSetup, isBotMessage } from './utils';
import { BotChatMessage, ChatMessage } from './types';

export const ConversationView = memo(function ConversationView() {
  const { dropzone } = useFilesUpload();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const messages = useChatMessages();

  const {
    assistant,
    thread,
    builderState,
    topBarEnabled,
    initialAssistantMessage,
  } = useChat();

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
    });

    setIsScrolled(false);
  }, []);

  useEffect(() => {
    const bottomElement = bottomRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { root: scrollRef.current },
    );

    if (bottomElement) {
      observer.observe(bottomElement);
    }

    return () => {
      if (bottomElement) {
        observer.unobserve(bottomElement);
      }
    };
  }, []);

  const className = clsx(classes.root, {
    [classes.builderMode]: Boolean(builderState),
  });

  return (
    <div {...(dropzone ? dropzone.getRootProps({ className }) : { className })}>
      {topBarEnabled && <ConversationHeader />}

      <div className={classes.content} ref={scrollRef}>
        <div ref={bottomRef} />
        <ol className={classes.messages} aria-label="messages">
          {initialAssistantMessage && (
            <InitialBuilderMessage
              isPast={messages.length > 2}
              isScrolled={isScrolled}
              initialAssistantMessage={initialAssistantMessage}
            />
          )}
          {messages.map((msg, index, arr) => {
            const size = arr.length;
            const evenMessages = size % 2 === 0;
            const isPast = evenMessages ? index < size - 2 : index < size - 1;

            const nextBotMessage = isBotMessage(msg)
              ? arr.at(index + 2)
              : arr.at(index + 1);

            return (
              <Message
                key={msg.key}
                message={msg}
                isPast={isPast}
                isScrolled={isScrolled}
                nextRunSetup={
                  isBotMessage(nextBotMessage) && nextBotMessage.run
                    ? getRunSetup(nextBotMessage.run)
                    : undefined
                }
                currentSetup={
                  assistant.data && thread
                    ? getNewRunSetup(assistant.data, thread)
                    : undefined
                }
              />
            );
          })}
        </ol>
      </div>
      <div className={classes.bottom}>
        {isScrolled && (
          <IconButton
            label="Scroll to bottom"
            kind="secondary"
            size="sm"
            wrapperClasses={classes.toBottomButton}
            onClick={scrollToBottom}
          >
            <ArrowDown />
          </IconButton>
        )}

        {!assistant.isDeleted ? (
          <>
            <div className={classes.bottomHolder}>
              <Container size="sm">
                <InputBar
                  onMessageSubmit={() => {
                    requestAnimationFrame(() => {
                      scrollToBottom();
                    });
                  }}
                />
              </Container>
            </div>
            {dropzone?.isDragActive && <FilesDropzone />}
          </>
        ) : (
          <div className={classes.deletedAppBanner}>
            You are viewing session history from a deleted agent
          </div>
        )}
      </div>
    </div>
  );
});

function InitialBuilderMessage({
  isPast,
  isScrolled,
  initialAssistantMessage,
}: {
  isPast: boolean;
  isScrolled: boolean;
  initialAssistantMessage: string;
}) {
  const message: BotChatMessage = {
    content: initialAssistantMessage,
    created_at: 0,
    id: 'initial',
    key: 'initial',
    pending: false,
    role: 'assistant',
  };

  return <Message message={message} isPast={isPast} isScrolled={isScrolled} />;
}
