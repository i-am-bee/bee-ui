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
import { AssistantPlan } from '@/app/api/threads-runs/types';
import { BounceButton } from '@/components/BounceLink/BounceButton';
import { Container } from '@/components/Container/Container';
import { Spinner } from '@/components/Spinner/Spinner';
import { CurrentUserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useAppContext } from '@/layout/providers/AppProvider';
import { AssistantIcon } from '@/modules/assistants/icons/AssistantIcon';
import { useUserProfile } from '@/store/user-profile';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import throttle from 'lodash/throttle';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusWithin, useHover } from 'react-aria';
import { useInView } from 'react-intersection-observer';
import { mergeRefs } from 'react-merge-refs';
import { PlanWithSources } from '../assistant-plan/PlanWithSources';
import { getLastCompletedStep } from '../assistant-plan/utils';
import { AttachmentsList } from '../attachments/AttachmentsList';
import { getThreadAssistantName } from '../history/useGetThreadAssistant';
import { useAssistantModal } from '../providers/AssistantModalProvider';
import { useChat } from '../providers/ChatProvider';
import { MessageFeedbackProvider } from '../providers/MessageFeedbackProvider';
import { RunProvider, useRunContext } from '../providers/RunProvider';
import { readRunQuery } from '../queries';
import { ChatMessage } from '../types';
import { ActionBar } from './ActionBar';
import { ErrorMessage } from './ErrorMessage';
import { MarkdownContent } from './MarkdownContent';
import classes from './Message.module.scss';
import { AttachmentLink } from './markdown/AttachmentLink';

interface Props {
  message: ChatMessage;
  isPast?: boolean;
  isScrolled?: boolean;
}

export const Message = memo(function Message({
  message,
  isPast,
  isScrolled,
}: Props) {
  const contentRef = useRef<HTMLLIElement>(null);
  const { thread } = useChat();
  const { project } = useAppContext();
  const { ref: inViewRef, inView } = useInView({
    rootMargin: '30% 0%',
    triggerOnce: true,
  });

  const { data: run } = useQuery({
    ...readRunQuery(project.id, thread?.id ?? '', message.run_id ?? ''),
    enabled: Boolean(inView && thread && message.run_id),
  });

  const isAssistant = message.role === 'assistant';
  const hasActions = isAssistant && !message.pending;

  const contentHover = useHover({});

  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setFocusWithin,
  });

  const showActions = isFocusWithin || contentHover.isHovered;

  const files = message.role === 'user' ? message.files : [];

  return (
    <MessageFeedbackProvider run={run}>
      <RunProvider run={run}>
        <li
          ref={mergeRefs([contentRef, inViewRef])}
          className={clsx(classes.root, { [classes.hovered]: showActions })}
          {...focusWithinProps}
          {...contentHover.hoverProps}
          onBlur={() => {
            setFocusWithin(false);
          }}
        >
          <Container size="sm" className={classes.container}>
            <div
              className={clsx(classes.holder, {
                [classes.user]: message.role === 'user',
                [classes.past]: isPast && !showActions,
                [classes.scrolled]: isScrolled,
              })}
            >
              <div className={classes.content}>
                <Sender message={message} />
                <Content message={message} />
              </div>

              {files && files.length > 0 && (
                <AttachmentsList className={classes.files}>
                  {files.map(({ file }) => {
                    return file ? (
                      <li key={file.id}>
                        <AttachmentLink
                          fileId={file.id}
                          filename={file.filename}
                          size="md"
                        />
                      </li>
                    ) : null;
                  })}
                </AttachmentsList>
              )}

              {isAssistant && (
                <PlanWithSources message={message} inView={inView} />
              )}

              {message.error != null && (
                <ErrorMessage
                  error={message.error}
                  message={message}
                  className={classes.error}
                  hideRetry={isPast}
                />
              )}
            </div>
            {hasActions && (
              <ActionBar
                visible={showActions}
                message={message}
                isPast={isPast}
              />
            )}
          </Container>
        </li>
      </RunProvider>
    </MessageFeedbackProvider>
  );
});

function Content({ message }: { message: ChatMessage }) {
  const { run } = useRunContext();

  if (message.role === 'assistant') {
    const hasContent = Boolean(message.content);

    if (!hasContent) {
      if (message.error != null) {
        return null;
      }

      const requiredAction =
        run?.status === 'requires_action' ? run.required_action : undefined;

      const submitToolOutputsInProgress =
        requiredAction?.type === 'submit_tool_outputs' ||
        message.plan?.steps?.some(
          ({ status, toolCalls }) =>
            status === 'in_progress' &&
            toolCalls.some(({ type }) => type === 'function'),
        );
      const submitToolApprovalsInProgress =
        requiredAction?.type === 'submit_tool_approvals';

      if (submitToolOutputsInProgress) {
        return (
          <blockquote>
            <p>
              A function tool call is in progress. I am waiting for a response
              from the user.
            </p>
          </blockquote>
        );
      } else if (submitToolApprovalsInProgress) {
        return null;
      }

      if (message.pending) {
        return <PendingThought plan={message.plan} />;
      }

      if (!message.plan?.pending) {
        return (
          <blockquote>
            <p className={classes.noContent}>No message from assistant</p>
          </blockquote>
        );
      }

      return null;
    }
    return (
      <blockquote>
        <MarkdownContent content={message.content} />
      </blockquote>
    );
  }
  return (
    <blockquote>
      <p>{message.content}</p>
    </blockquote>
  );
}

function Sender({ message }: { message: ChatMessage }) {
  const { role } = message;
  const name = useUserProfile((state) => state.name);
  const { assistant } = useChat();
  const { openAssistantModal } = useAssistantModal();

  const { data: assistantData } = assistant;

  if (role === 'user') {
    return (
      <figure>
        <CurrentUserAvatar />
        <figcaption>{name}</figcaption>
      </figure>
    );
  }
  if (role === 'assistant') {
    return (
      <figure>
        {assistantData ? (
          <BounceButton
            onClick={() => openAssistantModal(assistantData)}
            scale={0.875}
          >
            <AssistantIcon assistant={assistantData} size="lg" />
          </BounceButton>
        ) : (
          <AssistantIcon assistant={assistantData} size="lg" />
        )}

        <figcaption>{getThreadAssistantName(assistant)}</figcaption>
      </figure>
    );
  }
}

function PendingThought({ plan }: { plan?: AssistantPlan }) {
  const THROTTLE_WAIT = 2000;
  const [thought, setThought] = useState(null);
  const pendingThought = getLastCompletedStep(plan)?.thought;

  const updateThought = useMemo(
    () =>
      throttle((thought) => {
        setThought(thought);
      }, THROTTLE_WAIT),
    [],
  );

  useEffect(() => {
    updateThought(pendingThought);
  }, [pendingThought, updateThought]);

  useEffect(() => {
    return () => updateThought.cancel();
  }, [updateThought]);

  return thought ? (
    <blockquote>
      <p className={classes.loading}>
        <span>{thought}</span>
      </p>
    </blockquote>
  ) : (
    <blockquote>
      <p className={classes.loading}>
        <span>Thinking</span>&nbsp;
        <Spinner />
      </p>
    </blockquote>
  );
}
