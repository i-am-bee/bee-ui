import { BounceButton } from '@/components/BounceLink/BounceButton';
import { Container } from '@/components/Container/Container';
import { CurrentUserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useAppContext } from '@/layout/providers/AppProvider';
import { AssistantIcon } from '@/modules/assistants/icons/AssistantIcon';
import { useUserProfile } from '@/store/user-profile';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusWithin, useHover } from 'react-aria';
import { useInView } from 'react-intersection-observer';
import { mergeRefs } from 'react-merge-refs';
import { PlanWithSources } from '../assistant-plan/PlanWithSources';
import { AttachmentsList } from '../attachments/AttachmentsList';
import { getThreadAssistantName } from '../history/useGetThreadAssistant';
import { useAssistantModal } from '../providers/AssistantModalProvider';
import { useChat } from '../providers/ChatProvider';
import { MessageFeedbackProvider } from '../providers/MessageFeedbackProvider';
import { RunProvider } from '../providers/RunProvider';
import { readRunQuery } from '../queries';
import { ChatMessage } from '../types';
import { ActionBar } from './ActionBar';
import { ErrorMessage } from './ErrorMessage';
import classes from './Message.module.scss';
import { AttachmentLink } from './markdown/AttachmentLink';
import { isBotMessage } from '../utils';
import { MessageContent } from './MessageContent';
import { AssistantDeltaParams } from '@/modules/assistants/builder/Builder';
import { Thread } from '@/app/api/threads/types';
import { ThreadRun } from '@/app/api/threads-runs/types';
import {
  getToolReference,
  getToolReferenceFromToolUsage,
  getToolUsageId,
} from '@/modules/tools/utils';

interface Props {
  message: ChatMessage;
  isPast?: boolean;
  isScrolled?: boolean;
  nextRunParams?: AssistantDeltaParams;
}

export const Message = memo(function Message({
  message,
  isPast,
  isScrolled,
  nextRunParams,
}: Props) {
  const contentRef = useRef<HTMLLIElement>(null);
  const { thread, builderState } = useChat();
  const { project } = useAppContext();
  const { setMessages } = useChat();
  const { ref: inViewRef, inView } = useInView({
    rootMargin: '30% 0%',
    triggerOnce: true,
  });

  const { data: run } = useQuery({
    ...readRunQuery(project.id, thread?.id ?? '', message.run_id ?? ''),
    enabled: Boolean(inView && thread && message.run_id),
  });

  useEffect(() => {
    if (run) {
      setMessages((messages) => {
        const messageToUpdate = messages.find(({ id }) => id === message.id);
        if (isBotMessage(messageToUpdate)) {
          messageToUpdate.run = run;
        }
      });
    }
  }, [message.id, run, setMessages]);

  // useEffect(() => {
  //   if (run) {
  //     setMessages((messages) => {
  //       const { thisMessage, nextMessage } = messages.reduce(
  //         (
  //           {
  //             thisMessage,
  //             nextMessage,
  //           }: {
  //             thisMessage: ChatMessage | null;
  //             nextMessage: ChatMessage | null;
  //           },
  //           item,
  //         ) => {
  //           if (item.id === message.id) {
  //             return { thisMessage: item, nextMessage: null };
  //           } else if (thisMessage != null && nextMessage == null) {
  //             return { thisMessage, nextMessage: null };
  //           }
  //           return { thisMessage, nextMessage };
  //         },
  //         { thisMessage: null, nextMessage: null },
  //       );
  //       if (isBotMessage(messageUpdate)) messageUpdate.run = run;
  //     });
  //   }
  // }, [message.id, run, setMessages]);

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
          className={clsx(classes.root, {
            [classes.hovered]: showActions,
            [classes.isBuilder]: builderState,
          })}
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
                <MessageContent message={message} />
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
        <Container size="sm">
          {run && nextRunParams && (
            <AssistantDelta run={run} nextRunParams={nextRunParams} />
          )}
        </Container>
      </RunProvider>
    </MessageFeedbackProvider>
  );
});

function Sender({ message }: { message: ChatMessage }) {
  const { role } = message;
  const name = useUserProfile((state) => state.name);
  const { assistant, builderState } = useChat();
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
        {assistantData && !builderState ? (
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

function AssistantDelta({
  run,
  nextRunParams,
}: {
  run: ThreadRun;
  nextRunParams?: AssistantDeltaParams;
}) {
  const deltaMessages = useMemo(() => {
    const deltaMessages = [];
    if (run.instructions != nextRunParams?.instructions)
      deltaMessages.push('Instructions updated');

    return deltaMessages;
  }, [nextRunParams?.instructions, run.instructions]);

  return (
    <ul className={classes.assistantDelta}>
      {deltaMessages.map((message, index) => (
        <li key={index}>
          <span>{message}</span>
        </li>
      ))}
    </ul>
  );
}

export function getAssistantDeltaParams({
  instructions,
  tools,
}: ThreadRun): AssistantDeltaParams {
  return {
    instructions,
    tools: tools.map((item) => getToolReferenceFromToolUsage(item)),
  };
}
