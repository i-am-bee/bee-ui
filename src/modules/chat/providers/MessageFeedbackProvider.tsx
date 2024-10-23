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

import { MessageFeedback } from '@/app/api/threads-messages/types';
import { ThreadRun } from '@/app/api/threads-runs/types';
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { FormState, UseFormReturn } from 'react-hook-form';
import {
  MESSAGE_FEEDBACK_FORM_DEFAULTS,
  useMessageFeedbackForm,
} from '../message/feedback/useMessageFeedbackForm';
import { useChat } from './ChatProvider';

export type MessageFeedbackContextValue = {
  onVoteClick: (vote: Vote) => void;
  currentVote?: Vote;
  form: UseFormReturn<MessageFeedback>;
  formOpen: boolean;
  closeForm: () => void;
  run?: ThreadRun;
  onSubmit: (
    values: MessageFeedback,
    onSuccess?: (feedback?: MessageFeedback) => void,
  ) => Promise<MessageFeedback | undefined>;
  formState: FormState<MessageFeedback>;
  setFormOpen: Dispatch<SetStateAction<boolean>>;
};

export const MessageFeedbackContext =
  createContext<MessageFeedbackContextValue>(
    null as unknown as MessageFeedbackContextValue,
  );

interface Props {
  run?: ThreadRun;
}

type Vote = NonNullable<MessageFeedback['vote']>;

export function MessageFeedbackProvider({
  run,
  children,
}: PropsWithChildren<Props>) {
  const { thread } = useChat();
  const [formOpen, setFormOpen] = useState(false);
  const { form, onSubmit } = useMessageFeedbackForm({
    threadId: thread?.id ?? null,
    run,
  });
  const { formState } = form;
  const currentVote = form.getValues('vote');

  const closeForm = useCallback(() => {
    setFormOpen(false);
    form.reset();
  }, [form]);

  const onVoteClick = useCallback(
    (vote: Vote) => {
      if (currentVote !== vote) {
        form.reset({
          ...MESSAGE_FEEDBACK_FORM_DEFAULTS,
          vote,
        });

        form.handleSubmit(async () => {
          await onSubmit({ vote });
        })();
      }

      if (vote === 'down') {
        if (formOpen) {
          closeForm();
        } else {
          setFormOpen(true);
        }
      }
    },
    [currentVote, onSubmit, form, formOpen, closeForm],
  );

  const contextValue = useMemo(
    () => ({
      run,
      onVoteClick,
      currentVote,
      form,
      formOpen,
      closeForm,
      onSubmit,
      formState,
      setFormOpen,
    }),
    [
      run,
      onVoteClick,
      currentVote,
      form,
      formOpen,
      closeForm,
      onSubmit,
      formState,
      setFormOpen,
    ],
  );

  return (
    <MessageFeedbackContext.Provider value={contextValue}>
      {children}
    </MessageFeedbackContext.Provider>
  );
}

export function useMessageFeedback() {
  const context = use(MessageFeedbackContext);

  if (!context) {
    throw new Error(
      'useMessageFeedback must be used within a MessageFeedbackProvider',
    );
  }

  return context;
}
